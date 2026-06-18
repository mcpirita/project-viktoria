import Image from "next/image";
import { Marquee } from "@/components/site/Marquee";

// Confirmed brands for the clients marquee (copy-en.md §5).
const CLIENTS = [
  "ADIDAS", "BMW", "BOLT", "VOLKSWAGEN", "DELTA AIRLINES", "JÄGERMEISTER",
  "JAMESON", "HIGHSNOBIETY", "LASCANA", "TELE2", "TOMMY CASH", "VICTORINOX",
  "SOMAT", "EBAY", "BOSCH", "LG", "LIDL", "EDEKA", "MAISON MARGIELA",
  "NUTELLA", "TALLINK", "COCA-COLA", "RACER WORLDWIDE",
];

/**
 * MOCKUP ONLY — изолированная превью-страница (/preview/barbed).
 *
 * Не часть продакшн-сайта, не линкуется из навигации. Эксперимент: взять у
 * barbed только СКЕЛЕТ раскладки кейсов (метаданные слева, асимметрия справа,
 * много воздуха, sticky-подпись), но одеть его в НАШУ айдентику — тёплый paper,
 * maroon-ink, dusty-rose поля, serif Fraunces, КАПС-подписи с широким трекингом,
 * нумерация проектов и rose-хейрлайны. Цель — чтобы по цвету и шрифту макет НЕ
 * читался как клон присланных скриншотов.
 *
 * Стили на наших дизайн-токенах из globals.css (var(--color-…)). Год —
 * плейсхолдер: поля `year` в контент-модели пока нет (см. lib/schema.ts).
 */

type Shot = { src: string; ratio: string };
type Project = {
  client: string;
  collab?: string;
  line: string; // role / type
  year: string;
  video?: boolean;
  layout: "wide" | "duo" | "offset" | "trio";
  shots: Shot[];
};

const W = "/works";

const PROJECTS: Project[] = [
  {
    client: "BMW",
    collab: "Nafta × Stentang Film",
    line: "Production design · Commercial",
    year: "2025",
    video: true,
    layout: "wide",
    shots: [
      { src: `${W}/bmw-f74/low-quality-screenshot-2026-03-13-at-18-19-55-1200.webp`, ratio: "16/9" },
    ],
  },
  {
    client: "Adidas",
    collab: "Deichmann · Bubbles Film",
    line: "Production design · Campaign",
    year: "2025",
    video: true,
    layout: "duo",
    shots: [
      { src: `${W}/adidas/low-quality-screenshot-2026-03-13-at-17-29-28-1200.webp`, ratio: "4/5" },
      { src: `${W}/adidas/low-quality-screenshot-2026-03-13-at-17-42-36-1200.webp`, ratio: "4/5" },
    ],
  },
  {
    client: "Lascana",
    collab: "Swimwear",
    line: "Set design · Props",
    year: "2024",
    layout: "offset",
    shots: [
      { src: `${W}/lascana/low-quality-screenshot-2026-03-13-at-15-29-54-1200.webp`, ratio: "3/4" },
      { src: `${W}/lascana/low-quality-screenshot-2026-03-13-at-15-30-12-1200.webp`, ratio: "4/3" },
    ],
  },
  {
    client: "Tommy Cash",
    collab: "Eurovision",
    line: "Costume · Music video",
    year: "2025",
    video: true,
    layout: "wide",
    shots: [
      { src: `${W}/tommy-cash-eurovisioon/screenshot-2026-03-15-at-16-59-37-1200.webp`, ratio: "16/9" },
    ],
  },
  {
    client: "Victorinox",
    line: "Set design · Commercial",
    year: "2024",
    layout: "trio",
    shots: [
      { src: `${W}/victorinox/low-quality-screenshot-2026-03-13-at-16-46-44-1200.webp`, ratio: "1/1" },
      { src: `${W}/victorinox/low-quality-screenshot-2026-03-13-at-16-47-13-1200.webp`, ratio: "1/1" },
      { src: `${W}/victorinox/low-quality-screenshot-2026-03-13-at-16-46-44-2-1200.webp`, ratio: "1/1" },
    ],
  },
];

export default function BarbedPreview() {
  return (
    <div className="min-h-screen bg-[--color-paper] text-[--color-maroon]">
      {/* eyebrow announcement strip */}
      <div className="border-b border-[--color-line-ink] py-2 text-center">
        <span className="label-micro">Available for commissions — 2026</span>
      </div>

      {/* header — name + minimal nav, our serif caps voice */}
      <header className="sticky top-0 z-20 bg-[--color-paper]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[--container-site] items-center justify-between px-[--spacing-gutter] py-4 md:px-[--spacing-gutter-lg]">
          <span className="font-serif text-[length:--text-sm] uppercase tracking-[--tracking-wider] text-[--color-maroon-deep] sm:text-[length:--text-base]">
            Viktoria Martjanova
          </span>
          <nav className="flex items-center gap-6">
            {["Work", "About", "Contact"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="font-serif text-[length:--text-xs] uppercase tracking-[--tracking-wide] text-[--color-maroon-soft] transition-colors hover:text-[--color-maroon]"
              >
                {l}
              </a>
            ))}
          </nav>
        </div>
        <hr className="hairline hairline--ink" />
        {/* clients marquee — running strip, our signature device */}
        <div className="mx-auto w-full max-w-[--container-site] px-[--spacing-gutter] py-2 md:px-[--spacing-gutter-lg]">
          <Marquee items={CLIENTS} />
        </div>
        <hr className="hairline hairline--ink" />
      </header>

      {/* project flow — metadata left, imagery right, hairline-separated */}
      <main
        id="work"
        className="mx-auto max-w-[--container-site] px-[--spacing-gutter] pb-32 pt-14 md:px-[--spacing-gutter-lg]"
      >
        {PROJECTS.map((p, i) => (
          <ProjectRow key={i} p={p} index={i + 1} flip={i % 2 === 1} last={i === PROJECTS.length - 1} />
        ))}
      </main>

      {/* contact — rose field, breaks the paper rhythm */}
      <footer
        id="contact"
        className="bg-gradient-to-b from-[--color-rose-soft] to-[--color-rose-deep]"
      >
        <div className="mx-auto max-w-[--container-site] px-[--spacing-gutter] py-16 md:px-[--spacing-gutter-lg]">
          <span className="label-eyebrow">CONTACT</span>
          <h2 className="mt-6 max-w-[16ch] font-serif text-[length:--text-3xl] tracking-[--tracking-tightest] text-[--color-maroon-deep]">
            Let&apos;s build the next scene.
          </h2>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {["Email", "Instagram", "IMDb"].map((l) => (
              <a
                key={l}
                href="#"
                className="link-editorial font-serif text-[length:--text-sm] uppercase tracking-[--tracking-wide] text-[--color-maroon]"
              >
                {l}
              </a>
            ))}
          </div>
          <p className="mt-12 label-micro">© 2026 Viktoria Martjanova</p>
        </div>
      </footer>
    </div>
  );
}

function ProjectRow({
  p,
  index,
  flip,
  last,
}: {
  p: Project;
  index: number;
  flip: boolean;
  last: boolean;
}) {
  const caption = (
    <div className={`md:col-span-3 ${flip ? "md:order-last md:pl-8" : "md:pr-8"}`}>
      <div className="sticky top-28">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="label-micro text-[--color-maroon-muted]">
            {String(index).padStart(2, "0")}
          </span>
          <span className="h-px flex-1 bg-[--color-line-rose]" />
        </div>
        <h3 className="work-caption">
          <span className="work-caption__client">{p.client}</span>
          {p.collab ? (
            <span className="work-caption__production"> × {p.collab}</span>
          ) : null}
        </h3>
        <p className="work-caption work-caption__title mt-1">{p.line}</p>
        <p className="work-caption work-caption__production mt-1">
          {p.year}
          {p.video ? (
            <>
              {" · "}
              <a href="#" className="link-editorial text-[--color-maroon-soft]">
                VIDEO
              </a>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );

  return (
    <article
      className={`grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:gap-8 md:py-14 ${
        last ? "" : "border-b border-[--color-line]"
      }`}
    >
      {caption}
      {/* imagery capped + edge-aligned so photos stay compact, not full-bleed */}
      <div className={`md:col-span-8 ${flip ? "md:order-first" : ""}`}>
        <div className={`max-w-[680px] ${flip ? "" : "md:ml-auto"}`}>
          <ImageGroup p={p} />
        </div>
      </div>
    </article>
  );
}

function ImageGroup({ p }: { p: Project }) {
  const frame = (s: Shot, extra = "") => (
    <div
      className={`relative overflow-hidden rounded-[--radius-sm] bg-[--color-rose-deep] ${extra}`}
      style={{ aspectRatio: s.ratio.replace("/", " / ") }}
    >
      <Image
        src={s.src}
        alt={p.client}
        fill
        sizes="(min-width:768px) 60vw, 100vw"
        className="object-cover"
      />
    </div>
  );

  if (p.layout === "wide") return frame(p.shots[0]);

  if (p.layout === "duo")
    return (
      <div className="grid grid-cols-2 gap-6">
        {frame(p.shots[0])}
        {frame(p.shots[1], "mt-12")}
      </div>
    );

  if (p.layout === "offset")
    return (
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-12">
        <div className="sm:col-span-5">{frame(p.shots[0])}</div>
        <div className="sm:col-span-7 sm:mt-20">{frame(p.shots[1])}</div>
      </div>
    );

  // trio
  return (
    <div className="grid grid-cols-3 gap-6">
      {p.shots.map((s, i) => (
        <div key={i} className={i === 1 ? "mt-10" : ""}>
          {frame(s)}
        </div>
      ))}
    </div>
  );
}
