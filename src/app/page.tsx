import Image from "next/image";
import { Body, Eyebrow, Heading, Section } from "@/components/ui";
import { getFeatured } from "@/lib/works";
import { pickCover } from "@/components/site/image";
import { Showcase } from "@/components/site/Showcase";
import type { IndexEntry } from "@/components/site/types";

/**
 * Live home page (grid-first). Server component: pulls the curated featured works
 * + categories from the data layer (B), resolves each tile's poster frame once
 * (C manifest), and hands a lean `IndexEntry[]` to the `Showcase` client island
 * (sticky header filters + the visible work grid). Hero, marquee, about and
 * contact stay server-rendered around the island.
 *
 * Copy comes from content/copy-en.md; missing facts (production, city, contacts)
 * render as honest placeholders for Phase H.
 */

// Confirmed brands for the clients marquee (copy-en.md §5).
const CLIENTS = [
  "ADIDAS",
  "BMW",
  "BOLT",
  "VOLKSWAGEN",
  "DELTA AIRLINES",
  "JÄGERMEISTER",
  "JAMESON",
  "HIGHSNOBIETY",
  "LASCANA",
  "TELE2",
  "TOMMY CASH",
  "VICTORINOX",
  "SOMAT",
  "EBAY",
  "BOSCH",
  "LG",
  "LIDL",
  "EDEKA",
  "MAISON MARGIELA",
  "NUTELLA",
  "TALLINK",
  "LHV",
  "SEB",
  "COCA-COLA",
  "RACER WORLDWIDE",
];

export default async function Home() {
  const works = await getFeatured(20);

  const entries: IndexEntry[] = works.map((w) => {
    const preview = pickCover(w.slug, w.cover, w.final, w.process);
    return {
      slug: w.slug,
      client: w.client.toUpperCase(),
      title: w.title ? w.title.toUpperCase() : undefined,
      production: w.production ? w.production.toUpperCase() : undefined,
      category: w.category,
      preview,
      // Video work: real link, a video-poster frame, or a moving-image category.
      isVideo:
        Boolean(w.video) ||
        preview?.kind === "video-poster" ||
        w.category === "music-video",
      video: w.video,
    };
  });

  return (
    <main id="top">
      {/* ---- Compact masthead (name + menu + marquee) + work grid -------- */}
      <Showcase entries={entries} marqueeItems={CLIENTS} />

      {/* ---- About (paper, server) — alternates off the rose works field -- */}
      <Section id="about" tone="paper">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* portrait — 4:5 (assets/portrait/viktoria-portrait.jpg) */}
          <Image
            src="/portrait/viktoria-1200.webp"
            alt="Viktoria Martjanova"
            width={1080}
            height={1350}
            sizes="(min-width: 1024px) 22rem, 100vw"
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAACQBACdASoUABkAPu1ur1KppiQnqAgBMB2JZQAAKtrjzmm0PyhrPZ4sht0hvgQA209LLkv35N0H25gpFOpYUhUfoZvMUq7n5pXRuC3Iauvqj//NRYRpHe7gQnAhZM03jE3HPIkh7dAJ1XQr7xByfCM6HuJ3tQvX93CO1P7csc3AAAAA"
            className="h-auto w-full self-start rounded-[--radius-sm] object-cover"
          />

          <div>
            <Eyebrow as="h2" className="mb-6">
              ABOUT
            </Eyebrow>
            <Body className="max-w-[46ch] uppercase tracking-[--tracking-wide]">
              Viktoria Martjanova is a Tallinn-based art department artist
              working across film and advertising. With over a decade on set, her
              work spans costume and wardrobe, set design, props and production
              design — shaping the look of a scene from first concept to the
              finished set. She also writes and stages her own productions,
              treating every project, commercial or personal, as a complete
              visual world.
            </Body>
          </div>
        </div>
      </Section>

      {/* ---- Contact (rose gradient, server) ----------------------------- */}
      <Section id="contact" tone="rose-gradient">
        <Eyebrow className="mb-8">CONTACT</Eyebrow>
        <Heading level={1} className="max-w-[16ch]">
          Let&apos;s build the next scene.
        </Heading>

        <dl className="mt-12 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2 lg:max-w-3xl">
          {[
            {
              k: "EMAIL",
              v: "martjanovaviktoria@gmail.com",
              href: "mailto:martjanovaviktoria@gmail.com",
            },
            {
              k: "INSTAGRAM",
              v: "@fake.versace.v",
              href: "https://instagram.com/fake.versace.v",
            },
            {
              k: "IMDB",
              v: "imdb.com/name/nm11979739",
              href: "https://www.imdb.com/name/nm11979739/",
            },
          ].map((row) => (
            <div
              key={row.k}
              className="flex items-baseline justify-between gap-6 border-b border-[--color-line-rose] pb-3"
            >
              <dt className="label-eyebrow">{row.k}</dt>
              <dd className="font-serif text-[length:--text-sm] tracking-[--tracking-wide] text-[--color-maroon]">
                {row.href ? (
                  <a
                    href={row.href}
                    target={row.href.startsWith("http") ? "_blank" : undefined}
                    rel={row.href.startsWith("http") ? "noreferrer" : undefined}
                    className="link-editorial lowercase"
                  >
                    {row.v}
                  </a>
                ) : (
                  <span className="uppercase text-[--color-maroon-muted]">
                    {row.v}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wide] text-[--color-maroon-muted]">
          © 2026 Viktoria Martjanova
        </p>
      </Section>
    </main>
  );
}
