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
 * Набор подтверждён Викторией (2026-06-17): commercial, music video,
 * editorial, film, theater, art. Порядок здесь = порядок фильтров в шапке.
 * Добавление категории = одна строка здесь.
 */
export const CATEGORIES = [
  "commercial",
  "music-video",
  "editorial",
  "film",
  "theater",
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
  /** Заголовок работы. Используется как fallback для slug. */
  title: z.string().min(1),
  /** Бренд/заказчик (подпись на сайте: Client, Title, Production). */
  client: z.string().min(1),
  /** Продакшн/агентство. Может быть пустым, пока Виктория не уточнила. */
  production: z.string().default(""),
  /** Категория-фильтр (enum, не роут). */
  category: categorySchema,
  /** Финальные кадры — имена изображений в public/works/<slug>/. */
  final: z.array(imageRefSchema).default([]),
  /** Backstage / process-кадры — имена изображений там же. */
  process: z.array(imageRefSchema).default([]),
  /** Опциональная ссылка на видео (YouTube/Vimeo/mp4) для VideoEmbed фазы G. */
  video: z.url().optional(),
  /** Порядок вывода: меньше = выше. */
  order: z.number().int().default(0),
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
