/**
 * scripts/make-loops.ts — Phase 1.5 (K1 + K5) background-loop pipeline.
 *
 * Takes a master video per work and produces lightweight, silent, self-hosted
 * background loops for the grid (WebM VP9 + MP4 H.264), plus — when asked — a
 * recompressed full-player MP4 for the work card (K5).
 *
 * What it does per master (K1):
 *   1. cut a ~6–8 s segment starting at `loopStart` (default 0)
 *   2. resize to width <= 800px (CSS object-cover finishes the crop)
 *   3. strip audio (-an)
 *   4. encode WebM (libvpx-vp9 -crf 32 -b:v 0) + MP4 (libx264 -crf 26
 *      -pix_fmt yuv420p -movflags +faststart)
 *   Target weight: 200–800 KB / loop.
 *   Optionally a 480-wide pair (--mobile) for `loop-480.{webm,mp4}`.
 *
 * Outputs (CONTRACT — a separate reader agent depends on these exact paths):
 *   public/works/<slug>/loop-720.webm
 *   public/works/<slug>/loop-720.mp4
 *   public/works/<slug>/loop-480.webm   (optional, --mobile)
 *   public/works/<slug>/loop-480.mp4    (optional, --mobile)
 *
 * Manifest (CONTRACT): merges ONE entry per work under key
 *   works/<slug>/loop   (kind: "loop"), shape documented at LoopManifestEntry.
 *   MERGE, never overwrite — exactly like import-use-this.ts.
 *
 * loopStart: read read-only from src/content/works/<slug>/index.json (default 0).
 *
 * K5 (full-player recompress), opt-in with --player:
 *   recompress the master to H.264 CRF 23, +faststart, height <= 1080,
 *   audio kept → public/works/<slug>/player.mp4  (target < ~1.5 MB).
 *   This is NOT registered as a loop; the script only writes the file and
 *   reports it (wiring the player source is an app-code change, left to the
 *   app agent — this script never edits src/ or index.json).
 *
 * Idempotent: a content cache keyed by source mtime+size lives in
 *   .cache/loops.json (gitignored) — a second run skips unchanged sources.
 *   Each cache record stores the manifest entry, replayed on a hit, AND the
 *   set of output options (segment/width/mobile/player) so changing flags
 *   re-runs even on an unchanged source.
 *
 * Run:
 *   npx tsx scripts/make-loops.ts <file-or-dir> [--player] [--mobile]
 *                                 [--slug <slug>] [--seg <seconds>]
 *
 *   <file-or-dir>:
 *     - a single mp4/mov/… → one work (slug from --slug or the parent folder)
 *     - a directory of <slug>/master.mp4 layout, OR a flat dir of videos whose
 *       basename is the slug → batch.
 *
 * Examples:
 *   npx tsx scripts/make-loops.ts public/works/delta/img-9474.mp4 --slug delta --player
 *   npx tsx scripts/make-loops.ts ~/Downloads/masters            # batch
 */

import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_WORKS = path.join(PROJECT_ROOT, "public", "works");
const CONTENT_WORKS = path.join(PROJECT_ROOT, "src", "content", "works");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "content", "works.manifest.json");
const CACHE_PATH = path.join(PROJECT_ROOT, ".cache", "loops.json");

/** Loop segment length (seconds). Override with --seg. */
const DEFAULT_SEGMENT = 7;
/** Loop widths. 720 = the contract base; 480 = optional mobile (--mobile). */
const LOOP_WIDTH = 800; // visual ceiling per spec (<=800px); file named loop-720.*
const MOBILE_WIDTH = 480;
/**
 * Frame-rate caps. Masters are often 60fps (Delta is) — a silent background
 * loop reads fine at 30fps and that roughly halves the bytes, which is what
 * lands the loop in the 200–800 KB target. The player keeps motion at 30fps
 * too (60fps 1080p barely compresses under CRF).
 */
const LOOP_FPS = 30;
const PLAYER_FPS = 30;
/** Loop CRF defaults (spec). Override per-run with --webm-crf / --mp4-crf. */
const DEFAULT_WEBM_CRF = 32;
const DEFAULT_MP4_CRF = 26;
/** Full-player (K5) defaults. Override with --player-crf / --player-height. */
const DEFAULT_PLAYER_CRF = 23;
const DEFAULT_PLAYER_MAX_HEIGHT = 1080;

const VIDEO_EXT = new Set([".mov", ".mp4", ".m4v", ".webm"]);

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Loop manifest entry (CONTRACT with the app reader agent).
 * One entry per work, keyed `works/<slug>/loop`.
 *
 * - kind: always "loop" (lets consumers branch alongside "image"/"video-poster")
 * - width/height/aspectRatio: dimensions of the ENCODED loop (after resize)
 * - durationSeconds: length of the encoded segment
 * - widths: which loop tiers exist (720 always; 480 when --mobile)
 * - loop: { webm, mp4 } paths (relative to /public) of the 720 tier
 * - loopMobile?: { webm, mp4 } paths of the 480 tier (present only with --mobile)
 * - files: every generated file, relative to /public (loops only; player.mp4
 *          is intentionally NOT listed here — it's a separate K5 derivative)
 */
interface LoopManifestEntry {
  kind: "loop";
  width: number;
  height: number;
  aspectRatio: number;
  durationSeconds: number;
  widths: number[];
  loop: { webm: string; mp4: string };
  loopMobile?: { webm: string; mp4: string };
  files: string[];
}

type Manifest = Record<string, unknown>;

interface CacheRecord {
  mtimeMs: number;
  size: number;
  /** output options fingerprint — flag changes force a re-run on same source */
  opts: string;
  entry: LoopManifestEntry;
}
type Cache = Record<string, CacheRecord>;

interface Options {
  player: boolean;
  mobile: boolean;
  segment: number;
  slug?: string;
  /** VP9 / x264 CRF for loops (default spec 32 / 26). */
  webmCrf: number;
  mp4Crf: number;
  /** player CRF + height cap (K5). */
  playerCrf: number;
  playerHeight: number;
}

interface Job {
  slug: string;
  source: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function expandHome(p: string): string {
  return p.replace(/^~(?=$|\/)/, process.env.HOME ?? "~");
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function fileSizeKB(p: string): number {
  try {
    return statSync(p).size / 1024;
  } catch {
    return 0;
  }
}

/** Probe a video stream: width, height, duration (seconds). */
function probe(file: string): { width: number; height: number; duration: number } | null {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1",
      file,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  const out = r.stdout ?? "";
  const num = (key: string) => {
    const m = out.match(new RegExp(`^${key}=(.+)$`, "m"));
    return m ? parseFloat(m[1]) : NaN;
  };
  const width = num("width");
  const height = num("height");
  const duration = num("duration");
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height, duration: Number.isFinite(duration) ? duration : 0 };
}

/** loopStart (seconds) from src/content/works/<slug>/index.json (read-only). */
async function readLoopStart(slug: string): Promise<number> {
  const p = path.join(CONTENT_WORKS, slug, "index.json");
  const json = await readJson<{ loopStart?: number }>(p, {});
  const v = json.loopStart;
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
}

function runFfmpeg(args: string[]): void {
  const r = spawnSync("ffmpeg", args, { stdio: "ignore" });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed: ffmpeg ${args.join(" ")}`);
  }
}

/** Even width preserving aspect (yuv420p / VP9 need even dimensions). */
function scaleFilter(targetWidth: number): string {
  // -2 keeps height even and proportional; cap width but never upscale.
  return `scale='min(${targetWidth},iw)':-2`;
}

const publicRel = (abs: string) =>
  path.posix.join("works", path.relative(PUBLIC_WORKS, abs).split(path.sep).join("/"));

// ── Encoders ────────────────────────────────────────────────────────────────

function encodeWebm(src: string, start: number, seg: number, width: number, crf: number, out: string): void {
  runFfmpeg([
    "-y",
    "-ss", start.toFixed(2),
    "-t", seg.toFixed(2),
    "-i", src,
    "-an",
    "-r", String(LOOP_FPS),
    "-vf", scaleFilter(width),
    "-c:v", "libvpx-vp9",
    "-crf", String(crf),
    "-b:v", "0",
    "-row-mt", "1",
    "-pix_fmt", "yuv420p",
    out,
  ]);
}

function encodeMp4Loop(src: string, start: number, seg: number, width: number, crf: number, out: string): void {
  runFfmpeg([
    "-y",
    "-ss", start.toFixed(2),
    "-t", seg.toFixed(2),
    "-i", src,
    "-an",
    "-r", String(LOOP_FPS),
    "-vf", scaleFilter(width),
    "-c:v", "libx264",
    "-crf", String(crf),
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    out,
  ]);
}

/** K5: full-player recompress — keep audio, height-capped, faststart. */
function encodePlayer(src: string, crf: number, maxHeight: number, out: string): void {
  // Cap height at maxHeight (downscale only, never upscale), keep aspect,
  // force even dimensions for yuv420p.
  const vf =
    `scale=-2:'min(${maxHeight},ih)',` +
    `scale=trunc(iw/2)*2:trunc(ih/2)*2`;
  runFfmpeg([
    "-y",
    "-i", src,
    "-r", String(PLAYER_FPS),
    "-vf", vf,
    "-c:v", "libx264",
    "-crf", String(crf),
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    out,
  ]);
}

// ── Per-work pipeline ────────────────────────────────────────────────────────

async function processJob(
  job: Job,
  opts: Options,
  manifest: Manifest,
  cache: Cache,
  optsFingerprint: string,
): Promise<{ status: "encoded" | "cached"; report: string }> {
  const { slug, source } = job;
  const key = path.posix.join("works", slug, "loop");
  const outDir = path.join(PUBLIC_WORKS, slug);

  const st = await stat(source);
  const cached = cache[source];
  if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size && cached.opts === optsFingerprint) {
    manifest[key] = cached.entry;
    return { status: "cached", report: `  ⟳ ${slug}  (cache)` };
  }

  const meta = probe(source);
  if (!meta) throw new Error(`ffprobe failed for ${source}`);

  await mkdir(outDir, { recursive: true });

  const loopStart = await readLoopStart(slug);
  // clamp segment to available footage after loopStart
  const avail = meta.duration > 0 ? Math.max(0, meta.duration - loopStart) : opts.segment;
  const seg = meta.duration > 0 ? Math.min(opts.segment, avail) : opts.segment;

  // ── 720 tier (contract base) ──
  const webm720 = path.join(outDir, "loop-720.webm");
  const mp4720 = path.join(outDir, "loop-720.mp4");
  encodeWebm(source, loopStart, seg, LOOP_WIDTH, opts.webmCrf, webm720);
  encodeMp4Loop(source, loopStart, seg, LOOP_WIDTH, opts.mp4Crf, mp4720);

  const files = [publicRel(webm720), publicRel(mp4720)];
  let loopMobile: LoopManifestEntry["loopMobile"];
  const widths = [720];

  // ── 480 tier (optional) ──
  if (opts.mobile) {
    const webm480 = path.join(outDir, "loop-480.webm");
    const mp4480 = path.join(outDir, "loop-480.mp4");
    encodeWebm(source, loopStart, seg, MOBILE_WIDTH, opts.webmCrf, webm480);
    encodeMp4Loop(source, loopStart, seg, MOBILE_WIDTH, opts.mp4Crf, mp4480);
    loopMobile = { webm: publicRel(webm480), mp4: publicRel(mp4480) };
    files.push(publicRel(webm480), publicRel(mp4480));
    widths.push(480);
  }

  // encoded loop dimensions (probe the produced 720 mp4 for ground truth)
  const enc = probe(mp4720) ?? meta;

  const entry: LoopManifestEntry = {
    kind: "loop",
    width: enc.width,
    height: enc.height,
    aspectRatio: Number((enc.width / enc.height).toFixed(4)),
    durationSeconds: Number(seg.toFixed(2)),
    widths,
    loop: { webm: publicRel(webm720), mp4: publicRel(mp4720) },
    ...(loopMobile ? { loopMobile } : {}),
    files,
  };
  manifest[key] = entry;
  cache[source] = { mtimeMs: st.mtimeMs, size: st.size, opts: optsFingerprint, entry };

  // ── K5: full-player recompress (opt-in) ──
  let playerLine = "";
  if (opts.player) {
    const playerOut = path.join(outDir, "player.mp4");
    encodePlayer(source, opts.playerCrf, opts.playerHeight, playerOut);
    playerLine = `\n      player.mp4 → ${publicRel(playerOut)} (${fileSizeKB(playerOut).toFixed(0)} KB)`;
  }

  const report =
    `  ✓ ${slug}  ${enc.width}×${enc.height} · ${seg.toFixed(1)}s` +
    `\n      loop-720.webm ${fileSizeKB(webm720).toFixed(0)} KB · loop-720.mp4 ${fileSizeKB(mp4720).toFixed(0)} KB` +
    (opts.mobile
      ? `\n      loop-480.webm ${fileSizeKB(path.join(outDir, "loop-480.webm")).toFixed(0)} KB · loop-480.mp4 ${fileSizeKB(path.join(outDir, "loop-480.mp4")).toFixed(0)} KB`
      : "") +
    playerLine;
  return { status: "encoded", report };
}

// ── Input resolution ─────────────────────────────────────────────────────────

/** Figure out the list of {slug, source} jobs from a file or directory. */
async function resolveJobs(input: string, slugOverride?: string): Promise<Job[]> {
  const abs = path.resolve(expandHome(input));
  const st = await stat(abs);

  if (st.isFile()) {
    if (!VIDEO_EXT.has(path.extname(abs).toLowerCase())) {
      throw new Error(`not a video file: ${abs}`);
    }
    const slug = slugOverride ?? path.basename(path.dirname(abs));
    return [{ slug, source: abs }];
  }

  // Directory. Two layouts:
  //   (a) <dir>/<slug>/<one master video>   — folder name is the slug
  //   (b) <dir>/<slug>.mp4                    — basename is the slug
  const jobs: Job[] = [];
  const entries = await readdir(abs, { withFileTypes: true });
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) {
      const inner = (await readdir(full)).filter(
        (n) => !n.startsWith(".") && VIDEO_EXT.has(path.extname(n).toLowerCase()),
      );
      if (inner.length === 0) continue;
      // pick the largest as the master
      let best = inner[0];
      let bestSize = 0;
      for (const n of inner) {
        const s = fileSizeKB(path.join(full, n));
        if (s > bestSize) { bestSize = s; best = n; }
      }
      jobs.push({ slug: e.name, source: path.join(full, best) });
    } else if (e.isFile() && VIDEO_EXT.has(path.extname(e.name).toLowerCase())) {
      jobs.push({ slug: path.basename(e.name, path.extname(e.name)), source: full });
    }
  }
  if (jobs.length === 0) throw new Error(`no video files found under ${abs}`);
  return jobs;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { input: string; opts: Options } {
  let input: string | undefined;
  const opts: Options = {
    player: false,
    mobile: false,
    segment: DEFAULT_SEGMENT,
    webmCrf: DEFAULT_WEBM_CRF,
    mp4Crf: DEFAULT_MP4_CRF,
    playerCrf: DEFAULT_PLAYER_CRF,
    playerHeight: DEFAULT_PLAYER_MAX_HEIGHT,
  };
  const numFlag = (v: string, fb: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fb;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--player") opts.player = true;
    else if (a === "--mobile") opts.mobile = true;
    else if (a === "--slug") opts.slug = argv[++i];
    else if (a === "--seg") opts.segment = numFlag(argv[++i], DEFAULT_SEGMENT);
    else if (a === "--webm-crf") opts.webmCrf = numFlag(argv[++i], DEFAULT_WEBM_CRF);
    else if (a === "--mp4-crf") opts.mp4Crf = numFlag(argv[++i], DEFAULT_MP4_CRF);
    else if (a === "--player-crf") opts.playerCrf = numFlag(argv[++i], DEFAULT_PLAYER_CRF);
    else if (a === "--player-height") opts.playerHeight = numFlag(argv[++i], DEFAULT_PLAYER_MAX_HEIGHT);
    else if (!a.startsWith("--")) input = a;
  }
  if (!input) {
    throw new Error(
      "usage: npx tsx scripts/make-loops.ts <file-or-dir> [--player] [--mobile] [--slug <slug>]\n" +
        "       [--seg <s>] [--webm-crf <n>] [--mp4-crf <n>] [--player-crf <n>] [--player-height <px>]",
    );
  }
  if (!Number.isFinite(opts.segment) || opts.segment <= 0) opts.segment = DEFAULT_SEGMENT;
  return { input, opts };
}

async function main() {
  // ffmpeg presence
  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
    console.error("✗ ffmpeg not found on PATH");
    process.exit(1);
  }

  const { input, opts } = parseArgs(process.argv.slice(2));
  const jobs = await resolveJobs(input, opts.slug);

  // options fingerprint: changing flags must invalidate the source cache
  const optsFingerprint = JSON.stringify({
    seg: opts.segment,
    mobile: opts.mobile,
    player: opts.player,
    w: LOOP_WIDTH,
    mw: MOBILE_WIDTH,
    fps: LOOP_FPS,
    webmCrf: opts.webmCrf,
    mp4Crf: opts.mp4Crf,
    playerCrf: opts.playerCrf,
    playerHeight: opts.playerHeight,
  });

  console.log(`\n▶ make-loops`);
  console.log(`  input  : ${input}`);
  console.log(`  jobs   : ${jobs.length}  (${jobs.map((j) => j.slug).join(", ")})`);
  console.log(`  flags  : seg=${opts.segment}s${opts.mobile ? " +mobile" : ""}${opts.player ? " +player" : ""}`);

  const manifest = await readJson<Manifest>(MANIFEST_PATH, {});
  const before = Object.keys(manifest).length;
  const cache = await readJson<Cache>(CACHE_PATH, {});

  let encoded = 0;
  let cachedN = 0;
  const skipped: string[] = [];

  for (const job of jobs) {
    try {
      const r = await processJob(job, opts, manifest, cache, optsFingerprint);
      console.log(r.report);
      if (r.status === "cached") cachedN++;
      else encoded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      skipped.push(`${job.slug}: ${msg}`);
      console.log(`  ✗ ${job.slug}  ${msg}`);
    }
  }

  // persist manifest (stable key order) + cache
  const ordered: Manifest = {};
  for (const k of Object.keys(manifest).sort()) ordered[k] = manifest[k];
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(ordered, null, 2) + "\n");
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");

  console.log(`\n── results ──`);
  console.log(`  encoded          : ${encoded}`);
  console.log(`  served from cache: ${cachedN}`);
  console.log(`  skipped          : ${skipped.length}`);
  for (const s of skipped) console.log(`    - ${s}`);
  console.log(
    `  manifest entries : ${Object.keys(ordered).length} (было ${before}, +${
      Object.keys(ordered).length - before
    } merge)`,
  );
  console.log(`  manifest → ${path.relative(PROJECT_ROOT, MANIFEST_PATH)}`);
  console.log(`  cache    → ${path.relative(PROJECT_ROOT, CACHE_PATH)}`);
  console.log(`✓ done\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
