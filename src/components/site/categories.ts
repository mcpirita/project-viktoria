import type { Category } from "@/lib/schema";

/**
 * Display labels for category filters. Source: content/copy-en.md §4 — caps,
 * editorial. Keys are the Phase B enum values; values are the on-screen labels.
 * Kept tiny and pure so both server (page) and client (Filters) can import it.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  commercial: "COMMERCIAL",
  costume: "COSTUME",
  "set-props": "SET & PROPS",
  "music-video": "MUSIC VIDEO",
  theater: "THEATRE",
  editorial: "EDITORIAL",
  film: "FILM",
  art: "ART",
};

/** "Show all" pseudo-filter marker (copy-en.md §5). */
export const ALL = "ALL" as const;

/**
 * Меню шапки — фиксированный порядок, согласованный с Викторией (2026-06-18):
 * commercial · costume · set-props · music video · theatre. Выводится всегда,
 * независимо от наличия работ: пустые категории дают «coming soon» в гриде.
 * Это НЕ getCategories() (та возвращает только заполненные) — меню курируется.
 */
export const MENU: Category[] = [
  "commercial",
  "costume",
  "set-props",
  "music-video",
  "theater",
];
