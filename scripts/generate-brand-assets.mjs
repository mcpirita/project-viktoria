/**
 * One-off generator for share image (Open Graph) + favicon assets.
 * Run: node scripts/generate-brand-assets.mjs
 *
 * Outputs (Next.js file-based metadata conventions):
 *   src/app/opengraph-image.jpg  — 1200×630 link-preview card (Telegram/WhatsApp/etc.)
 *   src/app/icon.svg             — VM monogram favicon (crisp, modern browsers)
 *   src/app/icon.png             — 32×32 PNG fallback
 *   src/app/apple-icon.png       — 180×180 (iOS home-screen)
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const PAPER = "#fbf7f4";
const MAROON = "#5c1d24";
const MAROON_DEEP = "#421217";
const MAROON_SOFT = "#804049";
const MAROON_MUTED = "#9c6970";
const SERIF = "Baskerville, Georgia, 'Times New Roman', serif";

const OUT = "src/app";

/* ── Open Graph card: 1200×630 editorial split ─────────────────────────── */
const W = 1200;
const H = 630;
const PORTRAIT_W = 470; // right-hand portrait strip

const portrait = await sharp("assets/portrait/viktoria-portrait.jpg")
  .resize(PORTRAIT_W, H, { fit: "cover", position: "top" })
  .toBuffer();

const ogText = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <!-- hairline framing -->
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none"
        stroke="${MAROON}" stroke-opacity="0.18" stroke-width="1"/>
  <g font-family="${SERIF}">
    <text x="96" y="150" font-size="22" letter-spacing="6"
          fill="${MAROON_MUTED}" font-weight="400">P O R T F O L I O</text>
    <text x="92" y="300" font-size="96" fill="${MAROON_DEEP}"
          font-weight="400">Viktoria</text>
    <text x="92" y="396" font-size="96" fill="${MAROON_DEEP}"
          font-weight="400">Martjanova</text>
    <line x1="96" y1="452" x2="300" y2="452" stroke="${MAROON}" stroke-opacity="0.3" stroke-width="1"/>
    <text x="96" y="506" font-size="30" fill="${MAROON_SOFT}">Production Design. Art Department</text>
  </g>
</svg>`;

await sharp(Buffer.from(ogText))
  .composite([{ input: portrait, left: W - PORTRAIT_W, top: 0 }])
  .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
  .toFile(`${OUT}/opengraph-image.jpg`);

/* ── VM monogram favicon ───────────────────────────────────────────────── */
const monogram = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="12" fill="${MAROON_DEEP}"/>
  <text x="32" y="33" font-family="${SERIF}" font-size="34" font-style="italic"
        fill="${PAPER}" text-anchor="middle" dominant-baseline="central"
        letter-spacing="-1">VM</text>
</svg>`;

writeFileSync(`${OUT}/icon.svg`, monogram(64).trim() + "\n");

await sharp(Buffer.from(monogram(64))).resize(32, 32).png().toFile(`${OUT}/icon.png`);
await sharp(Buffer.from(monogram(64))).resize(180, 180).png().toFile(`${OUT}/apple-icon.png`);

console.log("Brand assets generated:");
console.log("  opengraph-image.jpg, icon.svg, icon.png, apple-icon.png");
