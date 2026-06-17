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

  const yt = parseYouTubeId(raw);
  if (yt) return { provider: "youtube", id: yt };

  const vimeo = parseVimeoId(raw);
  if (vimeo) return { provider: "vimeo", id: vimeo };

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
 *   `playsinline=1`, `autoplay=1`. GDPR-clean.
 * - Vimeo   → `dnt=1` (do-not-track), `playsinline=1`, `autoplay=1`.
 */
export function buildEmbedSrc(parsed: ParsedVideo): string {
  if (parsed.provider === "youtube") {
    const params = new URLSearchParams({
      rel: "0",
      playsinline: "1",
      autoplay: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.id)}?${params}`;
  }
  if (parsed.provider === "vimeo") {
    const params = new URLSearchParams({
      dnt: "1",
      playsinline: "1",
      autoplay: "1",
    });
    return `https://player.vimeo.com/video/${encodeURIComponent(parsed.id)}?${params}`;
  }
  // mp4 — the id *is* the file URL.
  return parsed.id;
}
