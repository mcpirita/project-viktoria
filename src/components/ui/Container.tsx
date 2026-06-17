import type { ElementType, ReactNode } from "react";

type ContainerWidth = "site" | "prose";

type ContainerProps = {
  children: ReactNode;
  /** "site" = full editorial frame (1440px); "prose" = reading measure. */
  width?: ContainerWidth;
  /** Render as a different element (e.g. "section", "header"). */
  as?: ElementType;
  className?: string;
};

/**
 * Centered content frame with mobile-first gutters.
 * Gutter scales: 20px (mobile) → 40px (md+). Never causes horizontal scroll.
 *
 * @example
 * <Container>…</Container>
 * <Container width="prose" as="section">…</Container>
 */
export function Container({
  children,
  width = "site",
  as: Tag = "div",
  className = "",
}: ContainerProps) {
  const max =
    width === "prose" ? "max-w-[--container-prose]" : "max-w-[--container-site]";
  return (
    <Tag
      className={`mx-auto w-full ${max} px-[--spacing-gutter] md:px-[--spacing-gutter-lg] ${className}`}
    >
      {children}
    </Tag>
  );
}
