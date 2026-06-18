/**
 * scripts/import-use-this.ts — surgical, one-off import of curated "Use this"
 * frames.
 *
 * Unlike import-media.ts (which rebuilds the whole manifest from the entire
 * Commercials tree), this script generates derivatives ONLY for an explicit list
 * of source files and MERGES their entries into the existing
 * content/works.manifest.json — leaving every other work's entries untouched.
 *
 * Slugify / imageName / derivative logic are kept byte-identical to
 * import-media.ts so names stay consistent if the full importer is ever re-run.
 *
 * Run:  npx tsx scripts/import-use-this.ts
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

type HeicConvert = (opts: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<ArrayBuffer | Buffer>;
const heicConvert = createRequire(import.meta.url)("heic-convert") as HeicConvert;

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const HOME = process.env.HOME ?? "";
const SOURCE_ROOT = path.join(HOME, "Downloads", "Commercials");
const PUBLIC_WORKS = path.join(PROJECT_ROOT, "public", "works");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "content", "works.manifest.json");

const WIDTHS = [400, 800, 1200, 2000] as const;
const FORMATS = ["webp", "avif"] as const;
const WEBP_QUALITY = 78;
const AVIF_QUALITY = 50;
const POSTER_SECONDS = 1;

const HEIC_EXT = new Set([".heic", ".heif"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".m4v", ".webm"]);

interface ManifestEntry {
  width: number;
  height: number;
  aspectRatio: number;
  blurDataURL: string;
  widths: number[];
  kind: "image" | "video-poster";
  files: string[];
}
type Manifest = Record<string, ManifestEntry>;

/** The curated frames to import. workFolder is relative to ~/Downloads/Commercials. */
const ITEMS: { workFolder: string; slug: string; rel: string }[] = [
  // Tommy Cash photo works — added as still-only grid tiles (no video). Two
  // projects, set/props by Viktoria:
  //   adidas-tommy-cash — the adidas Originals BY TOMMY CASH campaign (long
  //     Superstar). Cover = the checkerboard long-shoe frame (2364²).
  //   maison-margiela-tommy-cash — the Maison Margiela × Tommy Cash campaign
  //     (clay-body set + bread slippers props). Cover = clay-body frame.
  //   tommy-cash-social — the snowmobile / ice-hole social post.
  { workFolder: "Tommy Cash", slug: "adidas-tommy-cash", rel: "Tommy Cash x Adidas 2.jpg" },
  { workFolder: "Tommy Cash", slug: "adidas-tommy-cash", rel: "Tommy Cash x Adidas 3.jpg" },
  { workFolder: "Tommy Cash", slug: "adidas-tommy-cash", rel: "Tommy Cash x Adidas.jpg" },
  { workFolder: "Tommy Cash x Maison Margiela", slug: "maison-margiela-tommy-cash", rel: "Tommy Cash x Maison Margiela.jpg" },
  { workFolder: "Tommy Cash x Maison Margiela", slug: "maison-margiela-tommy-cash", rel: "Tommy Cash x Maison Margiela 2.jpg" },
  { workFolder: "Tommy Cash", slug: "tommy-cash-social", rel: "Tommy Cash Social Post.png" },
];

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[‘’“”]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function imageName(relInsideWork: string): string {
  const noExt = relInsideWork.replace(/\.[^.]+$/, "");
  return slugify(noExt) || "img";
}

async function loadSharp(file: string, ext: string): Promise<sharp.Sharp> {
  if (HEIC_EXT.has(ext)) {
    const input = await readFile(file);
    const jpeg = await heicConvert({ buffer: input, format: "JPEG", quality: 1 });
    return sharp(Buffer.from(jpeg as ArrayBuffer)).rotate();
  }
  return sharp(file).rotate();
}

function ffprobeDuration(file: string): number | null {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
    { encoding: "utf8" },
  );
  const d = parseFloat((r.stdout ?? "").trim());
  return Number.isFinite(d) ? d : null;
}

function extractPoster(file: string, tmpDir: string): string | null {
  const dur = ffprobeDuration(file);
  const ts = dur != null ? Math.min(POSTER_SECONDS, Math.max(0, dur / 2)) : POSTER_SECONDS;
  const out = path.join(tmpDir, "poster.png");
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-ss", ts.toFixed(2), "-i", file, "-frames:v", "1", "-q:v", "2", out],
    { stdio: "ignore" },
  );
  return r.status === 0 ? out : null;
}

async function generateDerivatives(
  img: sharp.Sharp,
  outDir: string,
  name: string,
  kind: ManifestEntry["kind"],
): Promise<ManifestEntry> {
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error("no dimensions");

  await mkdir(outDir, { recursive: true });
  const base = await img.toColorspace("srgb").toBuffer();

  const targets: number[] = WIDTHS.filter((w) => w <= width);
  if (targets.length === 0) targets.push(width);

  const files: string[] = [];
  for (const w of targets) {
    for (const fmt of FORMATS) {
      const resized = sharp(base).resize({ width: w, withoutEnlargement: true });
      const encoded =
        fmt === "webp"
          ? resized.webp({ quality: WEBP_QUALITY })
          : resized.avif({ quality: AVIF_QUALITY });
      const fileName = `${name}-${w}.${fmt}`;
      await encoded.toFile(path.join(outDir, fileName));
      files.push(
        path.posix.join(
          "works",
          path.relative(PUBLIC_WORKS, outDir).split(path.sep).join("/"),
          fileName,
        ),
      );
    }
  }

  const blurBuf = await sharp(base)
    .resize({ width: 20, withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  return {
    width,
    height,
    aspectRatio: Number((width / height).toFixed(4)),
    blurDataURL,
    widths: targets.slice(),
    kind,
    files,
  };
}

async function main() {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw) as Manifest;

  for (const item of ITEMS) {
    const file = path.join(SOURCE_ROOT, item.workFolder, item.rel);
    const ext = path.extname(file).toLowerCase();
    const isVideo = VIDEO_EXT.has(ext);
    const baseName = imageName(item.rel);
    const name = isVideo ? `${baseName}-poster` : baseName;
    const key = path.posix.join("works", item.slug, name);
    const outDir = path.join(PUBLIC_WORKS, item.slug);

    let entry: ManifestEntry;
    if (isVideo) {
      const tmp = mkdtempSync(path.join(tmpdir(), "vicposter-"));
      try {
        const poster = extractPoster(file, tmp);
        if (!poster) throw new Error("ffmpeg poster extraction failed");
        entry = await generateDerivatives(sharp(poster).rotate(), outDir, name, "video-poster");
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    } else {
      entry = await generateDerivatives(await loadSharp(file, ext), outDir, name, "image");
    }

    manifest[key] = entry;
    console.log(`  ✓ ${key}  (${entry.width}×${entry.height}, ${entry.widths.length} widths)`);
  }

  const ordered: Manifest = {};
  for (const k of Object.keys(manifest).sort()) ordered[k] = manifest[k];
  await writeFile(MANIFEST_PATH, JSON.stringify(ordered, null, 2) + "\n");
  console.log(`\n✓ merged ${ITEMS.length} entries → ${path.relative(PROJECT_ROOT, MANIFEST_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
