/**
 * Phase F — image resolution helpers (client-safe, no Node deps).
 *
 * The data layer (Phase B) gives us `ResolvedImage { ref, meta? }`. Phase C lays
 * real derivatives in `public/works/<slug>/<name>-{400,800,1200,2000}.{webp,avif}`
 * and records metadata in the manifest. When `meta` is present we can build a
 * concrete `next/image` src; when it is absent (B fixtures point at placeholder
 * names like `still-01` for which no file exists) we render a stable skeleton
 * block instead — no broken <img>, no CLS. Phase H swaps in real frames.
 *
 * We deliberately point `next/image` at a single derivative URL (the 1200px
 * webp) and let the runtime optimizer/`sizes` handle the rest. The blur comes
 * straight from the manifest.
 */

import type { ResolvedImage } from "@/lib/schema";

/** A picture we can actually render: a concrete URL + intrinsic dimensions. */
export type RenderableImage = {
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  blurDataURL?: string;
};

/**
 * Build a renderable image from a ResolvedImage, or `null` when there is no
 * manifest metadata (→ caller renders a placeholder). Picking the 1200 webp as
 * the base src keeps it simple and well-supported; `next/image` + `sizes` does
 * responsive selection on top.
 */
export function toRenderable(
  slug: string,
  img: ResolvedImage,
): RenderableImage | null {
  const meta = img.meta;
  if (!meta) return null;

  // Strip any extension the ref might carry (manifest key is extension-less).
  const base = img.ref.replace(/\.(jpe?g|png|webp|avif|heic|tiff?)$/i, "");
  const widths = meta.widths?.length ? meta.widths : [400, 800, 1200, 2000];
  // Prefer a mid derivative for the base src; fall back to the largest we have.
  const chosen =
    widths.find((w) => w >= 1200) ?? widths[widths.length - 1] ?? 1200;

  return {
    src: `/works/${slug}/${base}-${chosen}.webp`,
    width: meta.width,
    height: meta.height,
    aspectRatio: meta.aspectRatio || meta.width / meta.height || 4 / 3,
    blurDataURL: meta.blurDataURL,
  };
}

/** First renderable image in a list, else null. Used for index hover-preview. */
export function firstRenderable(
  slug: string,
  images: ResolvedImage[],
): RenderableImage | null {
  for (const img of images) {
    const r = toRenderable(slug, img);
    if (r) return r;
  }
  return null;
}
