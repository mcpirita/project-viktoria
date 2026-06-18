import type { NextConfig } from "next";

/**
 * Content-Security-Policy for a static portfolio showcase (Phase 1.6, S1).
 *
 * The site serves its own assets from `/public` (self) and embeds two third-party
 * video players via <iframe>. Our CSP only governs what *our* page may load/frame —
 * the embedded YouTube/Vimeo documents enforce their own policy for their internal
 * requests (googlevideo, vimeocdn, …), so we don't need to allow those hosts here.
 * We only have to (a) allow framing the two player origins and (b) keep self-hosted
 * images / mp4 <video> / Tailwind inline styles working.
 */
const csp = [
  "default-src 'self'",
  // next/image + AutoplayBackground poster <img>: all from /public (self).
  // data: covers blur placeholders / data URLs.
  "img-src 'self' data: blob:",
  // Self-hosted mp4 loops/players (<video src=/works/...>); blob: for safety.
  "media-src 'self' blob:",
  // Tailwind v4 / Next inject inline <style> — 'unsafe-inline' is required for them.
  "style-src 'self' 'unsafe-inline'",
  // Next runtime/hydration; 'unsafe-inline' kept for Next's inline bootstrap scripts.
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Embedded video players: YouTube (privacy-nocookie) + Vimeo.
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  // Same as X-Frame-Options: DENY — nobody may frame *us*.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Railway: self-contained server bundle
  output: "standalone",

  // Next 16: explicit opt-in to the new caching model (Cache Components)
  cacheComponents: true,

  images: {
    // Next 16 defaults; kept explicit so later phases can extend
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },

  // Phase 1.6 (S1): defence-in-depth HTTP security headers on every route.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
