"use client";

import { useEffect, useId, useRef, useState } from "react";

/** A tag with its explanation behind it: hover shows the browser tooltip, and a tap or click
 *  (or Enter) opens the same words in a small panel — phones can't hover. Tap outside or
 *  press Escape to close. A tag with nothing to explain renders plain. */
export function TapTip({
  tip, className = "", children,
}: {
  tip: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // where the panel sits relative to its tag, so it never runs off either side of a phone screen
  const [shift, setShift] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!tip) return <span className={className}>{children}</span>;
  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        title={tip}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const w = Math.min(224, window.innerWidth * 0.7);
          const left = Math.max(8, Math.min(r.left, window.innerWidth - 8 - w));
          setShift(left - r.left);
          setOpen((o) => !o);
        }}
        className={`cursor-help text-left ${className}`}
      >
        {children}
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          style={{ left: shift }}
          className={`absolute top-full z-30 mt-1 w-56 max-w-[70vw] rounded-lg border border-line bg-card p-2 text-xs font-normal normal-case leading-snug text-ink shadow-lg`}
        >
          {tip}
        </span>
      ) : null}
    </span>
  );
}
