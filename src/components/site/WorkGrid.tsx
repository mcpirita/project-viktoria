"use client";

import Image from "next/image";
import Link from "next/link";
import VideoEmbed from "@/components/VideoEmbed";
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
 * grid re-lays them in place when the sticky header changes `active`. On lg the
 * tiles tile a 6-col grid as a STRUCTURED MOSAIC — homogeneous rows alternate
 * between two big tiles (span-3, cinematic) and three medium tiles (span-2),
 * with a rare full-width band (span-6) absorbing an odd trailing tile. Every row
 * fills all six columns and every tile in a row shares a height, so the mosaic
 * is varied (some big, some small) yet always tidy — no orphan, no ragged edge.
 *
 * Photo tiles link to /work/<slug>. Video tiles show a play marker; once a real
 * `video` URL exists they play inline through <VideoEmbed>, otherwise they also
 * link through to the project card. Mobile: one column, vertical scroll.
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
        <p className="work-caption py-12 text-[--color-maroon-muted]">
          Nothing here yet.
        </p>
      ) : (
        // mobile: 1 col · sm: even 2-up · lg: 6-col structured mosaic (below).
        <ul className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-6">
          {layout(filtered.length).map((kind, i) => (
            <li key={filtered[i].slug} className={SPAN_CLASS[kind]}>
              <Tile entry={filtered[i]} kind={kind} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tile footprint on the lg mosaic. Each maps to a span + aspect + sizes hint. */
type TileKind = "big" | "med" | "band";

const SPAN_CLASS: Record<TileKind, string> = {
  big: "lg:col-span-3",
  med: "lg:col-span-2",
  band: "lg:col-span-6",
};

/**
 * Pack `n` tiles into homogeneous, full-width rows on the 6-col lg grid:
 *   • a row of 2 big tiles (span-3)      → "big", "big"
 *   • a row of 3 medium tiles (span-2)   → "med", "med", "med"
 *   • a lone trailing tile               → "band" (span-6, full width)
 * Rows alternate big↔medium for rhythm; an odd leftover becomes a band so a row
 * is never half-empty. Returns a flat array of kinds, one per tile, in order.
 */
function layout(n: number): TileKind[] {
  const out: TileKind[] = [];
  let rem = n;
  // cycle of row sizes (tiles per row): big-pair (2) ↔ medium-triple (3).
  const cycle = [2, 3];
  let step = 0;
  while (rem > 0) {
    const want = cycle[step % cycle.length];
    if (rem >= want) {
      out.push(...(want === 2 ? (["big", "big"] as const) : (["med", "med", "med"] as const)));
      rem -= want;
      step++;
    } else if (rem === 2) {
      out.push("big", "big");
      rem = 0;
    } else {
      // single tile left → full-width band (keeps the last row flush).
      out.push("band");
      rem = 0;
    }
  }
  return out;
}

function Tile({
  entry,
  kind,
  priority,
}: {
  entry: IndexEntry;
  kind: TileKind;
  priority: boolean;
}) {
  const p = entry.preview;
  // Each footprint gets its own cinematic ratio on lg; everything collapses to a
  // calm 4/3 at sm/mobile so the 2-up and single-column rows stay even in height.
  const ratioClass =
    kind === "band"
      ? "aspect-[4/3] lg:aspect-[2/1]"
      : kind === "big"
        ? "aspect-[4/3] lg:aspect-[3/2]"
        : "aspect-[4/3]";
  const sizes =
    kind === "band"
      ? "(min-width: 1024px) 92vw, (min-width: 640px) 50vw, 100vw"
      : kind === "big"
        ? "(min-width: 1024px) 46vw, (min-width: 640px) 50vw, 100vw"
        : "(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw";

  const caption = (
    <WorkCaption
      client={entry.client}
      title={entry.title}
      production={entry.production}
      className="mt-3 sm:mt-4"
    />
  );

  // Real video link → play inline through the VideoEmbed facade (poster → tap).
  if (entry.isVideo && entry.video) {
    return (
      <figure>
        <VideoEmbed
          src={entry.video}
          poster={p?.src}
          blurDataURL={p?.blurDataURL}
          aspectRatio={p?.aspectRatio ?? 16 / 9}
          title={[entry.client, entry.title].filter(Boolean).join(" — ")}
          sizes={sizes}
          priority={priority}
          className="rounded-[--radius-sm]"
        />
        <figcaption>{caption}</figcaption>
      </figure>
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
