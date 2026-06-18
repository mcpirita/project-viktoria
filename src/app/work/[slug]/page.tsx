import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  Body,
  Container,
  Display,
  Eyebrow,
  Hairline,
  Section,
  WorkCaption,
} from "@/components/ui";
import VideoEmbed from "@/components/VideoEmbed";
import { getWork, getWorks } from "@/lib/works";
import { CATEGORY_LABELS } from "@/components/site/categories";
import { firstRenderable } from "@/components/site/image";
import { ProjectGallery } from "@/components/site/ProjectGallery";

/**
 * Project card (Phase F). Statically generated for every work via
 * `generateStaticParams`. `params` is async (Next 16). Composes: header bar back
 * to index → title + caption → optional VideoEmbed (G) → ProjectGallery with the
 * Final↔Process toggle (view-transition). Robust to missing frames (placeholder).
 */

export async function generateStaticParams() {
  const works = await getWorks();
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return { title: "Work — Viktoria Martjanova" };
  const name = [work.client, work.title].filter(Boolean).join(" — ");
  return {
    title: `${name} — Viktoria Martjanova`,
    description: `${work.client}${work.title ? `, ${work.title}` : ""} — art department by Viktoria Martjanova.`,
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();

  // Poster for the video: Victoria's own first frame, if we have a resolved one.
  const poster = firstRenderable(slug, work.final.length ? work.final : work.process);

  // Crew credits — only the rows Victoria actually provided render.
  const credits: { label: string; value: string }[] = [
    { label: "Role", value: work.role },
    { label: "Director", value: work.credits.director ?? "" },
    { label: "DOP", value: work.credits.dop ?? "" },
    { label: "Production Design", value: work.credits.productionDesigner ?? "" },
    { label: "Agency", value: work.credits.agency ?? "" },
    { label: "Starring", value: work.credits.starring ?? "" },
    { label: "Production", value: work.production },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <main id="top">
      {/* ---- Slim header bar — back to index ----------------------------- */}
      <div className="sticky top-0 z-30 bg-[--color-paper]/90 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between md:h-16">
          <Link
            href="/#works"
            className="inline-flex min-h-[--spacing-touch] items-center font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wider] text-[--color-maroon] link-editorial"
          >
            ← Index
          </Link>
          <span className="font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wider] text-[--color-maroon-deep]">
            Viktoria Martjanova
          </span>
        </Container>
        <Hairline tone="ink" />
      </div>

      {/* ---- Title block ------------------------------------------------- */}
      <Section tone="paper" className="pb-[clamp(2rem,5vw,4rem)]">
        <Eyebrow className="mb-5">{CATEGORY_LABELS[work.category]}</Eyebrow>
        <Display>{work.title || work.client}</Display>
        <div className="mt-6">
          <WorkCaption
            client={work.client.toUpperCase()}
            title={work.title ? work.title.toUpperCase() : undefined}
            production={
              work.production ? work.production.toUpperCase() : undefined
            }
            className="text-[length:--text-sm]"
          />
        </div>

        {/* ---- Crew credits (Phase H) ----------------------------------- */}
        {credits.length > 0 && (
          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
            {credits.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-6 border-b border-[--color-line-rose] pb-2.5"
              >
                <dt className="label-eyebrow">{row.label}</dt>
                <dd className="text-right font-serif text-[length:--text-sm] tracking-[--tracking-wide] text-[--color-maroon]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      {/* ---- Video (if any) ---------------------------------------------- */}
      {work.video && (
        <Container className="mb-[clamp(2rem,5vw,4rem)]">
          <VideoEmbed
            src={work.video}
            title={work.title || work.client}
            poster={poster?.src}
            blurDataURL={poster?.blurDataURL}
            aspectRatio={poster?.aspectRatio ?? 16 / 9}
            sizes="(min-width: 1024px) 75vw, 100vw"
            className="rounded-[--radius-sm]"
          />
        </Container>
      )}

      {/* ---- Gallery: grid + Final↔Process toggle ------------------------ */}
      <Section tone="paper" className="pt-0">
        <ProjectGallery
          slug={slug}
          title={work.title || work.client}
          final={work.final}
          process={work.process}
        />
      </Section>

      {/* ---- Footer nav -------------------------------------------------- */}
      <Section tone="rose" className="py-[clamp(2.5rem,6vw,5rem)]">
        <Body className="uppercase tracking-[--tracking-wide]">
          <Link href="/#works" className="link-editorial">
            ← Back to all works
          </Link>
        </Body>
      </Section>
    </main>
  );
}
