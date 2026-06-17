"use client";

import { useState } from "react";
import { Section } from "@/components/ui";
import { Header } from "./Header";
import { WorkIndex } from "./WorkIndex";
import { ALL } from "./categories";
import type { Category } from "@/lib/schema";
import type { IndexEntry } from "./types";

/**
 * Top-level client island that lifts the active-category filter so the sticky
 * Header (centre filters) and the WorkIndex (the list) share one source of
 * truth. Filtering happens in place — no navigation, no reload. Everything
 * heavy (hero, about, contact) stays server-rendered around this island.
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
      <Section id="works" tone="paper">
        <WorkIndex entries={entries} active={active} />
      </Section>
    </>
  );
}
