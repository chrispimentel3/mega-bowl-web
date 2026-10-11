"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SECTIONS, isActive, Pending } from "./navHelpers";

/** Phones only: the four sections used every week, plus More for the rest. */
const BAR: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/", label: "This Week", icon: <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { href: "/start-sit", label: "Lineup", icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16M12 4v16" /></> },
  { href: "/waivers", label: "Moves", icon: <path d="M7 7h13l-3-3M17 17H4l3 3" /> },
  { href: "/roster", label: "Season", icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
];
const MORE = SECTIONS.filter((s) => !BAR.some((b) => b.href === s.href));

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export function BottomTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panel = useRef<HTMLDivElement>(null);
  const moreActive = MORE.some((s) => isActive(pathname, s.matches));
  // navigating anywhere closes the More panel
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const tab = (active: boolean) =>
    `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
      active ? "text-navy" : "text-muted"
    }`;

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}
      <div
        ref={panel}
        data-state={open ? "open" : "closed"}
        className="more-panel fixed right-3 z-40 w-56 rounded-2xl border border-line bg-card/90 p-1.5 shadow-xl backdrop-blur-xl sm:hidden"
      >
        {MORE.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            tabIndex={open ? 0 : -1}
            aria-current={isActive(pathname, s.matches) ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${
              isActive(pathname, s.matches) ? "bg-navy/10 text-navy" : "text-ink hover:bg-ink/5"
            }`}
          >
            {s.label}
            <Pending />
          </Link>
        ))}
      </div>
      <nav
        aria-label="Sections"
        className="tabbar fixed inset-x-0 bottom-0 z-40 flex bg-background/80 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 sm:hidden"
      >
        {BAR.map((b) => {
          const s = SECTIONS.find((x) => x.href === b.href)!;
          const active = isActive(pathname, s.matches);
          return (
            <Link key={b.href} href={b.href} aria-current={active ? "page" : undefined} className={tab(active)}>
              <Icon>{b.icon}</Icon>
              <span>
                {b.label}
                <Pending />
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={open}
          aria-label="More sections"
          onClick={() => {
            setOpen((o) => !o);
            setOpenedAt(pathname);
          }}
          className={tab(moreActive || open)}
        >
          <Icon>
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="19" cy="12" r="1.2" />
          </Icon>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
