import type { Category } from "@/lib/schema";

/**
 * Display labels for category filters. Source: content/copy-en.md §4 — caps,
 * editorial. Keys are the Phase B enum values; values are the on-screen labels.
 * Kept tiny and pure so both server (page) and client (Filters) can import it.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  commercial: "COMMERCIAL",
  "music-video": "MUSIC VIDEO",
  editorial: "EDITORIAL",
  film: "FILM",
  theater: "THEATER",
  art: "ART",
};

/** "Show all" pseudo-filter marker (copy-en.md §5). */
export const ALL = "ALL" as const;
