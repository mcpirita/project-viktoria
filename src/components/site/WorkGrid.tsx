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
 *
 * Mixed rows: the field is a large, cinematic 2-up by default (Victoria's
 * feedback 2026-06-18). A contiguous run of ≥2 photo-only works is pulled out
 * into a compact BAND — a denser strip (up to 3-up on desktop, square tiles)
 * that fits more works on one line without shrinking the video tiles around it.
 * A lone photo stays in the 2-up flow, so the surrounding rows stay flush.
 */

/** A laid-out segment of the showcase: the big 2-up grid, or a compact band. */
type Block =
  | { kind: "grid"; items: IndexEntry[] }
  | { kind: "band"; items: IndexEntry[] };

/**
 * Split the (already filtered) entries into blocks. Maximal runs of ≥2
 * consecutive photo tiles become a `band`; everything else (videos and lone
 * photos) accumulates into the standard 2-up `grid`. Computed per render, so it
 * adapts to the active category filter.
 */
function toBlocks(entries: IndexEntry[]): Block[] {
  const blocks: Block[] = [];
  let buf: IndexEntry[] = [];
  const flush = () => {
    if (buf.length) blocks.push({ kind: "grid", items: buf });
    buf = [];
  };
  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (j < entries.length && !entries[j].isVideo) j++;
    if (j - i >= 2) {
      flush();
      blocks.push({ kind: "band", items: entries.slice(i, j) });
      i = j;
    } else {
      buf.push(entries[i]);
      i++;
    }
  }
  flush();
  return blocks;
}

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

  const blocks = toBlocks(filtered);
  // Continuous index across blocks so only the first two tiles get LCP priority.
  let seen = 0;

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
        <div className="flex flex-col gap-y-10 lg:gap-y-14">
          {blocks.map((block, bi) => {
            // mobile: 1 col · sm+: large even 2-up (grid) or compact 3-up (band).
            const listClass =
              block.kind === "band"
                ? "grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-0"
                : "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-x-7 lg:gap-x-8 lg:gap-y-14";
            return (
              <ul key={bi} className={listClass}>
                {block.items.map((entry) => {
                  const priority = seen < 2;
                  seen++;
                  return (
                    <li key={entry.slug}>
                      <Tile
                        entry={entry}
                        priority={priority}
                        variant={block.kind === "band" ? "band" : "feature"}
                      />
                    </li>
                  );
                })}
              </ul>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tile({
  entry,
  priority,
  variant = "feature",
}: {
  entry: IndexEntry;
  priority: boolean;
  variant?: "feature" | "band";
}) {
  const p = entry.preview;
  // Feature tiles: one cinematic ratio (calm 4/3 on mobile, widescreen 3/2 on
  // sm+). Band tiles: compact squares — these are near-square social/campaign
  // stills, and squares keep the denser strip flush.
  const ratioClass =
    variant === "band" ? "aspect-square" : "aspect-[4/3] sm:aspect-[3/2]";
  const sizes =
    variant === "band"
      ? "(min-width: 640px) 31vw, 45vw"
      : "(min-width: 640px) 48vw, 100vw";

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
