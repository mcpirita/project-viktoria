"use client";

import Image from "next/image";
import Link from "next/link";
import { AutoplayBackground } from "@/components/video/AutoplayBackground.client";
import { WorkCaption, Eyebrow } from "@/components/ui";
import { ALL } from "./categories";
import type { Category } from "@/lib/schema";
import type { IndexEntry } from "./types";

/**
 * The showcase core (grid-first, replaces the old hover index-list).
 *
 * Works are visible INSTANTLY as a living grid of poster tiles — no hover, no
 * tap required to see the frame. Each tile = a frame + the caption
 * (CLIENT, TITLE, PRODUCTION) beneath it, on the rose field.
 *
 * Layout is curated, not a wall: the parent passes ~8–12 featured works and the
 * grid re-lays them in place when the sticky header changes `active`. The grid is
 * a calm, even TWO-UP on desktop — every tile is large and cinematic (no small
 * three-across windows, per Victoria's feedback 2026-06-18). Tiles share one
 * aspect ratio so rows stay flush; sm keeps the 2-up, mobile collapses to one
 * column with vertical scroll.
 *
 * Photo tiles link to /work/<slug>. Video tiles show a play marker; once a real
 * `video` URL exists they play inline through <VideoEmbed>, otherwise they also
 * link through to the project card.
 */
export function WorkGrid({
  entries,
  active,
  label = "SELECTED WORKS:",
}: {
  entries: IndexEntry[];
  active: Category | typeof ALL;
  label?: string;
}) {
  const filtered =
    active === ALL ? entries : entries.filter((e) => e.category === active);

  return (
    <div>
      {/* Section label — the filter chips live in the sticky header and drive
          this grid via the `active` prop. */}
      <div className="mb-8 flex items-baseline justify-between gap-6">
        <Eyebrow as="h2" className="text-[--color-maroon-soft]">
          {label}
        </Eyebrow>
        <span className="label-micro text-[--color-maroon-muted]">
          {String(filtered.length).padStart(2, "0")}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[--radius-sm] border border-dashed border-[--color-line-rose] py-20 text-center">
          <span className="label-eyebrow text-[--color-maroon-soft]">
            Coming soon
          </span>
          <p className="work-caption max-w-[32ch] text-[--color-maroon-muted]">
            New work in this section is being added.
          </p>
        </div>
      ) : (
        // mobile: 1 col · sm & lg: even 2-up — every tile large, rows always flush.
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-x-7 lg:gap-x-8 lg:gap-y-14">
          {filtered.map((entry, i) => (
            <li key={entry.slug}>
              <Tile entry={entry} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({
  entry,
  priority,
}: {
  entry: IndexEntry;
  priority: boolean;
}) {
  const p = entry.preview;
  // One cinematic ratio for every tile: a calm 4/3 on mobile, widescreen 3/2 on
  // sm+ where the 2-up lives — rows stay flush and tiles stay large.
  const ratioClass = "aspect-[4/3] sm:aspect-[3/2]";
  const sizes = "(min-width: 640px) 48vw, 100vw";

  const caption = (
    <WorkCaption
      client={entry.client}
      title={entry.title}
      production={entry.production}
      className="mt-3 sm:mt-4"
    />
  );

  // Real video link → silent looping autoplay-in-view background; the tile links
  // through to the full work card (controls + sound) on tap.
  if (entry.isVideo && entry.video) {
    const alt = [entry.client, entry.title].filter(Boolean).join(" — ");
    return (
      <Link href={`/work/${entry.slug}`} className="group block outline-none">
        <div
          className={`relative ${ratioClass} overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]`}
        >
          <AutoplayBackground
            src={entry.video}
            posterSrc={p?.src}
            title={alt}
          />

          {/* Expand affordance — signals the tile opens the full work. */}
          <span
            aria-hidden
            className="absolute bottom-0 right-0 m-2 rounded-[--radius-xs] bg-[--color-maroon]/85 px-2 py-1 opacity-0 transition-opacity duration-300 ease-[--ease-editorial] group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <span className="label-micro !text-[--color-paper]">OPEN →</span>
          </span>
        </div>
        {caption}
      </Link>
    );
  }

  // Photo work — and, for now, video works without a URL yet — link to the card.
  return (
    <Link href={`/work/${entry.slug}`} className="group block outline-none">
      <div
        className={`relative ${ratioClass} overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]`}
      >
        {p ? (
          <Image
            src={p.src}
            alt={[entry.client, entry.title].filter(Boolean).join(" — ")}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder={p.blurDataURL ? "blur" : undefined}
            blurDataURL={p.blurDataURL}
            className="object-cover transition-transform duration-500 ease-[--ease-editorial] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="label-micro text-[--color-maroon-muted]">
              {entry.client}
            </span>
          </div>
        )}

        {/* Play marker for video works (decorative — the Link/Video handles the
            action; aria-hidden so it isn't announced twice). */}
        {entry.isVideo && <PlayMarker />}

        {/* Hover affordance — subtle VIEW tag, pointer devices only. */}
        <span
          aria-hidden
          className="absolute bottom-0 right-0 m-2 rounded-[--radius-xs] bg-[--color-maroon]/85 px-2 py-1 opacity-0 transition-opacity duration-300 ease-[--ease-editorial] group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="label-micro !text-[--color-paper]">VIEW →</span>
        </span>
      </div>
      {caption}
    </Link>
  );
}

/** Centered play badge for video tiles — ≥44px tap target, editorial palette. */
function PlayMarker() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[--color-paper]/85 shadow-[0_8px_24px_-8px_rgba(66,18,23,0.5)] backdrop-blur-sm transition-transform duration-300 ease-[--ease-editorial] group-hover:scale-110">
        <svg
          viewBox="0 0 24 24"
          className="ml-0.5 h-5 w-5 fill-[--color-maroon]"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}
