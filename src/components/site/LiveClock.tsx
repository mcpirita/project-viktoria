"use client";

import { useEffect, useState } from "react";
import { MicroLabel } from "@/components/ui";

/**
 * Live ticking clock for the header — the reference's `13:36:08` detail.
 * Renders nothing until mounted (avoids hydration mismatch between server time
 * and client time), then ticks every second. Tabular-nums come from `.label-micro`.
 */
function format(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    setNow(format(new Date()));
    const id = setInterval(() => setNow(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <MicroLabel className={className}>
      {/* reserve width with a stable placeholder to avoid layout jitter */}
      <span className="tabular-nums">{now ?? "—:—:—"}</span>
    </MicroLabel>
  );
}
