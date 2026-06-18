import type { Category, LoopSrc } from "@/lib/schema";
import type { RenderableImage } from "./image";

/**
 * Serializable, client-ready shape for one work tile in the showcase grid. The
 * server page derives these from `ResolvedWork` (resolving the poster frame once)
 * and passes them to the `WorkGrid` client island. Keeping this lean avoids
 * shipping the full work payload to the client.
 */
export type IndexEntry = {
  slug: string;
  client: string;
  title?: string;
  production?: string;
  category: Category;
  /** Resolved poster frame, or null → placeholder block. */
  preview: RenderableImage | null;
  /**
   * Video work → tile shows a play marker. True when the work has a real video
   * link OR its poster frame is a `video-poster` (Phase C) OR its category is a
   * moving-image one (music-video). Photo works are false.
   */
  isVideo: boolean;
  /**
   * Real video URL (YouTube/Vimeo/mp4), when known. Present → the tile becomes a
   * click-to-play `<VideoEmbed>` in place. Absent → a video tile still shows the
   * play marker but links through to the project card (Phase H wires real URLs).
   */
  video?: string;
  /**
   * Self-hosted фоновый луп (Фаза 1.5, стратегия A). Присутствует → плитка
   * играет лёгкий локальный `<video>` (webm+mp4) вместо тяжёлого Vimeo-iframe.
   * Отсутствует → грид падает на Vimeo/YouTube-iframe-фолбэк через `video`.
   */
  loopSrc?: LoopSrc;
};
