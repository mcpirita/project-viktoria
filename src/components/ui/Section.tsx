import type { ReactNode } from "react";
import { Container } from "./Container";

type SectionTone = "paper" | "rose" | "rose-gradient";

type SectionProps = {
  children: ReactNode;
  /** Background field. "rose" / "rose-gradient" = works & contact areas. */
  tone?: SectionTone;
  /** Wrap children in a centered Container. Set false for full-bleed grids. */
  contained?: boolean;
  /** Container measure when contained. */
  width?: "site" | "prose";
  id?: string;
  className?: string;
};

const TONE_BG: Record<SectionTone, string> = {
  paper: "bg-[--color-paper]",
  rose: "bg-[--color-rose]",
  // top→bottom dusty-rose gradient (contact page mood from the reference)
  "rose-gradient":
    "bg-[linear-gradient(180deg,var(--color-rose-soft)_0%,var(--color-rose)_45%,var(--color-rose-deep)_100%)]",
};

/**
 * Vertical rhythm band with a tone (background field).
 * Mobile-first vertical padding that opens up on larger screens.
 *
 * @example
 * <Section tone="rose"><WorkGrid/></Section>
 * <Section tone="paper" width="prose"><Bio/></Section>
 */
export function Section({
  children,
  tone = "paper",
  contained = true,
  width = "site",
  id,
  className = "",
}: SectionProps) {
  const pad = "py-[clamp(3rem,8vw,7rem)]";
  const body = contained ? (
    <Container width={width}>{children}</Container>
  ) : (
    children
  );
  return (
    <section id={id} className={`${TONE_BG[tone]} ${pad} ${className}`}>
      {body}
    </section>
  );
}
