"use client";

import { useEffect, useState } from "react";

/** The sticky header, marked `data-compact` once the page is scrolled (globals.css shrinks
 *  the title). Hysteresis — compact past 48px, full again under 8px — so the few pixels the
 *  header gives back can't flip it back and forth at the threshold. */
export function MastheadShell({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setCompact((c) => (c ? window.scrollY > 8 : window.scrollY > 48)),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <header
      data-compact={compact ? "" : undefined}
      className="masthead sticky top-0 z-10 bg-background/80 backdrop-blur-xl backdrop-saturate-150"
    >
      {children}
    </header>
  );
}
