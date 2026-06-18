import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/site/CustomCursor.client";

/**
 * Phase D — design system fonts.
 * Display / body serif: Fraunces (editorial, optical, characterful).
 * Exposed as a CSS variable; consumed via the --font-serif token in @theme.
 * Technical labels / clock fall back to the --font-sans token (system stack).
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  // expressive optical axis: a touch of contrast, soft "soft" terminals
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Viktoria Martjanova",
  description: "Art department, costume & set design — portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
