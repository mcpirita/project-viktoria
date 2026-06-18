/**
 * Zod-схема `Work` — единый источник истины для контент-модели портфолио.
 *
 * Типы выводятся из схемы через `z.infer`, никаких дублирующих интерфейсов.
 * Схема валидируется на build-time в `lib/works.ts`: кривой контент = падение `next build`.
 *
 * Формат файла-работы: один `index.json` на работу в `src/content/works/<slug>/`.
 *   Почему JSON:
 *     - тривиально валидируется Zod'ом (JSON.parse → schema.parse) без MDX-парсера;
 *     - `resolveJsonModule` уже включён в tsconfig — статический импорт/чтение надёжны;
 *     - Фаза-2 Keystatic Reader API одинаково хорошо читает JSON-коллекции;
 *     - картинки лежат отдельно в `public/works/<slug>/`, описаниям не нужен rich-text →
 *       MDX/Markdown избыточны на Фазе 1.
 *   Slug работы = имя папки (`<slug>/index.json`); поле `slug` в файле опционально и
 *   при отсутствии достраивается из `title` (см. lib/works.ts).
 */

import { z } from "zod";

/**
 * Категория работы. Это ПОЛЕ, а не роут (роутинг — зона фаз F/H).
 * Меню шапки (подтверждено Викторией 2026-06-18): commercial, costume,
 * set-props, music video, theatre. Порядок здесь = порядок пунктов меню.
 * costume/set-props/theater пока без работ — меню показывает их с заглушкой
 * «coming soon» (см. WorkGrid). editorial/film/art — резерв в enum, в меню не
 * выводятся (MENU в categories.ts). Добавление категории = одна строка здесь.
 */
export const CATEGORIES = [
  "commercial",
  "costume",
  "set-props",
  "music-video",
  "theater",
  "editorial",
  "film",
  "art",
] as const;

export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

/**
 * Идентификатор изображения внутри работы.
 *
 * Это НЕ путь с размер-суффиксом и НЕ зависимость от манифеста фазы C —
 * просто базовое имя файла-исходника (например "still-01" или "still-01.jpg").
 * Слой обогащения в lib/works.ts подмешает к нему метаданные из
 * `content/works.manifest.json`, если тот существует (graceful, опционально).
 *
 * Нормализация (срез расширения для согласования с ключами манифеста) —
 * на стороне lib/works.ts, чтобы схема оставалась «глупой» и независимой.
 */
const imageRefSchema = z.string().min(1);

export const workSchema = z.object({
  /**
   * Заголовок/название спота. Может быть пустым: для рекламных роликов без
   * отдельного имени карточка показывает клиента (Display = title || client),
   * а подпись на сайте просто опускает строку title.
   */
  title: z.string().default(""),
  /** Бренд/заказчик (подпись на сайте: Client, Title, Production). */
  client: z.string().min(1),
  /** Продакшн/агентство. Может быть пустым, пока Виктория не уточнила. */
  production: z.string().default(""),
  /** Категория-фильтр (enum, не роут). */
  category: categorySchema,
  /**
   * Роль Виктории на проекте (Production Designer / Art Director / Props…).
   * Источник — info-документы Виктории. Пустая строка = не указано.
   */
  role: z.string().default(""),
  /**
   * Съёмочная группа и партнёры — выводятся блоком кредитов в карточке проекта.
   * Все поля опциональны: показываем только заполненные строки.
   */
  credits: z
    .object({
      creativeDirector: z.string().optional(),
      director: z.string().optional(),
      producer: z.string().optional(),
      dop: z.string().optional(),
      /** Production Designer, если им был НЕ Виктория (тогда у неё другая роль). */
      productionDesigner: z.string().optional(),
      agency: z.string().optional(),
      starring: z.string().optional(),
    })
    .default({}),
  /**
   * Обложка работы для сетки на главной — имя одного кадра из `final`/`process`
   * (то же базовое имя, что в массивах). Если не задана — берётся первый
   * рендерящийся кадр (см. lib/works.ts / pickCover). Так Виктория/Дмитрий
   * выбирают «главное» фото проекта, не завися от порядка файлов.
   */
  cover: imageRefSchema.optional(),
  /** Финальные кадры — имена изображений в public/works/<slug>/. */
  final: z.array(imageRefSchema).default([]),
  /** Backstage / process-кадры — имена изображений там же. */
  process: z.array(imageRefSchema).default([]),
  /**
   * Опциональное видео для VideoEmbed (фаза G): либо полный URL YouTube/Vimeo,
   * либо root-относительный путь к самостоятельно захостенному файлу в /public
   * (например `/works/delta/img-9474.mp4`). Фасад (video/parse.ts) принимает оба.
   */
  video: z
    .string()
    .refine(
      (v) =>
        /^https?:\/\//i.test(v) ||
        /^\/.*\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i.test(v),
      "video: ожидается URL (YouTube/Vimeo) или root-относительный путь к видеофайлу (/works/.../file.mp4)",
    )
    .optional(),
  /**
   * С какой секунды мастер-видео резать петлю для грида (Фаза 1.5, пайплайн
   * `make-loops.ts`). Только подсказка для пайплайна — сам сайт это поле не
   * рендерит, он лишь проводит его наружу. По умолчанию 0 (с начала).
   */
  loopStart: z.number().min(0).default(0),
  /** Порядок вывода: меньше = выше. */
  order: z.number().int().default(0),
  /**
   * Курирование главной (grid-first). `true` — работа попадает в избранную
   * сетку на главной. Если ни одна работа не помечена — главная показывает
   * первые N по `order` (см. lib/works.ts → getFeatured). Полный архив —
   * отдельным путём (Фаза 2+).
   */
  featured: z.boolean().default(false),
  /** Slug работы. Если не задан — берётся имя папки / строится из title. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug должен быть kebab-case")
    .optional(),
});

/** Сырой `Work`, как лежит в index.json (до обогащения метаданными). */
export type Work = z.infer<typeof workSchema>;

/**
 * Метаданные изображения из манифеста фазы C (контракт координации).
 * Опциональны: код переживает отсутствие манифеста на Фазе 1.
 */
export type ImageMeta = {
  width: number;
  height: number;
  aspectRatio: number;
  blurDataURL: string;
  /** Доступные ширины деривативов (например [400, 800, 1200, 2000]). */
  widths: number[];
  /**
   * Тип кадра из манифеста фазы C: обычное фото или постер видео-работы.
   * Грид на главной по нему ставит маркер воспроизведения. Опционально —
   * старые манифесты могут не содержать поля.
   */
  kind?: "image" | "video-poster";
};

/** Обогащённое изображение: ссылка + (опционально) метаданные из манифеста. */
export type ResolvedImage = {
  /** Базовое имя/идентификатор изображения (как в final[]/process[]). */
  ref: string;
  /** Метаданные из works.manifest.json, если он существует. */
  meta?: ImageMeta;
};

/**
 * Self-hosted фоновый луп для грида (Фаза 1.5, стратегия A).
 *
 * Пайплайн (`scripts/make-loops.ts`) кладёт короткие сжатые петли в
 * `public/works/<slug>/loop-720.{webm,mp4}` (+ опц. `loop-480.{webm,mp4}` под
 * mobile) и регистрирует их в `content/works.manifest.json`. lib/works.ts
 * заполняет это поле **автодетектом по наличию файла** (см. resolveLoop) — без
 * ручного редактирования index.json (меньше трения, Keystatic-совместимо).
 *
 * Пути — root-относительные URL под `/public`, готовые к `<source src>`.
 * `null` (точнее, поле отсутствует) — лупа для работы нет → грид падает на
 * Vimeo/YouTube-iframe-фолбэк, как раньше.
 */
export type LoopSrc = {
  /** WebM (VP9/AV1) 720p — основной источник. */
  webm: string;
  /** MP4 (H.264) 720p — фолбэк для Safari/старых браузеров. */
  mp4: string;
  /** Опц. 480p-вариант (webm+mp4) под mobile/узкие экраны. */
  loop480?: { webm: string; mp4: string };
};

/**
 * Запись лупа в манифесте (контракт с пайплайн-агентом, Фаза 1.5).
 *
 * Ключ в манифесте: `works/<slug>/loop` (один на работу — в отличие от записей
 * изображений `works/<slug>/<basename>`). `kind: "loop"` отличает её от
 * `ImageMeta`. Пути в `loop`/`loopMobile` — относительные `/public` без
 * ведущего `/` (как `files` у постеров, напр. `works/delta/loop-720.webm`);
 * resolveLoop добавляет ведущий `/` при сборке `LoopSrc`.
 *
 * Манифест-запись опциональна: lib/works.ts всё равно автодетектит лупы по
 * наличию файлов на диске, так что грид оживёт, даже если запись забыли. Запись
 * нужна для Фазы 2 (Keystatic Reader читает манифест, не диск) и как явный
 * реестр деривативов, по аналогии с постерами. Формат — контракт с
 * `scripts/make-loops.ts` (он же писатель этой записи).
 */
export type LoopManifestEntry = {
  kind: "loop";
  width?: number;
  height?: number;
  aspectRatio?: number;
  durationSeconds?: number;
  widths?: number[];
  loop: { webm: string; mp4: string };
  loopMobile?: { webm: string; mp4: string };
  files?: string[];
};

/**
 * Финальный объект работы, который отдают функции lib/works.ts наружу.
 * Гарантированно содержит вычисленный `slug`, а `final`/`process` —
 * это `ResolvedImage[]` (с опциональными метаданными), а не голые строки.
 */
export type ResolvedWork = Omit<Work, "final" | "process" | "slug"> & {
  slug: string;
  final: ResolvedImage[];
  process: ResolvedImage[];
  /**
   * Self-hosted фоновый луп для грида, если он есть (Фаза 1.5). Заполняется
   * автодетектом в lib/works.ts. `null` → лупа нет, грид использует Vimeo-фолбэк.
   */
  loopSrc: LoopSrc | null;
};
