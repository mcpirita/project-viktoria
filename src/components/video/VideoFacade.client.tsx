"use client";

/**
 * Client island for the `<VideoEmbed>` facade (Phase G).
 *
 * Until the user taps "play" this renders NOTHING but the play button overlay —
 * the poster underneath it is server-rendered by `VideoEmbed`. On the first
 * interaction it mounts the real player (autoplay iframe for youtube/vimeo,
 * native <video> for mp4). This is the classic "facade" pattern: heavy
 * third-party JS/iframe is deferred to user intent (saves data + battery, and
 * keeps the poster as the only above-the-fold network cost).
 *
 * No CLS: the parent server shell owns the aspect-ratio box; this overlay is
 * absolutely positioned to fill it, and the activated player also fills it.
 */

import { useState } from "react";

import { buildEmbedSrc, type ParsedVideo } from "./parse";

type VideoFacadeProps = {
  parsed: ParsedVideo;
  /** Accessible label, e.g. `Play video: ${title}`. */
  label: string;
  /** mp4 poster URL — passed to the native <video> when provider is mp4. */
  posterSrc?: string;
};

/**
 * Renders a large (≥44px) play button overlay; on click swaps itself for the
 * activated player. Lives inside the server shell's aspect-ratio box.
 */
export function VideoFacade({ parsed, label, posterSrc }: VideoFacadeProps) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    if (parsed.provider === "mp4") {
      return (
        <video
          className="absolute inset-0 h-full w-full bg-black"
          src={parsed.id}
          poster={posterSrc}
          // autoPlay because the user already expressed intent by tapping.
          autoPlay
          controls
          playsInline
          preload="auto"
        >
          {/* Graceful fallback for no-<video> environments. */}
          <a href={parsed.id}>Download video</a>
        </video>
      );
    }

    return (
      <iframe
        className="absolute inset-0 h-full w-full border-0 bg-black"
        src={buildEmbedSrc(parsed)}
        title={label}
        loading="lazy"
        // Minimal, provider-recommended allow-list (autoplay is the point).
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={label}
      className="group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-transparent transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      {/* ≥44px touch target with a clear, theme-neutral play glyph. */}
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-105 group-active:scale-95 sm:h-20 sm:w-20">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
