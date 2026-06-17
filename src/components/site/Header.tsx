"use client";

import { LiveClock } from "./LiveClock";
import { CATEGORY_LABELS, ALL } from "./categories";
import type { Category } from "@/lib/schema";

/**
 * Sticky three-column header (Phase F): name · category filters · contact+clock.
 * It is a CLIENT island because the centre filters drive the index in place —
 * the active category is lifted to the parent `Showcase` so header and list
 * share one source of truth (no route change, no reload).
 *
 * Mobile: the filters degrade to a horizontal scroll-chip strip below the top
 * row (name + CONTACT stay one tap). Clock hides on the narrowest screens so it
 * never breaks the layout. A hairline sits under the whole header.
 */
export function Header({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: Category | typeof ALL;
  onSelect: (c: Category | typeof ALL) => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[--color-paper]/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[--container-site] px-[--spacing-gutter] md:px-[--spacing-gutter-lg]">
        {/* top row */}
        <div className="flex h-14 items-center justify-between gap-4 md:h-16">
          <a
            href="#top"
            className="font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wider] text-[--color-maroon-deep] sm:text-[length:--text-sm]"
          >
            Victoria Martyanova
          </a>

          {/* centre filters — desktop only (mobile strip is below) */}
          {categories.length > 0 && (
            <nav
              aria-label="Filter works"
              className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            >
              <Chip
                label={ALL}
                selected={active === ALL}
                onClick={() => onSelect(ALL)}
              />
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={CATEGORY_LABELS[c]}
                  selected={active === c}
                  onClick={() => onSelect(c)}
                />
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-4">
            <LiveClock className="hidden sm:inline" />
            <a
              href="#contact"
              className="inline-flex min-h-[--spacing-touch] items-center font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wider] text-[--color-maroon] link-editorial"
            >
              Contact
            </a>
          </div>
        </div>

        {/* mobile / tablet filter strip — horizontal scroll chips */}
        {categories.length > 0 && (
          <nav
            aria-label="Filter works"
            className="-mx-[--spacing-gutter] flex gap-1 overflow-x-auto px-[--spacing-gutter] pb-2 lg:hidden"
          >
            <Chip
              label={ALL}
              selected={active === ALL}
              onClick={() => onSelect(ALL)}
            />
            {categories.map((c) => (
              <Chip
                key={c}
                label={CATEGORY_LABELS[c]}
                selected={active === c}
                onClick={() => onSelect(c)}
              />
            ))}
          </nav>
        )}
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
