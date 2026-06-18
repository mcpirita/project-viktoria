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
import type { LoopSrc } from "@/lib/schema";

type AutoplayBackgroundProps = {
  /**
   * Full video URL (YouTube/Vimeo/mp4) — same field as Work.video. Used only as
   * the Vimeo/YouTube iframe FALLBACK when no self-hosted `loop` is present.
   */
  src?: string;
  /** Force a provider; omit to auto-detect. */
  provider?: VideoProvider;
  /**
   * Self-hosted compressed loop (Phase 1.5, strategy A). When present, the tile
   * plays a light native `<video>` (webm+mp4) instead of mounting the heavy
   * provider iframe — near-instant start, no third-party player JS. Falls back
   * to the iframe (`src`) only when this is absent.
   */
  loop?: LoopSrc;
  /** Poster frame (always painted; sits under the player). */
  posterSrc?: string;
  /** Accessible/title text for the iframe. */
  title?: string;
};

export function AutoplayBackground({
  src,
  provider,
  loop,
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

  // Parse the iframe fallback only when there's no self-hosted loop and a src.
  let parsed = null;
  if (!loop && src) {
    try {
      parsed = parseVideo(src, provider);
    } catch {
      parsed = null;
    }
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
      {active && loop ? (
        // Preferred path: light self-hosted loop (no third-party player JS).
        // webm first (smaller), mp4 fallback for Safari. The 480p variant is
        // hinted to narrow viewports via media; the 720p set covers the rest.
        <video
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
        >
          {loop.loop480 ? (
            <>
              <source
                src={loop.loop480.webm}
                type="video/webm"
                media="(max-width: 640px)"
              />
              <source
                src={loop.loop480.mp4}
                type="video/mp4"
                media="(max-width: 640px)"
              />
            </>
          ) : null}
          <source src={loop.webm} type="video/webm" />
          <source src={loop.mp4} type="video/mp4" />
        </video>
      ) : active && parsed ? (
        parsed.provider === "mp4" ? (
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
        )
      ) : null}
    </div>
  );
}
