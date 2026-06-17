/**
 * Clients marquee — a horizontal running strip (CSS-only animation, defined in
 * globals.css as `.marquee`). Server component: no interactivity, just two
 * duplicated tracks scrolling left so the loop is seamless. Pauses on hover and
 * respects prefers-reduced-motion (handled in CSS).
 *
 * Label `CLIENTS:` and brand list per content/copy-en.md §5.
 */
export function Marquee({
  items,
  label = "CLIENTS:",
}: {
  items: string[];
  label?: string;
}) {
  // Render the track twice for a gap-free infinite loop.
  const track = (
    <ul className="marquee__track" aria-hidden>
      {items.map((it, i) => (
        <li key={`${it}-${i}`} className="marquee__item">
          <span className="work-caption__client">{it}</span>
          <span className="marquee__dot">·</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex items-center gap-4 overflow-hidden">
      <span className="label-eyebrow shrink-0 text-[--color-maroon-soft]">
        {label}
      </span>
      <div className="marquee relative min-w-0 flex-1">
        {track}
        {track}
      </div>
    </div>
  );
}
