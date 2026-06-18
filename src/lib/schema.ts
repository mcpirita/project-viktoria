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
      director: z.string().optional(),
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
  /** Опциональная ссылка на видео (YouTube/Vimeo/mp4) для VideoEmbed фазы G. */
  video: z.url().optional(),
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
 * Финальный объект работы, который отдают функции lib/works.ts наружу.
 * Гарантированно содержит вычисленный `slug`, а `final`/`process` —
 * это `ResolvedImage[]` (с опциональными метаданными), а не голые строки.
 */
export type ResolvedWork = Omit<Work, "final" | "process" | "slug"> & {
  slug: string;
  final: ResolvedImage[];
  process: ResolvedImage[];
};
