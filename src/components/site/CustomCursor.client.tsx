"use client";

/**
 * On-brand custom cursor (desktop only).
 *
 * A small filled maroon dot tracks the pointer 1:1, while a larger hollow ring
 * trails behind with eased smoothing — the classic editorial-portfolio cursor.
 * Over interactive elements (links, buttons, work tiles) the ring grows and the
 * dot fades, signalling "clickable" in the site's own palette.
 *
 * Guards:
 *  - Renders nothing on touch / coarse-pointer devices (no cursor to style).
 *  - Honours `prefers-reduced-motion`: drops the trailing animation (the ring
 *    snaps to the pointer instead of easing) so it never adds motion.
 *  - Hides the native cursor only while this is active (see globals.css
 *    `.has-custom-cursor`), so non-JS / unsupported environments keep the OS
 *    cursor untouched.
 *
 * Pure transform animation on a fixed, pointer-events-none layer → cheap, no
 * layout cost, no interference with clicks.
 */

import { useEffect, useRef } from "react";

// Elements that should trigger the "grow" state when hovered.
const INTERACTIVE = "a, button, [role='button'], summary, label, input, textarea, select";

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only meaningful on devices with a fine pointer (mouse/trackpad).
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    // Mark the document so globals.css can hide the native cursor.
    document.documentElement.classList.add("has-custom-cursor");

    // Target = real pointer position; ring position eases toward it each frame.
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let visible = false;
    let raf = 0;

    const render = () => {
      // Ease the ring toward the target (reduced-motion → snap, no easing).
      const k = reduce ? 1 : 0.18;
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const grow = Boolean(target?.closest?.(INTERACTIVE));
      ring.classList.toggle("cursor-ring--grow", grow);
      dot.classList.toggle("cursor-dot--hidden", grow);
    };

    const onLeave = () => {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
      visible = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
