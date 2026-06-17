/**
 * `<VideoEmbed>` — single reusable video embedding facade (Phase G).
 *
 * One component, three providers (`youtube` | `vimeo` | `mp4`), zero embed
 * libraries. It is a SERVER component: it renders only a poster image inside a
 * fixed aspect-ratio box (no layout shift, no third-party network cost) and
 * delegates the interactive "tap to play" part to a thin client island
 * (`VideoFacade.client`) that mounts the real player on demand.
 *
 * Design decisions (per Phase G spec):
 *  - Poster is Victoria's OWN frame (passed via props, optionally with
 *    `blurDataURL`) → no platform thumbnails, no extra third-party request.
 *  - Privacy-clean embeds: youtube-nocookie + Vimeo `dnt=1` (see parse.ts).
 *  - Mobile-first: `playsinline` everywhere, ≥44px play target, nothing heavy
 *    loads before the tap.
 *  - No CLS: the aspect-ratio box reserves space up front; the poster and the
 *    later-mounted player both fill it absolutely.
 *
 * Coordination:
 *  - Phase B `Work.video` is a full URL string → pass it as `src`; the provider
 *    is sniffed automatically. (You may still force `provider` explicitly.)
 *  - Phase C poster: pass `poster`, plus `blurDataURL` / `aspectRatio` (or
 *    `width`+`height`) from the image manifest.
 *  - This module imports nothing from `@/lib/*` — the prop contract below is
 *    self-contained so it can be wired up without a hard dependency on B.
 */

import Image from "next/image";

import { parseVideo, type VideoProvider } from "./video/parse";
import { VideoFacade } from "./video/VideoFacade.client";

export type { VideoProvider } from "./video/parse";

/** Props contract for `<VideoEmbed>` — this is the interface Phase F wires to. */
export type VideoEmbedProps = {
  /**
   * Video source. Either a full URL (YouTube watch?v=/youtu.be,
   * Vimeo, or a direct .mp4 — provider auto-detected) or, when `provider` is
   * given, a bare provider id. Maps directly to Phase B's `Work.video`.
   */
  src: string;

  /**
   * Force a provider. Optional — omit to auto-detect from `src`.
   * Required only if `src` is a bare id rather than a URL.
   */
  provider?: VideoProvider;

  /**
   * Poster image (Victoria's own frame). Strongly recommended: without it the
   * facade shows a neutral placeholder background. Maps to a Phase C derivative.
   */
  poster?: string;

  /** Tiny blur placeholder (Phase C `blurDataURL`) for the poster image. */
  blurDataURL?: string;

  /**
   * Aspect ratio of the box as `width / height` (e.g. `16 / 9`). Drives the
   * no-CLS reservation. If omitted, derived from `width`/`height`, else 16:9.
   */
  aspectRatio?: number;
  /** Intrinsic poster width (px) — used to derive `aspectRatio` if not given. */
  width?: number;
  /** Intrinsic poster height (px) — used to derive `aspectRatio` if not given. */
  height?: number;

  /** Human title (used for the play button's accessible label / iframe title). */
  title?: string;

  /** Extra classes on the outer aspect-ratio box. */
  className?: string;

  /**
   * Poster `sizes` hint for responsive `next/image`. Defaults to full-width.
   */
  sizes?: string;

  /** Eager-load the poster (set true only for an above-the-fold hero). */
  priority?: boolean;
};

const DEFAULT_ASPECT = 16 / 9;

/**
 * Server shell: aspect-ratio box + poster + interactive client overlay.
 * Renders no iframe/video until the user taps play (handled by `VideoFacade`).
 */
export default function VideoEmbed({
  src,
  provider,
  poster,
  blurDataURL,
  aspectRatio,
  width,
  height,
  title,
  className,
  sizes = "100vw",
  priority = false,
}: VideoEmbedProps) {
  const parsed = parseVideo(src, provider);
  const label = title ? `Play video: ${title}` : "Play video";

  const ratio =
    aspectRatio ??
    (width && height ? width / height : DEFAULT_ASPECT);

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-900 ${className ?? ""}`}
      style={{ aspectRatio: ratio }}
    >
      {poster ? (
        <Image
          src={poster}
          alt={title ? `${title} — video poster` : ""}
          fill
          sizes={sizes}
          priority={priority}
          // Below-the-fold posters lazy-load by default (priority overrides).
          loading={priority ? undefined : "lazy"}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          className="object-cover"
        />
      ) : null}

      <VideoFacade parsed={parsed} label={label} posterSrc={poster} />
    </div>
  );
}
