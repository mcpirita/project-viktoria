/**
 * Data-слой портфолио. Единственная точка доступа к контенту работ.
 *
 * Источник на Фазе 1: plain `index.json` файлы в `src/content/works/<slug>/`,
 * валидируемые Zod'ом на build-time. При кривом контенте функции бросают
 * ошибку → падает `next build` (это и есть build-time валидация).
 *
 * Все публичные функции `async` УЖЕ СЕЙЧАС — под Фазу 2 (Keystatic Reader API)
 * поменяются только внутренности чтения, сигнатуры останутся теми же.
 *
 * Координация с фазой C (image-пайплайн):
 *   Если существует `content/works.manifest.json`, его метаданные
 *   (width/height/aspectRatio/blurDataURL/widths) подмешиваются к изображениям.
 *   Если манифеста ещё нет — работы отдаются без метаданных (graceful).
 *   Контракт манифеста — см. тип ManifestShape ниже.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  workSchema,
  CATEGORIES,
  type Category,
  type ImageMeta,
  type LoopManifestEntry,
  type LoopSrc,
  type ResolvedImage,
  type ResolvedWork,
} from "@/lib/schema";

/** Корень контент-папки работ. */
const WORKS_DIR = path.join(process.cwd(), "src", "content", "works");
/** Манифест изображений фазы C (опциональный). */
const MANIFEST_PATH = path.join(process.cwd(), "content", "works.manifest.json");
/** Публичная папка медиа работ (там же лежат лупы Фазы 1.5). */
const PUBLIC_WORKS_DIR = path.join(process.cwd(), "public", "works");

/**
 * Контракт манифеста (фаза C → фазы B/F).
 *
 * Структура: плоская карта `ключ изображения → метаданные`.
 * Ключ = "<slug>/<basename>", где <basename> — имя изображения БЕЗ
 * размер-суффикса и расширения (то же базовое имя, что в final[]/process[]).
 *   Пример ключа:  "bolt-whatever/still-01"
 *   Деривативы C кладёт в:
 *     public/works/bolt-whatever/still-01-{400,800,1200,2000}.{webp,avif}
 *
 *   Значение:
 *     {
 *       width:        number,    // натуральная ширина оригинала
 *       height:       number,    // натуральная высота
 *       aspectRatio:  number,    // width / height
 *       blurDataURL:  string,    // data: URI крошечного blur-плейсхолдера
 *       widths:       number[]   // [400, 800, 1200, 2000] — доступные деривативы
 *     }
 *
 * Если C предпочтёт другой формат ключа — единственное место правки — функция
 * `manifestKey()` ниже. Схема Work от манифеста не зависит.
 *
 * Фаза 1.5 (лупы): помимо записей-изображений манифест может содержать записи
 * лупов под ключом `works/<slug>/loop` со значением `LoopManifestEntry`
 * (`kind: "loop"`). Карта поэтому гетерогенна; различаем по полю `kind`.
 */
type ManifestEntry = ImageMeta | LoopManifestEntry;
type ManifestShape = Record<string, ManifestEntry>;

/** Type guard: запись манифеста — это луп (Фаза 1.5), а не изображение. */
function isLoopEntry(e: ManifestEntry | undefined): e is LoopManifestEntry {
  return !!e && (e as LoopManifestEntry).kind === "loop";
}

/**
 * Ключ изображения в манифесте: "works/<slug>/<basename без расширения>".
 * Согласовано с фазой C (`scripts/import-media.ts`): ключ = путь от `/public`
 * без размер-суффикса и расширения. `final[]`/`process[]` ссылаются на <name>
 * (или <name>.<ext>) — расширение срезаем.
 */
function manifestKey(slug: string, ref: string): string {
  const base = ref.replace(/\.(jpe?g|png|webp|avif|heic|tiff?)$/i, "");
  return `works/${slug}/${base}`;
}

// --- кэш чтения (build-time, в рамках одного процесса) -----------------------

let manifestCache: ManifestShape | null | undefined;
let worksCache: ResolvedWork[] | undefined;

/** Читает манифест один раз; null — если файла нет (graceful). */
async function loadManifest(): Promise<ManifestShape | null> {
  if (manifestCache !== undefined) return manifestCache;
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    manifestCache = JSON.parse(raw) as ManifestShape;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      manifestCache = null; // манифеста ещё нет — это норма на Фазе 1
    } else {
      throw new Error(
        `Не удалось прочитать манифест ${MANIFEST_PATH}: ${(err as Error).message}`,
      );
    }
  }
  return manifestCache;
}

/** Обогащает список ссылок-изображений метаданными из манифеста, если он есть. */
function resolveImages(
  slug: string,
  refs: string[],
  manifest: ManifestShape | null,
): ResolvedImage[] {
  return refs.map((ref) => {
    const entry = manifest?.[manifestKey(slug, ref)];
    // Только записи-изображения подмешиваем как meta; loop-записи игнорируем.
    const meta = isLoopEntry(entry) ? undefined : entry;
    return meta ? { ref, meta } : { ref };
  });
}

/**
 * Кэш списков файлов в `public/works/<slug>/` (build-time, один процесс).
 * Используется для автодетекта лупов по наличию файла — без ручного
 * редактирования index.json. `undefined` для несуществующей папки.
 */
let loopDirsCache: Map<string, Set<string>> | undefined;

/** Читает имена файлов всех под-папок public/works один раз (для автодетекта). */
async function loadLoopDirs(): Promise<Map<string, Set<string>>> {
  if (loopDirsCache) return loopDirsCache;
  const map = new Map<string, Set<string>>();
  let slugs: string[] = [];
  try {
    const entries = await fs.readdir(PUBLIC_WORKS_DIR, { withFileTypes: true });
    slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
    // public/works ещё нет — норма, лупов просто не будет (фолбэк на Vimeo).
  }
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const files = await fs.readdir(path.join(PUBLIC_WORKS_DIR, slug));
        map.set(slug, new Set(files));
      } catch {
        /* пропускаем нечитаемую папку */
      }
    }),
  );
  loopDirsCache = map;
  return map;
}

/**
 * Разрешает self-hosted луп работы (Фаза 1.5, стратегия A).
 *
 * Автодетект двухступенчатый, без правки index.json:
 *  1. Если в манифесте есть запись `works/<slug>/loop` (kind: "loop") —
 *     используем её URL'ы (Keystatic-совместимо, явный реестр деривативов).
 *  2. Иначе — детект по наличию файлов на диске: `loop-720.{webm,mp4}` в
 *     `public/works/<slug>/` → собираем `loopSrc` из конвенции путей
 *     (+ `loop-480.{webm,mp4}`, если оба есть).
 *
 * Возвращает `null`, если лупа нет → грид падает на Vimeo/YouTube-iframe-фолбэк.
 * Требуем ОБА формата (webm И mp4) — браузеру нужен совместимый источник;
 * частичный набор трактуем как «лупа нет» (безопаснее, чем битый <source>).
 */
function resolveLoop(
  slug: string,
  manifest: ManifestShape | null,
  dirs: Map<string, Set<string>>,
): LoopSrc | null {
  // 1. Манифест-запись (контракт с пайплайн-агентом make-loops.ts). Пути в
  //    манифесте — root-относительные без ведущего `/`; нормализуем в URL.
  const url = (p: string) => (p.startsWith("/") ? p : `/${p}`);
  const entry = manifest?.[`works/${slug}/loop`];
  if (isLoopEntry(entry) && entry.loop?.webm && entry.loop?.mp4) {
    return {
      webm: url(entry.loop.webm),
      mp4: url(entry.loop.mp4),
      ...(entry.loopMobile?.webm && entry.loopMobile?.mp4
        ? {
            loop480: {
              webm: url(entry.loopMobile.webm),
              mp4: url(entry.loopMobile.mp4),
            },
          }
        : {}),
    };
  }

  // 2. Автодетект по наличию файлов на диске.
  const files = dirs.get(slug);
  if (!files) return null;
  const has = (name: string) => files.has(name);
  if (!has("loop-720.webm") || !has("loop-720.mp4")) return null;

  const loop: LoopSrc = {
    webm: `/works/${slug}/loop-720.webm`,
    mp4: `/works/${slug}/loop-720.mp4`,
  };
  if (has("loop-480.webm") && has("loop-480.mp4")) {
    loop.loop480 = {
      webm: `/works/${slug}/loop-480.webm`,
      mp4: `/works/${slug}/loop-480.mp4`,
    };
  }
  return loop;
}

/** title → kebab-case slug (fallback, если slug не задан и не выводится из папки). */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Список под-папок работ (каждая = одна работа с index.json). */
async function listWorkDirs(): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(WORKS_DIR, { withFileTypes: true });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw err;
  }
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith(".")); // игнор .gitkeep-папок и т.п.
}

/** Полная загрузка + валидация + обогащение всех работ (build-time). */
async function loadAllWorks(): Promise<ResolvedWork[]> {
  if (worksCache) return worksCache;

  const [dirs, manifest, loopDirs] = await Promise.all([
    listWorkDirs(),
    loadManifest(),
    loadLoopDirs(),
  ]);

  const works = await Promise.all(
    dirs.map(async (dir): Promise<ResolvedWork> => {
      const file = path.join(WORKS_DIR, dir, "index.json");
      let raw: string;
      try {
        raw = await fs.readFile(file, "utf8");
      } catch {
        throw new Error(`Работа "${dir}": отсутствует ${file}`);
      }

      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        throw new Error(
          `Работа "${dir}": невалидный JSON в index.json — ${(err as Error).message}`,
        );
      }

      const parsed = workSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `Работа "${dir}": не прошла Zod-валидацию:\n${formatIssues(parsed.error)}`,
        );
      }

      const work = parsed.data;
      // slug: явный в файле → имя папки → из title.
      const slug = work.slug ?? dir ?? slugify(work.title);

      return {
        ...work,
        slug,
        final: resolveImages(slug, work.final, manifest),
        process: resolveImages(slug, work.process, manifest),
        loopSrc: resolveLoop(slug, manifest, loopDirs),
      };
    }),
  );

  // Сортировка: order ↑, затем title для стабильности.
  works.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  // Защита от дублей slug (ломают роут /work/[slug] на фазе H).
  const seen = new Set<string>();
  for (const w of works) {
    if (seen.has(w.slug)) {
      throw new Error(`Дубликат slug "${w.slug}" среди работ — slug'и должны быть уникальны.`);
    }
    seen.add(w.slug);
  }

  worksCache = works;
  return works;
}

/** Человекочитаемый вывод ошибок Zod (без зависимости от внутренней структуры v4). */
function formatIssues(error: import("zod").ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

// --- Публичный API -----------------------------------------------------------

/** Все работы, отсортированные по order. Валидация падает на кривом контенте. */
export async function getWorks(): Promise<ResolvedWork[]> {
  "use cache";
  return loadAllWorks();
}

/**
 * Курируемая выборка для grid-first главной. Возвращает работы с `featured: true`
 * в порядке `order`; если ни одна не помечена — первые `limit` работ по `order`
 * (разумный дефолт, чтобы главная не была пустой и не превращалась в «стену»).
 * Полный архив (все работы) остаётся за `getWorks()` — путь под «показать все».
 */
export async function getFeatured(limit = 12): Promise<ResolvedWork[]> {
  "use cache";
  const works = await loadAllWorks();
  const picked = works.filter((w) => w.featured);
  return (picked.length ? picked : works).slice(0, limit);
}

/** Одна работа по slug, либо undefined. */
export async function getWork(slug: string): Promise<ResolvedWork | undefined> {
  "use cache";
  const works = await loadAllWorks();
  return works.find((w) => w.slug === slug);
}

/**
 * Категории, реально присутствующие в контенте, в порядке canonical-списка
 * CATEGORIES (а не в порядке появления). Для фильтров витрины фазы F.
 */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  const works = await loadAllWorks();
  const present = new Set(works.map((w) => w.category));
  return CATEGORIES.filter((c) => present.has(c));
}
