import {
  Body,
  Button,
  Eyebrow,
  Heading,
  MicroLabel,
  Section,
} from "@/components/ui";
import { getWorks, getCategories } from "@/lib/works";
import { firstRenderable } from "@/components/site/image";
import { Showcase } from "@/components/site/Showcase";
import { Marquee } from "@/components/site/Marquee";
import { LiveClock } from "@/components/site/LiveClock";
import type { IndexEntry } from "@/components/site/types";

/**
 * Live home page (Phase F). Server component: pulls works + categories from the
 * data layer (B), resolves each row's preview frame once (C manifest), and hands
 * a lean `IndexEntry[]` to the `Showcase` client island (sticky header filters +
 * index list with hover/tap preview). Hero, marquee, about and contact stay
 * server-rendered around the island.
 *
 * Copy comes from content/copy-en.md; missing facts (production, city, contacts)
 * render as honest placeholders for Phase H.
 */

// Confirmed brands for the clients marquee (copy-en.md §5).
const CLIENTS = [
  "ADIDAS",
  "BMW",
  "BOLT",
  "DELTA",
  "JAMESON",
  "HIGHSNOBIETY",
  "LASCANA",
  "TELE2",
  "TOMMY CASH",
  "VICTORINOX",
];

export default async function Home() {
  const [works, categories] = await Promise.all([
    getWorks(),
    getCategories(),
  ]);

  const entries: IndexEntry[] = works.map((w) => ({
    slug: w.slug,
    client: w.client.toUpperCase(),
    title: w.title ? w.title.toUpperCase() : undefined,
    production: w.production ? w.production.toUpperCase() : undefined,
    category: w.category,
    preview: firstRenderable(w.slug, w.final.length ? w.final : w.process),
  }));

  return (
    <main id="top">
      {/* ---- Hero (server) ----------------------------------------------- */}
      <Section
        tone="paper"
        className="flex min-h-[88vh] flex-col justify-center"
      >
        <div className="flex items-center justify-between">
          <MicroLabel>PORTFOLIO — ART DEPARTMENT</MicroLabel>
          <LiveClock />
        </div>

        <div className="mt-[clamp(2.5rem,10vh,6rem)]">
          <Eyebrow className="mb-5">VICTORIA MARTYANOVA</Eyebrow>
          <h1 className="font-serif text-[length:--text-hero] font-light uppercase leading-[--text-hero--line-height] tracking-[--tracking-tightest] text-[--color-maroon-deep]">
            <span className="block">Costume,</span>
            <span className="block">Set &amp; Props,</span>
            <span className="block text-[--color-maroon-soft]">
              Production Design
            </span>
          </h1>
          <p className="mt-7 max-w-[40ch] font-serif text-[length:--text-lg] uppercase tracking-[--tracking-wide] text-[--color-maroon-soft]">
            Art department for film &amp; advertising
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="#works">Selected Works</Button>
            <Button href="#contact" variant="text">
              Contact
            </Button>
          </div>
        </div>

        <div className="mt-[clamp(2.5rem,8vh,5rem)]">
          <Marquee items={CLIENTS} />
        </div>
      </Section>

      {/* ---- Sticky header + index list (client island) ------------------ */}
      <Showcase entries={entries} categories={categories} />

      {/* ---- About (rose field, server) ---------------------------------- */}
      <Section id="about" tone="rose">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* portrait placeholder — assets/portrait/ empty, Phase H fills it */}
          <div
            className="relative w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]"
            style={{ aspectRatio: "4 / 5" }}
            aria-hidden
          >
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0 12px, rgba(92,29,36,0.06) 12px 13px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="label-micro text-[--color-maroon-muted]">
                PORTRAIT
              </span>
            </div>
          </div>

          <div>
            <Eyebrow as="h2" className="mb-6">
              ABOUT
            </Eyebrow>
            <Body className="max-w-[46ch] uppercase tracking-[--tracking-wide]">
              Victoria Martyanova is a{" "}
              <span className="text-[--color-maroon-muted]">
                [city — TBC]
              </span>{" "}
              art department artist working across film and advertising. Her work
              spans costume and wardrobe, set design, props and production design
              — shaping the look of a scene from first concept to the finished
              set. She also writes and stages her own productions, treating every
              project, commercial or personal, as a complete visual world.
            </Body>
            <div className="mt-10">
              <Marquee items={CLIENTS} label="SELECTED CLIENTS:" />
            </div>
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
            { k: "EMAIL", v: "[email — TBC]" },
            { k: "AGENCY", v: "[agency — TBC]" },
            { k: "INSTAGRAM", v: "[@handle — TBC]" },
            { k: "IMDB", v: "[profile — TBC]" },
          ].map((row) => (
            <div
              key={row.k}
              className="flex items-baseline justify-between gap-6 border-b border-[--color-line-rose] pb-3"
            >
              <dt className="label-eyebrow">{row.k}</dt>
              <dd className="font-serif text-[length:--text-sm] uppercase tracking-[--tracking-wide] text-[--color-maroon-muted]">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wide] text-[--color-maroon-muted]">
          © 2026 Victoria Martyanova
        </p>
      </Section>
    </main>
  );
}
