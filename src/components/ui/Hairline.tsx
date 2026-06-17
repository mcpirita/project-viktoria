type HairlineTone = "paper" | "rose" | "ink";

type HairlineProps = {
  /** Match the background the rule sits on. */
  tone?: HairlineTone;
  className?: string;
};

/**
 * Thin editorial divider rule. The reference's signature separator.
 *
 * @example
 * <Hairline />            // on paper
 * <Hairline tone="rose" /> // on a rose field
 * <Hairline tone="ink" />  // maroon @20%, e.g. under sticky header
 */
export function Hairline({ tone = "paper", className = "" }: HairlineProps) {
  const toneClass =
    tone === "rose"
      ? "hairline--rose"
      : tone === "ink"
        ? "hairline--ink"
        : "";
  return <hr className={`hairline ${toneClass} ${className}`} />;
}
