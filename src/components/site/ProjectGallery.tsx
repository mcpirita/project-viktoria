"use client";

import { useState } from "react";
import { WorkFigure } from "./WorkFigure";
import type { ResolvedImage } from "@/lib/schema";

type Tab = "final" | "process";

/**
 * Project gallery (Phase F): a frame grid with a FINAL ↔ PROCESS toggle.
 *
 * The switch uses the browser's View Transitions API (no library): on toggle we
 * wrap the state update in `document.startViewTransition`, and the swapped
 * frames cross-fade via the `::view-transition` CSS in globals.css. Browsers
 * without the API just update instantly (graceful degradation).
 */
export function ProjectGallery({
  slug,
  title,
  final,
  process,
}: {
  slug: string;
  title: string;
  final: ResolvedImage[];
  process: ResolvedImage[];
}) {
  const [tab, setTab] = useState<Tab>("final");
  const hasProcess = process.length > 0;
  const images = tab === "final" ? final : process;

  const switchTo = (next: Tab) => {
    if (next === tab) return;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => setTab(next));
    } else {
      setTab(next);
    }
  };

  return (
    <div>
      {/* toggle */}
      {hasProcess && (
        <div
          role="tablist"
          aria-label="Gallery view"
          className="mb-8 inline-flex gap-1 rounded-[--radius-sm] border border-[--color-line] p-1"
        >
          <Tab id="final" current={tab} onClick={switchTo} label="Final" />
          <Tab id="process" current={tab} onClick={switchTo} label="Process" />
        </div>
      )}

      {/* frame grid — keyed by tab so the view-transition has fresh nodes */}
      {images.length > 0 ? (
        <div
          key={tab}
          className="gallery-grid grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
          style={{ viewTransitionName: "gallery" }}
        >
          {images.map((img, i) => (
            <WorkFigure
              key={`${tab}-${img.ref}-${i}`}
              slug={slug}
              image={img}
              index={i}
              priority={i === 0}
              alt={`${title} — ${tab} ${i + 1}`}
            />
          ))}
        </div>
      ) : (
        <p className="work-caption text-[--color-maroon-muted]">
          No {tab} frames yet.
        </p>
      )}
    </div>
  );
}

function Tab({
  id,
  current,
  onClick,
  label,
}: {
  id: Tab;
  current: Tab;
  onClick: (t: Tab) => void;
  label: string;
}) {
  const selected = current === id;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onClick(id)}
      className={`inline-flex min-h-[--spacing-touch] items-center rounded-[--radius-xs] px-5 font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wider] transition-colors duration-300 ease-[--ease-editorial] ${
        selected
          ? "bg-[--color-maroon] text-[--color-paper]"
          : "text-[--color-maroon-soft] hover:text-[--color-maroon]"
      }`}
    >
      {label}
    </button>
  );
}
