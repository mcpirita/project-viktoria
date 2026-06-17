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
  type ResolvedImage,
  type ResolvedWork,
} from "@/lib/schema";

/** Корень контент-папки работ. */
const WORKS_DIR = path.join(process.cwd(), "src", "content", "works");
/** Манифест изображений фазы C (опциональный). */
const MANIFEST_PATH = path.join(process.cwd(), "content", "works.manifest.json");

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
 */
type ManifestShape = Record<string, ImageMeta>;

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
    const meta = manifest?.[manifestKey(slug, ref)];
    return meta ? { ref, meta } : { ref };
  });
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

  const [dirs, manifest] = await Promise.all([listWorkDirs(), loadManifest()]);

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
