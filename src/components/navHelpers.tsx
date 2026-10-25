"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";

/** The site's top-level sections: tabs on wide screens, the bottom bar on phones. */
export const SECTIONS = [
  { href: "/", label: "This Week", matches: ["/"] },
  { href: "/start-sit", label: "Lineup", matches: ["/start-sit", "/playoffs"] },
  { href: "/waivers", label: "Waivers & Trades", matches: ["/waivers", "/trades", "/trade-value"] },
  { href: "/roster", label: "Season", matches: ["/roster", "/league", "/history", "/scorecard"] },
  { href: "/players", label: "Player Lookup", matches: ["/players", "/rankings", "/compare", "/news"] },
  { href: "/ask", label: "Data Search", matches: ["/ask"] },
  { href: "/leafs", label: "Leafs", matches: ["/leafs"] },
  { href: "/logic", label: "How it works", matches: ["/logic"] },
];

export const isActive = (pathname: string, matches: string[]) =>
  matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));

/** Keep the current tab visible in a sideways-scrolling tab row (on a phone the active
 *  section was often off screen). */
export function useActiveIntoView(pathname: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    const el = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !el) return;
    nav.scrollLeft = el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2;
  }, [pathname]);
  return ref;
}

/** Inside a <Link>: a dot that pulses while that navigation is pending. */
export function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="link-pending" /> : null;
}
