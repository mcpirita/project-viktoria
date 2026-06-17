import type { Metadata } from "next";
import {
  Body,
  Button,
  Caption,
  Container,
  Display,
  Eyebrow,
  Hairline,
  Heading,
  MicroLabel,
  Section,
  WorkCaption,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Style Guide — Victoria Martyanova",
  robots: { index: false, follow: false },
};

/* Phase D style guide — NOT the live site. A visual reference for Dmitry to
 * approve the first screen + works block. Phase F builds the real showcase. */

const SWATCHES: { name: string; token: string; hex: string; ink?: boolean }[] =
  [
    { name: "Paper", token: "--color-paper", hex: "#fbf7f4" },
    { name: "Paper deep", token: "--color-paper-deep", hex: "#f6efe9" },
    { name: "Rose", token: "--color-rose", hex: "#f3d9d2" },
    { name: "Rose soft", token: "--color-rose-soft", hex: "#f7e4df" },
    { name: "Rose deep", token: "--color-rose-deep", hex: "#e9c2bb" },
    { name: "Maroon", token: "--color-maroon", hex: "#5c1d24", ink: true },
    {
      name: "Maroon deep",
      token: "--color-maroon-deep",
      hex: "#421217",
      ink: true,
    },
    {
      name: "Maroon soft",
      token: "--color-maroon-soft",
      hex: "#804049",
      ink: true,
    },
    {
      name: "Maroon muted",
      token: "--color-maroon-muted",
      hex: "#9c6970",
      ink: true,
    },
    { name: "Line", token: "--color-line", hex: "#e3d3cb" },
    { name: "Line rose", token: "--color-line-rose", hex: "#e0b9b1" },
  ];

const SCALE: { name: string; cls: string; note: string }[] = [
  { name: "hero", cls: "text-[length:--text-hero]", note: "clamp → 7.5rem max" },
  { name: "3xl", cls: "text-[length:--text-3xl]", note: "display" },
  { name: "2xl", cls: "text-[length:--text-2xl]", note: "section title" },
  { name: "xl", cls: "text-[length:--text-xl]", note: "sub-heading" },
  { name: "base", cls: "text-[length:--text-base]", note: "body floor 16px" },
  { name: "xs", cls: "text-[length:--text-xs]", note: "caption" },
];

const TRACKING: { name: string; token: string }[] = [
  { name: "wide", token: "--tracking-wide" },
  { name: "wider", token: "--tracking-wider" },
  { name: "widest", token: "--tracking-widest" },
];

const SAMPLE_WORKS = [
  { client: "JAMESON × HIGHSNOBIETY", title: "AROMA", production: "PRODUCTION" },
  { client: "TELE2", title: "#SCREENFREEHOLIDAYS", production: "PRODUCTION" },
  { client: "TOMMY CASH", title: "EUROVISION", production: "PRODUCTION" },
  { client: "ADIDAS", production: "PRODUCTION" },
];

function GuideHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <Eyebrow as="h2">{children}</Eyebrow>
      <Hairline className="mt-3" />
    </div>
  );
}

export default function StyleGuide() {
  return (
    <main>
      {/* ---- Hero sample (first-screen approval) ------------------------- */}
      <Section tone="paper" className="min-h-[80vh] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <MicroLabel>STYLE GUIDE — PHASE D</MicroLabel>
          <MicroLabel>13:36:08</MicroLabel>
        </div>
        <div className="mt-[clamp(2rem,8vh,5rem)]">
          <Eyebrow className="mb-5">PORTFOLIO — ART DEPARTMENT</Eyebrow>
          <Display>
            Victoria
            <br />
            Martyanova
          </Display>
          <p className="mt-6 max-w-[34ch] font-serif text-[length:--text-lg] uppercase tracking-[--tracking-wide] text-[--color-maroon-soft]">
            Art department for film &amp; advertising
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="#works">Selected Works</Button>
            <Button href="#contact" variant="text">
              Contact
            </Button>
          </div>
        </div>
      </Section>

      {/* ---- Works block sample (rose field) ----------------------------- */}
      <Section id="works" tone="rose">
        <Eyebrow className="mb-8 text-[--color-maroon-soft]">
          SELECTED WORKS:
        </Eyebrow>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_WORKS.map((w, i) => (
            <figure key={w.client + i}>
              {/* explicit aspect ratio = anti-CLS placeholder for stills */}
              <div
                className="w-full overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep]"
                style={{ aspectRatio: i === 0 ? "4 / 3" : "3 / 4" }}
                aria-hidden
              >
                <div className="flex h-full w-full items-center justify-center">
                  <MicroLabel className="text-[--color-maroon-muted]">
                    STILL {i + 1}
                  </MicroLabel>
                </div>
              </div>
              <figcaption className="mt-3">
                <WorkCaption
                  client={w.client}
                  title={w.title}
                  production={w.production}
                />
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---- Palette ----------------------------------------------------- */}
      <Section tone="paper">
        <GuideHeading>Palette</GuideHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.token}>
              <div
                className="aspect-[4/3] w-full rounded-[--radius-sm] border border-[--color-line]"
                style={{ backgroundColor: `var(${s.token})` }}
              />
              <p className="mt-2 font-serif text-[length:--text-sm] text-[--color-maroon-deep]">
                {s.name}
              </p>
              <Caption className="font-mono normal-case tracking-normal">
                {s.hex}
              </Caption>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Type scale -------------------------------------------------- */}
      <Section tone="paper">
        <GuideHeading>Type scale — Fraunces serif</GuideHeading>
        <div className="space-y-6">
          {SCALE.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-1 border-b border-[--color-line] pb-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <span
                className={`${t.cls} font-serif uppercase tracking-[--tracking-tight] text-[--color-maroon-deep] leading-none`}
              >
                Aa Editorial
              </span>
              <Caption className="shrink-0 normal-case tracking-normal text-[--color-maroon-muted]">
                {t.name} · {t.note}
              </Caption>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Tracking & labels ------------------------------------------ */}
      <Section tone="paper">
        <GuideHeading>Tracking &amp; labels</GuideHeading>
        <div className="space-y-6">
          {TRACKING.map((t) => (
            <p
              key={t.name}
              className="font-serif text-[length:--text-base] uppercase text-[--color-maroon]"
              style={{ letterSpacing: `var(${t.token})` }}
            >
              Selected works — {t.name}
            </p>
          ))}
          <div className="space-y-3 pt-2">
            <Eyebrow>Eyebrow — CLIENTS:</Eyebrow>
            <MicroLabel as="p">Micro label — 13:36:08</MicroLabel>
          </div>
        </div>
      </Section>

      {/* ---- Components: hairline, caption, buttons, bio ----------------- */}
      <Section tone="paper">
        <GuideHeading>Primitives</GuideHeading>

        <div className="space-y-12">
          <div>
            <Caption className="mb-3 text-[--color-maroon-muted]">
              Hairline (paper · rose · ink)
            </Caption>
            <Hairline />
            <div className="my-4 bg-[--color-rose] p-4">
              <Hairline tone="rose" />
            </div>
            <Hairline tone="ink" />
          </div>

          <div>
            <Caption className="mb-3 text-[--color-maroon-muted]">
              Work caption — CLIENT, TITLE, PRODUCTION
            </Caption>
            <div className="space-y-2">
              <WorkCaption
                client="JAMESON × HIGHSNOBIETY"
                title="AROMA"
                production="STINK FILMS"
              />
              <WorkCaption client="ADIDAS" production="PRODUCTION" />
              <WorkCaption client="BMW" />
            </div>
          </div>

          <div>
            <Caption className="mb-3 text-[--color-maroon-muted]">
              Buttons (≥44px tap target)
            </Caption>
            <div className="flex flex-wrap items-center gap-4">
              <Button href="#contact">Contact</Button>
              <Button href="#" variant="text">
                Email
              </Button>
            </div>
          </div>

          <div>
            <Caption className="mb-3 text-[--color-maroon-muted]">
              Bio (prose measure)
            </Caption>
            <Container width="prose" className="px-0">
              <Body className="uppercase tracking-[--tracking-wide]">
                Victoria Martyanova is an art department artist working across
                film and advertising. She moves between costume and wardrobe,
                set design, props and production design, shaping the look of a
                scene from concept to set.
              </Body>
            </Container>
          </div>
        </div>
      </Section>

      {/* ---- Contact field (rose gradient) ------------------------------ */}
      <Section id="contact" tone="rose-gradient">
        <Eyebrow className="mb-8">CONTACT</Eyebrow>
        <Heading level={1} className="max-w-[16ch]">
          Let&apos;s build the next scene.
        </Heading>
        <div className="mt-8">
          <Button href="mailto:hello@example.com">Email</Button>
        </div>
      </Section>
    </main>
  );
}
