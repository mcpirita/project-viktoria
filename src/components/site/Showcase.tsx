"use client";

import { useState } from "react";
import { Section } from "@/components/ui";
import { Header } from "./Header";
import { WorkGrid } from "./WorkGrid";
import { ALL } from "./categories";
import type { Category } from "@/lib/schema";
import type { IndexEntry } from "./types";

/**
 * Top-level client island that lifts the active-category filter so the sticky
 * Header (centre filters) and the WorkGrid share one source of truth. Filtering
 * re-lays the SAME grid in place — no navigation, no reload. Everything heavy
 * (hero, about, contact) stays server-rendered around this island. The grid
 * sits on the rose field (the reference's SELECTED WORKS surface).
 */
export function Showcase({
  entries,
  categories,
}: {
  entries: IndexEntry[];
  categories: Category[];
}) {
  const [active, setActive] = useState<Category | typeof ALL>(ALL);

  return (
    <>
      <Header categories={categories} active={active} onSelect={setActive} />
      <Section id="works" tone="rose">
        <WorkGrid entries={entries} active={active} />
      </Section>
    </>
  );
}
