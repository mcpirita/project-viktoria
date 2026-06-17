"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorkCaption, Eyebrow } from "@/components/ui";
import { ALL } from "./categories";
import type { Category } from "@/lib/schema";
import type { IndexEntry } from "./types";

/**
 * The showcase core (Phase F): a typographic INDEX of works — not a grid wall.
 *
 * Desktop: hovering a row reveals the work's frame in a floating preview that
 * tracks the cursor. Mobile (no hover): tapping a row toggles an inline frame
 * directly beneath it, so the image is never hidden on touch.
 *
 * Filtering is CONTROLLED by the parent (`Showcase`) so the sticky header's
 * filters re-rank this SAME list in place — no route change, no reload.
 */
export function WorkIndex({
  entries,
  active,
  label = "SELECTED WORKS:",
}: {
  entries: IndexEntry[];
  active: Category | typeof ALL;
  label?: string;
}) {
  // Desktop floating preview state.
  const [hovered, setHovered] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Mobile inline-expanded row.
  const [expanded, setExpanded] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const filtered =
    active === ALL ? entries : entries.filter((e) => e.category === active);

  const onMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hoveredEntry = hovered
    ? filtered.find((e) => e.slug === hovered) ?? null
    : null;

  return (
    <div>
      {/* Section label — the filter chips live in the sticky header and drive
          this list via the `active` prop. */}
      <div className="mb-8 flex items-baseline justify-between gap-6">
        <Eyebrow as="h2" className="text-[--color-maroon-soft]">
          {label}
        </Eyebrow>
        <span className="label-micro text-[--color-maroon-muted]">
          {String(filtered.length).padStart(2, "0")}
        </span>
      </div>

      {/* ---- The index list ----------------------------------------------- */}
      <ol
        ref={listRef}
        className="border-t border-[--color-line]"
        onMouseMove={onMove}
      >
        {filtered.map((e, i) => {
          const isOpen = expanded === e.slug;
          return (
            <li key={e.slug} className="border-b border-[--color-line]">
              <Link
                href={`/work/${e.slug}`}
                className="index-row group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 outline-none focus-visible:bg-[--color-paper-deep] sm:py-6"
                onMouseEnter={() => setHovered(e.slug)}
                onMouseLeave={() =>
                  setHovered((h) => (h === e.slug ? null : h))
                }
                onClick={(ev) => {
                  // Touch / no-hover: first tap reveals the inline frame,
                  // second tap (already open) navigates. Pointer-capable
                  // devices fall straight through to navigation.
                  if (
                    typeof window !== "undefined" &&
                    window.matchMedia("(hover: none)").matches &&
                    !isOpen
                  ) {
                    ev.preventDefault();
                    setExpanded(e.slug);
                  }
                }}
              >
                <span className="label-micro w-7 shrink-0 text-[--color-maroon-muted]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <WorkCaption
                    client={e.client}
                    title={e.title}
                    production={e.production}
                    className="index-row__caption truncate text-[length:--text-sm] sm:text-[length:--text-base]"
                  />
                </span>
                <span
                  className="label-micro shrink-0 text-[--color-maroon-muted] opacity-0 transition-opacity duration-300 ease-[--ease-editorial] group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                >
                  VIEW →
                </span>
              </Link>

              {/* Mobile inline frame (only when expanded; desktop uses the
                  floating preview instead). */}
              {isOpen && (
                <div className="pb-6 lg:hidden">
                  <InlineFrame entry={e} />
                </div>
              )}
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li className="py-12">
            <p className="work-caption text-[--color-maroon-muted]">
              Nothing here yet.
            </p>
          </li>
        )}
      </ol>

      {/* ---- Desktop floating preview (cursor-tracked) -------------------- */}
      {hoveredEntry && (
        <FloatingPreview entry={hoveredEntry} x={pos.x} y={pos.y} />
      )}
    </div>
  );
}

/** Inline frame shown beneath a tapped row on touch devices. */
function InlineFrame({ entry }: { entry: IndexEntry }) {
  const p = entry.preview;
  if (!p) {
    return (
      <div
        className="w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]"
        style={{ aspectRatio: "4 / 3" }}
        aria-hidden
      />
    );
  }
  return (
    <div
      className="relative w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]"
      style={{ aspectRatio: p.aspectRatio }}
    >
      <Image
        src={p.src}
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        placeholder={p.blurDataURL ? "blur" : undefined}
        blurDataURL={p.blurDataURL}
        className="object-cover"
      />
    </div>
  );
}

/**
 * Floating cursor-tracked preview. Fixed-position card offset from the pointer;
 * pointer-events-none so it never blocks the row beneath. Only mounts on
 * pointer (hover) devices because it's gated behind onMouseEnter.
 */
function FloatingPreview({
  entry,
  x,
  y,
}: {
  entry: IndexEntry;
  x: number;
  y: number;
}) {
  const p = entry.preview;
  const ratio = p?.aspectRatio ?? 4 / 3;
  const W = 320;
  const H = W / ratio;
  // Keep the card on-screen: flip to the left of the cursor past mid-width.
  const flip =
    typeof window !== "undefined" && x > window.innerWidth - (W + 48);
  const left = flip ? x - W - 24 : x + 24;
  const top = Math.max(
    16,
    Math.min(
      y - H / 2,
      (typeof window !== "undefined" ? window.innerHeight : 800) - H - 16,
    ),
  );

  return (
    <div
      aria-hidden
      className="floating-preview pointer-events-none fixed z-40 hidden overflow-hidden rounded-[--radius-sm] shadow-[0_24px_60px_-20px_rgba(66,18,23,0.45)] lg:block"
      style={{ left, top, width: W, height: H }}
    >
      {p ? (
        <Image
          src={p.src}
          alt=""
          fill
          sizes="320px"
          placeholder={p.blurDataURL ? "blur" : undefined}
          blurDataURL={p.blurDataURL}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[--color-rose-deep]">
          <span className="label-micro text-[--color-maroon-muted]">
            {entry.client}
          </span>
        </div>
      )}
    </div>
  );
}
