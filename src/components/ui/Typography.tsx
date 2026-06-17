import type { ElementType, ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Typographic primitives. Serif voice, caps + wide tracking for labels.
 * Phase F composes these instead of hand-rolling text styles.
 * ------------------------------------------------------------------------- */

type BaseTextProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/** Hero display name — the largest type on the site (e.g. VICTORIA MARTYANOVA). */
export function Display({
  children,
  as: Tag = "h1",
  className = "",
}: BaseTextProps) {
  return (
    <Tag
      className={`font-serif text-[length:--text-hero] leading-[--text-hero--line-height] tracking-[--tracking-tightest] font-light uppercase text-[--color-maroon-deep] ${className}`}
    >
      {children}
    </Tag>
  );
}

type HeadingLevel = 1 | 2 | 3;

/** Section heading. level 1 = large display, 2 = section title, 3 = sub. */
export function Heading({
  children,
  level = 2,
  as,
  className = "",
}: BaseTextProps & { level?: HeadingLevel }) {
  const Tag = (as ?? `h${level}`) as ElementType;
  const size =
    level === 1
      ? "text-[length:--text-3xl] leading-[--text-3xl--line-height] tracking-[--tracking-tight]"
      : level === 2
        ? "text-[length:--text-2xl] leading-[--text-2xl--line-height] tracking-[--tracking-tight]"
        : "text-[length:--text-xl] leading-[--text-xl--line-height] tracking-[--tracking-normal]";
  return (
    <Tag
      className={`font-serif font-normal text-[--color-maroon-deep] ${size} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Eyebrow / section label — uppercase, wide tracking (CLIENTS:, SELECTED WORKS:). */
export function Eyebrow({
  children,
  as: Tag = "p",
  className = "",
}: BaseTextProps) {
  return <Tag className={`label-eyebrow ${className}`}>{children}</Tag>;
}

/** Micro label — clock, tiny technical caps (sans, tabular). */
export function MicroLabel({
  children,
  as: Tag = "span",
  className = "",
}: BaseTextProps) {
  return <Tag className={`label-micro ${className}`}>{children}</Tag>;
}

/** Body prose — 16px floor, serif, readable measure. */
export function Body({
  children,
  as: Tag = "p",
  className = "",
}: BaseTextProps) {
  return (
    <Tag
      className={`font-serif text-[length:--text-base] leading-[--text-base--line-height] text-[--color-maroon] ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Generic caption — small secondary text. */
export function Caption({
  children,
  as: Tag = "p",
  className = "",
}: BaseTextProps) {
  return (
    <Tag
      className={`font-serif text-[length:--text-xs] leading-[--text-xs--line-height] tracking-[--tracking-wide] text-[--color-maroon-soft] ${className}`}
    >
      {children}
    </Tag>
  );
}

/**
 * Work caption — the content-model primitive: CLIENT, TITLE, PRODUCTION.
 * Any field may be omitted. Renders the reference's caption format.
 *
 * @example
 * <WorkCaption client="JORJA SMITH" title="FALLING OR FLYING" production="STINK FILMS" />
 */
export function WorkCaption({
  client,
  title,
  production,
  className = "",
}: {
  client: string;
  title?: string;
  production?: string;
  className?: string;
}) {
  return (
    <p className={`work-caption ${className}`}>
      <span className="work-caption__client">{client}</span>
      {title ? <span className="work-caption__title">, {title}</span> : null}
      {production ? (
        <span className="work-caption__production">, {production}</span>
      ) : null}
    </p>
  );
}
