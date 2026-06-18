"use client";

/**
 * Silent, looping, chrome-less video that lives INSIDE a grid tile and plays by
 * itself when scrolled into view (Phase H, 2026-06-18). It exists to make the
 * showcase feel alive — no "tap to play", no controls — while masking the weaker
 * still frames Victoria flagged. The full work (with controls/sound) opens from
 * the tile's link; this layer is purely the moving cover.
 *
 * How it stays cheap:
 *  - The poster (Victoria's own frame) is the only thing painted up front; it is
 *    the LCP/placeholder and what shows out of view or before the player loads.
 *  - An IntersectionObserver mounts the real iframe/<video> only once the tile is
 *    near the viewport (rootMargin) and unmounts it again when it scrolls far
 *    away, so we never run more than a handful of background players at once.
 *  - The iframe/<video> is pointer-events:none → clicks fall through to the tile
 *    link wrapping this component, and `prefers-reduced-motion` keeps the poster.
 *
 * No CLS: the parent tile owns the aspect-ratio box; poster and player both fill
 * it absolutely.
 */

import { useEffect, useRef, useState } from "react";

import {
  buildBackgroundSrc,
  parseVideo,
  type VideoProvider,
} from "./parse";

type AutoplayBackgroundProps = {
  /** Full video URL (YouTube/Vimeo/mp4) — same field as Work.video. */
  src: string;
  /** Force a provider; omit to auto-detect. */
  provider?: VideoProvider;
  /** Poster frame (always painted; sits under the player). */
  posterSrc?: string;
  /** Accessible/title text for the iframe. */
  title?: string;
};

export function AutoplayBackground({
  src,
  provider,
  posterSrc,
  title,
}: AutoplayBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect reduced-motion: never autoplay, keep the still poster.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        // Reset the fade when the player is dropped so it re-fades on return.
        if (!entry.isIntersecting) setLoaded(false);
      },
      // Pre-mount a little before it enters; drop it a little after it leaves.
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  let parsed;
  try {
    parsed = parseVideo(src, provider);
  } catch {
    parsed = null;
  }

  return (
    <div ref={ref} className="absolute inset-0">
      {/* Poster underneath — painted first, visible until/while the player is off. */}
      {posterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterSrc}
          alt={title ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {/* Player sits ON TOP of the poster but fades in only once it has loaded,
          so the poster (never the player's black bg) is what shows during load
          or if autoplay is blocked. */}
      {active && parsed
        ? (parsed.provider === "mp4" ? (
            <video
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              src={parsed.id}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
            />
          ) : (
            <iframe
              className={`pointer-events-none absolute border-0 transition-opacity duration-700 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              // background players are oversized then scaled to cover the box,
              // so the provider's own letterboxing never shows.
              style={{
                width: "133%",
                height: "133%",
                left: "-16.5%",
                top: "-16.5%",
              }}
              src={buildBackgroundSrc(parsed)}
              title={title ?? "Background video"}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture"
              aria-hidden
              tabIndex={-1}
              onLoad={() => setLoaded(true)}
            />
          ))
        : null}
    </div>
  );
}
