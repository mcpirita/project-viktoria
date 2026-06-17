import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  /** "outline" = bordered editorial pill; "text" = underline-on-hover link. */
  variant?: "outline" | "text";
};

/**
 * Editorial CTA / link. Renders as an <a> (use next/link's asChild pattern or
 * pass href). Minimum 44px tap target for mobile a11y.
 *
 * @example
 * <Button href="#contact">CONTACT</Button>
 * <Button href="mailto:…" variant="text">EMAIL</Button>
 */
export function Button({
  children,
  variant = "outline",
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center min-h-[--spacing-touch] font-serif uppercase text-[length:--text-xs] tracking-[--tracking-wider] text-[--color-maroon] transition-colors duration-300 ease-[--ease-editorial]";
  const variants = {
    outline:
      "px-6 rounded-[--radius-sm] border border-[--color-maroon] hover:bg-[--color-maroon] hover:text-[--color-paper]",
    text: "link-editorial",
  } as const;
  return (
    <a className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
