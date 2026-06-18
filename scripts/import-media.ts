/**
 * scripts/import-media.ts — Phase C image pipeline.
 *
 * Walks a source media tree (default: ~/Downloads/Commercials/<work>/...),
 * generates responsive WebP + AVIF derivatives + a blur placeholder for every
 * still image, extracts a poster frame from every video, and writes a manifest
 * that later phases (B / F) read to hydrate <Image> metadata.
 *
 * Run:   npx tsx scripts/import-media.ts [sourceDir]
 *        npx tsx scripts/import-media.ts ~/Downloads/Commercials
 *
 * Toolchain (intentional, see CLAUDE.md / MEMORY):
 *   - sharp (prebuilt binaries) for resize/encode/blur
 *   - heic-convert (pure-WASM) for HEIC -> RGB, NOT system libvips
 *   - ffmpeg (system) for video poster frames; degrades gracefully if absent
 *
 * Outputs:
 *   public/works/<slug>/<name>-{400,800,1200,2000}.{webp,avif}
 *   content/works.manifest.json
 *
 * Idempotent: a content cache keyed by source mtime+size lives in
 *   .cache/media.json  (gitignored) — a second run skips unchanged sources.
 *
 * MERGE, not overwrite: each run LOADS the existing manifest and only
 * adds/updates the keys it processed this run. Works whose source folder isn't
 * present anymore (e.g. added by hand, or imported earlier) keep their entries —
 * so dropping a new folder into the source tree and re-running is safe and never
 * silently deletes other works. (Renaming a folder leaves the old slug's keys as
 * harmless orphans; nothing references them, the site ignores them.)
 *
 * Slug mapping: a source folder's slug is auto-derived from its name (workSlug),
 * UNLESS it's listed in SLUG_OVERRIDES below — use that when a folder name would
 * otherwise produce a slug different from the work's folder in src/content/works/.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

// heic-convert ships no types and is CJS; load via createRequire so this stays
// valid under "module": "esnext". Minimal local signature instead of @types.
type HeicConvert = (opts: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<ArrayBuffer | Buffer>;
const heicConvert = createRequire(import.meta.url)("heic-convert") as HeicConvert;

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_SOURCE = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "Commercials",
);
const PUBLIC_WORKS = path.join(PROJECT_ROOT, "public", "works");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "content", "works.manifest.json");
const CACHE_PATH = path.join(PROJECT_ROOT, ".cache", "media.json");

/**
 * Responsive widths. Top tier capped at 2000 — these are lightweight
 * derivatives, but if the repo grows the 400 tier (or even 2000) can be
 * dropped here without touching call sites.
 */
const WIDTHS = [400, 800, 1200, 2000] as const;
const FORMATS = ["webp", "avif"] as const;
const WEBP_QUALITY = 78;
const AVIF_QUALITY = 50;
/** Poster frame timestamp; clamped to clip duration for very short videos. */
const POSTER_SECONDS = 1;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const HEIC_EXT = new Set([".heic", ".heif"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".m4v", ".webm"]);

// ── Types ───────────────────────────────────────────────────────────────────

interface ManifestEntry {
  /** intrinsic (post-rotation) source dimensions */
  width: number;
  height: number;
  aspectRatio: number;
  blurDataURL: string;
  /** widths actually generated (never upscaled past intrinsic width) */
  widths: number[];
  /** source kind so consumers can flag video-derived posters */
  kind: "image" | "video-poster";
  /** generated files, relative to /public */
  files: string[];
}

type Manifest = Record<string, ManifestEntry>;

interface CacheRecord {
  mtimeMs: number;
  size: number;
  /** the manifest entry produced last time, replayed on cache hit */
  entry: ManifestEntry;
}

type Cache = Record<string, CacheRecord>;

// ── Slugify ─────────────────────────────────────────────────────────────────

const SLUG_MAX_WORDS = 4;

/** kebab-case slug: lowercase, ASCII-fold, strip punctuation, collapse dashes. */
function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[‘’“”]/g, "") // curly quotes
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/[^\x00-\x7F]/g, "") // drop any non-ASCII residue
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Явный маппинг «имя папки-источника → slug работы». Нужен там, где
 * автогенерация (workSlug) дала бы slug, не совпадающий с папкой работы в
 * src/content/works/. Папки, которых тут нет, получают slug автоматически.
 * Добавляя новую работу с «неудобным» именем папки — впиши соответствие сюда.
 */
const SLUG_OVERRIDES: Record<string, string> = {
  "Tommy Cash x Maison Margiela": "maison-margiela-tommy-cash",
  "Yale - Smart Locks - Sales Videos": "yale-smart-locks",
};

/** Work-folder slug, capped to a few words so e.g.
 *  "Bolt Whatever you do there is Bolt for that" -> "bolt-whatever-you-do". */
function workSlug(folderName: string): string {
  if (SLUG_OVERRIDES[folderName]) return SLUG_OVERRIDES[folderName];
  const full = slugify(folderName);
  if (!full) return "work";
  return full.split("-").slice(0, SLUG_MAX_WORDS).join("-");
}

/**
 * Per-image name = slugified relative path inside the work folder
 * (subfolders + basename, no extension). This keeps names unique across the
 * "Low quality" / "Prep" / "Process" subfolders that reuse basenames.
 */
function imageName(relInsideWork: string): string {
  const noExt = relInsideWork.replace(/\.[^.]+$/, "");
  const slug = slugify(noExt);
  return slug || "img";
}

// ── FS helpers ──────────────────────────────────────────────────────────────

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue; // .DS_Store et al.
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

// ── Decoding ────────────────────────────────────────────────────────────────

/** Returns a rotation-normalized sharp instance for a still image / HEIC. */
async function loadSharp(file: string, ext: string): Promise<sharp.Sharp> {
  if (HEIC_EXT.has(ext)) {
    const input = await readFile(file);
    const jpeg = await heicConvert({ buffer: input, format: "JPEG", quality: 1 });
    return sharp(Buffer.from(jpeg as ArrayBuffer)).rotate();
  }
  return sharp(file).rotate(); // .rotate() bakes EXIF orientation (iPhone)
}

// ── ffmpeg ──────────────────────────────────────────────────────────────────

let ffmpegChecked = false;
let ffmpegAvailable = false;

function hasFfmpeg(): boolean {
  if (ffmpegChecked) return ffmpegAvailable;
  ffmpegChecked = true;
  ffmpegAvailable =
    spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
  return ffmpegAvailable;
}

function ffprobeDuration(file: string): number | null {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ],
    { encoding: "utf8" },
  );
  const d = parseFloat((r.stdout ?? "").trim());
  return Number.isFinite(d) ? d : null;
}

/** Extracts a poster frame to a temp PNG; returns its path or null. */
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

// ── Core derivative generation ───────────────────────────────────────────────

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

  // Work from a normalized RGB buffer so we can branch into N sizes/formats
  // without re-decoding the source each time.
  const base = await img.toColorspace("srgb").toBuffer();

  const targets: number[] = WIDTHS.filter((w) => w <= width);
  if (targets.length === 0) targets.push(width); // tiny source: emit at native

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

  // Blur placeholder: ~20px wide webp, inlined as data URL.
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

// ── Pipeline ────────────────────────────────────────────────────────────────

interface Stats {
  images: number;
  posters: number;
  cached: number;
  skipped: { file: string; reason: string }[];
}

async function main() {
  const argSource = process.argv[2];
  const SOURCE = path.resolve(
    argSource ? argSource.replace(/^~(?=$|\/)/, process.env.HOME ?? "~") : DEFAULT_SOURCE,
  );

  console.log(`\n▶ import-media`);
  console.log(`  source : ${SOURCE}`);
  console.log(`  output : ${path.relative(PROJECT_ROOT, PUBLIC_WORKS)}/`);
  console.log(`  ffmpeg : ${hasFfmpeg() ? "available" : "MISSING (videos will be skipped)"}`);

  try {
    await stat(SOURCE);
  } catch {
    console.error(`\n✗ source dir not found: ${SOURCE}`);
    process.exit(1);
  }

  const cache = await readJson<Cache>(CACHE_PATH, {});
  // MERGE base: start from the existing manifest so works not present in the
  // source tree this run keep their entries (see header). New/changed keys
  // below add to or overwrite this base; nothing else is dropped.
  const manifest: Manifest = await readJson<Manifest>(MANIFEST_PATH, {});
  const before = Object.keys(manifest).length;
  const slugMap = new Map<string, string>(); // folder -> slug, for the report
  const stats: Stats = { images: 0, posters: 0, cached: 0, skipped: [] };

  // Top-level entries = "works". Loose files directly under SOURCE are ignored.
  const topEntries = await readdir(SOURCE, { withFileTypes: true });
  const workDirs = topEntries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  for (const folder of workDirs) {
    const slug = workSlug(folder);
    slugMap.set(folder, slug);
    const workPath = path.join(SOURCE, folder);
    const outDir = path.join(PUBLIC_WORKS, slug);

    const files = (await walk(workPath)).sort();
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const isImage = IMAGE_EXT.has(ext) || HEIC_EXT.has(ext);
      const isVideo = VIDEO_EXT.has(ext);
      if (!isImage && !isVideo) continue;

      const relInsideWork = path.relative(workPath, file);
      const baseName = imageName(relInsideWork);
      // Posters get a -poster suffix to distinguish from stills.
      const name = isVideo ? `${baseName}-poster` : baseName;
      const key = path.posix.join("works", slug, name);

      // Cache check (mtime + size of the *source*).
      const st = await stat(file);
      const cacheKey = file;
      const cached = cache[cacheKey];
      if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) {
        manifest[key] = cached.entry;
        stats.cached++;
        if (cached.entry.kind === "video-poster") stats.posters++;
        else stats.images++;
        continue;
      }

      try {
        let entry: ManifestEntry;
        if (isVideo) {
          if (!hasFfmpeg()) {
            stats.skipped.push({ file, reason: "ffmpeg not available" });
            continue;
          }
          const tmp = mkdtempSync(path.join(tmpdir(), "vicposter-"));
          try {
            const poster = extractPoster(file, tmp);
            if (!poster) {
              stats.skipped.push({ file, reason: "ffmpeg poster extraction failed" });
              continue;
            }
            const img = sharp(poster).rotate();
            entry = await generateDerivatives(img, outDir, name, "video-poster");
          } finally {
            rmSync(tmp, { recursive: true, force: true });
          }
          stats.posters++;
        } else {
          const img = await loadSharp(file, ext);
          entry = await generateDerivatives(img, outDir, name, "image");
          stats.images++;
        }

        manifest[key] = entry;
        cache[cacheKey] = { mtimeMs: st.mtimeMs, size: st.size, entry };
        process.stdout.write(".");
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        stats.skipped.push({ file, reason });
      }
    }
  }

  process.stdout.write("\n");

  // Persist manifest (stable key order) and cache.
  const ordered: Manifest = {};
  for (const k of Object.keys(manifest).sort()) ordered[k] = manifest[k];
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(ordered, null, 2) + "\n");
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\n── slug map ──`);
  for (const [folder, slug] of slugMap) console.log(`  ${folder}  →  ${slug}`);

  console.log(`\n── results ──`);
  console.log(`  images processed : ${stats.images}`);
  console.log(`  video posters    : ${stats.posters}`);
  console.log(`  served from cache: ${stats.cached}`);
  console.log(
    `  manifest entries : ${Object.keys(ordered).length} (было ${before}, +${
      Object.keys(ordered).length - before
    } merge)`,
  );
  console.log(`  skipped          : ${stats.skipped.length}`);
  for (const s of stats.skipped) {
    console.log(`    - ${path.relative(SOURCE, s.file)} :: ${s.reason}`);
  }

  console.log(`\n  manifest → ${path.relative(PROJECT_ROOT, MANIFEST_PATH)}`);
  console.log(`  cache    → ${path.relative(PROJECT_ROOT, CACHE_PATH)}`);
  console.log(`✓ done\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
