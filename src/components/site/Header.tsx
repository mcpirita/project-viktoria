"use client";

import { CATEGORY_LABELS, MENU, ALL } from "./categories";
import { Marquee } from "./Marquee";
import type { Category } from "@/lib/schema";

/**
 * Compact, centred masthead (redesign 2026-06-18, per Victoria).
 *
 * Two small stacked rows, everything centred — no duplicated name, no hero:
 *   1. NAME (centred) + curated menu chips (centred): the five sections she
 *      agreed — COMMERCIAL · COSTUME · SET & PROPS · MUSIC VIDEO · THEATRE.
 *   2. The clients marquee (running strip) directly beneath.
 * Then the work grid. The menu is a CLIENT island: chips drive the grid filter
 * in place (active lifted to `Showcase`), no route change. Sections with no
 * work yet still show — the grid renders a "coming soon" state for them.
 *
 * Mobile: chips degrade to a centred horizontal scroll strip; name stays on top.
 */
export function Header({
  active,
  onSelect,
  marqueeItems,
}: {
  active: Category | typeof ALL;
  onSelect: (c: Category | typeof ALL) => void;
  marqueeItems: string[];
}) {
  return (
    <header className="sticky top-0 z-30 bg-[--color-paper]/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[--container-site] px-[--spacing-gutter] md:px-[--spacing-gutter-lg]">
        {/* Row 1 — centred name */}
        <div className="flex justify-center pt-3 pb-1.5">
          <a
            href="#top"
            className="font-serif text-[length:--text-sm] uppercase tracking-[--tracking-wider] text-[--color-maroon-deep] sm:text-[length:--text-base]"
          >
            Viktoria Martjanova
          </a>
        </div>

        {/* Row 1 (cont.) — centred curated menu */}
        <nav
          aria-label="Sections"
          className="-mx-[--spacing-gutter] flex justify-start gap-1 overflow-x-auto px-[--spacing-gutter] pb-2 sm:justify-center"
        >
          <Chip
            label={ALL}
            selected={active === ALL}
            onClick={() => onSelect(ALL)}
          />
          {MENU.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              selected={active === c}
              onClick={() => onSelect(c)}
            />
          ))}
        </nav>
      </div>

      <hr className="hairline hairline--ink" />

      {/* Row 2 — clients marquee */}
      <div className="mx-auto w-full max-w-[--container-site] px-[--spacing-gutter] py-2 md:px-[--spacing-gutter-lg]">
        <Marquee items={marqueeItems} />
      </div>

      <hr className="hairline hairline--ink" />
    </header>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-[--spacing-touch] shrink-0 items-center whitespace-nowrap rounded-[--radius-sm] px-3 font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wide] transition-colors duration-300 ease-[--ease-editorial] ${
        selected
          ? "bg-[--color-maroon] text-[--color-paper]"
          : "text-[--color-maroon-soft] hover:bg-[--color-paper-deep] hover:text-[--color-maroon]"
      }`}
    >
      {label}
    </button>
  );
}
