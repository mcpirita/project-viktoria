import Image from "next/image";
import type { ResolvedImage } from "@/lib/schema";
import { toRenderable } from "./image";

/**
 * A single work frame inside a fixed aspect-ratio box (anti-CLS). Renders a real
 * `next/image` when the manifest has metadata for the ref; otherwise a calm
 * rose-toned placeholder with a micro index label. Either way the box reserves
 * its space up front. Used by the project gallery and the index hover-preview.
 */
export function WorkFigure({
  slug,
  image,
  index = 0,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  fallbackRatio = "3 / 4",
  className = "",
  alt = "",
}: {
  slug: string;
  image: ResolvedImage;
  index?: number;
  priority?: boolean;
  sizes?: string;
  fallbackRatio?: string;
  className?: string;
  alt?: string;
}) {
  const renderable = toRenderable(slug, image);

  if (!renderable) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep] ${className}`}
        style={{ aspectRatio: fallbackRatio }}
        aria-hidden
      >
        {/* faint diagonal weave so empty frames read as intentional, not broken */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 11px, rgba(92,29,36,0.05) 11px 12px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="label-micro text-[--color-maroon-muted]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep] ${className}`}
      style={{ aspectRatio: renderable.aspectRatio }}
    >
      <Image
        src={renderable.src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={renderable.blurDataURL ? "blur" : undefined}
        blurDataURL={renderable.blurDataURL}
        className="object-cover"
      />
    </div>
  );
}
