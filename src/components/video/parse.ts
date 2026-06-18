/**
 * Video URL/ID parsing utilities for the `<VideoEmbed>` facade (Phase G).
 *
 * Goal: accept whatever Phase B's `Work.video` field carries — a full URL
 * (YouTube watch?v=, youtu.be short, youtube-nocookie, Vimeo, or a direct .mp4),
 * or a bare provider id — and normalise it into `{ provider, id }`.
 *
 * No runtime deps. Pure functions, safe to call on server or client.
 */

/** Supported embed providers. */
export type VideoProvider = "youtube" | "vimeo" | "mp4";

/** Result of resolving a raw video source. */
export type ParsedVideo = {
  provider: VideoProvider;
  /**
   * For youtube/vimeo — the platform video id.
   * For mp4 — the (absolute or root-relative) file URL.
   */
  id: string;
  /**
   * Optional start offset in whole seconds, parsed from the source URL's
   * `t`/`start` param (YouTube: `?t=113` or `?t=1m53s`; Vimeo: `#t=113s`).
   * The tapped player begins here; omitted = play from the start.
   */
  start?: number;
};

/**
 * Extract a YouTube video id from a URL, or `null` if it isn't a YouTube URL.
 * Handles: `youtube.com/watch?v=ID`, `youtu.be/ID`,
 * `youtube.com/embed/ID`, `youtube-nocookie.com/embed/ID`, `youtube.com/shorts/ID`.
 */
export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id || null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    // watch?v=ID
    const v = u.searchParams.get("v");
    if (v) return v;
    // /embed/ID or /shorts/ID or /v/ID
    const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
    if (m) return m[1];
  }

  return null;
}

/**
 * Extract a Vimeo video id (numeric) from a URL, or `null`.
 * Handles: `vimeo.com/ID`, `vimeo.com/channels/x/ID`,
 * `player.vimeo.com/video/ID`.
 */
export function parseVimeoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

  // Last numeric path segment wins (handles /video/ID and /channels/.../ID).
  const segments = u.pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segments[i])) return segments[i];
  }
  return null;
}

/**
 * Parse a start offset (whole seconds) from a `t`/`start` value. Accepts a bare
 * number of seconds (`113`, `113s`) or YouTube's `1h2m3s` shorthand. Returns
 * `undefined` for missing/zero/unparseable input.
 */
function parseStartSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  // Plain integer seconds (with optional trailing `s`).
  if (/^\d+s?$/.test(v)) {
    const n = parseInt(v, 10);
    return n > 0 ? n : undefined;
  }
  // `1h2m3s` shorthand — any subset, in order.
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (m && (m[1] || m[2] || m[3])) {
    const total =
      (parseInt(m[1] ?? "0", 10) * 3600) +
      (parseInt(m[2] ?? "0", 10) * 60) +
      parseInt(m[3] ?? "0", 10);
    return total > 0 ? total : undefined;
  }
  return undefined;
}

/** Extract a start offset (seconds) from a URL's `t`/`start` param or `#t=` hash. */
function parseStart(url: string): number | undefined {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  const fromQuery =
    parseStartSeconds(u.searchParams.get("t")) ??
    parseStartSeconds(u.searchParams.get("start"));
  if (fromQuery) return fromQuery;
  // Vimeo carries time in the hash, e.g. `#t=113s`.
  const hash = u.hash.match(/(?:^|[#&])t=([^&]+)/);
  return hash ? parseStartSeconds(hash[1]) : undefined;
}

/** True when the URL looks like a direct video file (mp4/webm/mov/m4v). */
function looksLikeFile(url: string): boolean {
  // Strip query/hash before testing the extension.
  const path = url.split(/[?#]/)[0];
  return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(path);
}

/**
 * Resolve a raw video source into `{ provider, id }`.
 *
 * Resolution order:
 *  1. If an explicit `provider` is passed and `src` is a bare id (not a URL),
 *     use them directly.
 *  2. Otherwise sniff the URL: YouTube → Vimeo → file (mp4).
 *
 * Throws if the source can't be resolved, so a content mistake surfaces loudly
 * (callers may catch and render a fallback).
 */
export function parseVideo(src: string, provider?: VideoProvider): ParsedVideo {
  const raw = src.trim();
  if (!raw) throw new Error("parseVideo: empty src");

  const isUrl = /^(https?:)?\/\//i.test(raw) || raw.startsWith("/");

  // Explicit provider + bare id (no scheme/slash) → trust the caller.
  if (provider && provider !== "mp4" && !isUrl) {
    return { provider, id: raw };
  }
  if (provider === "mp4") {
    return { provider: "mp4", id: raw };
  }

  const start = parseStart(raw);

  const yt = parseYouTubeId(raw);
  if (yt) return { provider: "youtube", id: yt, start };

  const vimeo = parseVimeoId(raw);
  if (vimeo) return { provider: "vimeo", id: vimeo, start };

  if (looksLikeFile(raw)) return { provider: "mp4", id: raw };

  throw new Error(
    `parseVideo: could not determine provider for "${raw}". ` +
      `Pass an explicit \`provider\` prop or a recognised YouTube/Vimeo/mp4 URL.`,
  );
}

/**
 * Build the privacy-friendly, autoplay iframe `src` for a parsed provider video.
 * Only meaningful for youtube/vimeo (mp4 uses a native <video>).
 *
 * - YouTube → youtube-nocookie.com (no cookies until playback), `rel=0`,
 *   `playsinline=1`, `autoplay=1`, `mute=1`. GDPR-clean.
 * - Vimeo   → `dnt=1` (do-not-track), `playsinline=1`, `autoplay=1`, `muted=1`.
 *
 * Muted by default: tiles sit side-by-side in the grid, so a tapped video must
 * not blast sound (and several tapped at once would otherwise overlap). The
 * viewer un-mutes from the player's own controls when they want audio.
 */
export function buildEmbedSrc(parsed: ParsedVideo): string {
  if (parsed.provider === "youtube") {
    const params = new URLSearchParams({
      rel: "0",
      playsinline: "1",
      autoplay: "1",
      mute: "1",
    });
    if (parsed.start) params.set("start", String(parsed.start));
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.id)}?${params}`;
  }
  if (parsed.provider === "vimeo") {
    const params = new URLSearchParams({
      dnt: "1",
      playsinline: "1",
      autoplay: "1",
      muted: "1",
    });
    const base = `https://player.vimeo.com/video/${encodeURIComponent(parsed.id)}?${params}`;
    // Vimeo takes the start offset in the hash, not a query param.
    return parsed.start ? `${base}#t=${parsed.start}s` : base;
  }
  // mp4 — the id *is* the file URL.
  return parsed.id;
}

/**
 * Build a **background** iframe `src` — silent, looping, chrome-less autoplay for
 * the grid tiles (Phase H, 2026-06-18). Unlike `buildEmbedSrc` (a tapped player
 * with controls), this hides ALL UI so a video tile reads as living motion, not
 * an embedded player. The tile itself stays clickable (the iframe is
 * pointer-events:none) and opens the full work card on tap.
 *
 * - Vimeo  → `background=1` (Vimeo's purpose-built mode: autoplay, loop, muted,
 *   no controls/title/byline) + `dnt=1`.
 * - YouTube → no native background flag, so we assemble it: `autoplay+mute+loop`
 *   (loop needs `playlist=<id>`), `controls=0`, `playsinline`, no related/branding.
 * - mp4 → returns the file URL; the caller uses a native <video loop muted>.
 */
export function buildBackgroundSrc(parsed: ParsedVideo): string {
  if (parsed.provider === "youtube") {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: parsed.id, // YouTube loops a single video only via playlist=<id>
      controls: "0",
      playsinline: "1",
      modestbranding: "1",
      rel: "0",
      disablekb: "1",
      fs: "0",
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.id)}?${params}`;
  }
  if (parsed.provider === "vimeo") {
    const params = new URLSearchParams({
      background: "1",
      dnt: "1",
      muted: "1",
      autoplay: "1",
      loop: "1",
    });
    return `https://player.vimeo.com/video/${encodeURIComponent(parsed.id)}?${params}`;
  }
  // mp4 — the id *is* the file URL.
  return parsed.id;
}
