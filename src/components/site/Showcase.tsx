"use client";

import { useState } from "react";
import { Section } from "@/components/ui";
import { Header } from "./Header";
import { WorkGrid } from "./WorkGrid";
import { ALL } from "./categories";
import type { Category } from "@/lib/schema";
import type { IndexEntry } from "./types";

/**
 * Top-level client island that lifts the active-section filter so the compact
 * masthead (centred menu) and the WorkGrid share one source of truth. Filtering
 * re-lays the SAME grid in place — no navigation, no reload. The masthead also
 * carries the clients marquee (its second row). Everything heavy (about,
 * contact) stays server-rendered around this island. The grid sits on the rose
 * field (the reference's SELECTED WORKS surface).
 */
export function Showcase({
  entries,
  marqueeItems,
}: {
  entries: IndexEntry[];
  marqueeItems: string[];
}) {
  const [active, setActive] = useState<Category | typeof ALL>(ALL);

  return (
    <>
      <Header active={active} onSelect={setActive} marqueeItems={marqueeItems} />
      <Section
        id="works"
        tone="rose"
        className="!pt-[clamp(1.25rem,3vw,2.25rem)]"
      >
        <WorkGrid entries={entries} active={active} />
      </Section>
    </>
  );
}
