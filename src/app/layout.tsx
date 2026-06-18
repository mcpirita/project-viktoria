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

/**
 * Absolute base for OG/Twitter image URLs. Link-preview scrapers (Telegram,
 * WhatsApp, etc.) require absolute URLs, so the share image and favicons —
 * picked up from the file-based conventions opengraph-image.jpg / icon.* —
 * resolve against this. On Vercel we take the production domain from the
 * platform env; locally we fall back to the dev server.
 */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const title = "Viktoria Martjanova";
const description = "Art department, costume & set design — portfolio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en",
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
