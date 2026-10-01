"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    links: [
      { href: "/", label: "What to do" },
      { href: "/digest", label: "Weekly digest" },
      { href: "/live", label: "Live scores" },
    ],
  },
  {
    links: [
      { href: "/start-sit", label: "Lineup" },
      { href: "/matchups", label: "Matchups" },
    ],
  },
  {
    links: [
      { href: "/waivers", label: "Waivers" },
      { href: "/trades", label: "Trades" },
      { href: "/wopr", label: "Receiving opportunity" },
      { href: "/archetypes", label: "Blueprint fit" },
    ],
  },
  {
    links: [
      { href: "/roster", label: "My roster" },
      { href: "/axe", label: "Points vs opportunity" },
      { href: "/usage", label: "Usage trends" },
      { href: "/league", label: "The league" },
    ],
  },
  {
    links: [
      { href: "/players", label: "Player card" },
      { href: "/rankings", label: "Rankings" },
      { href: "/compare", label: "Compare" },
      { href: "/glossary", label: "Glossary" },
      { href: "/news", label: "News" },
    ],
  },
  {
    links: [
      { href: "/ask", label: "Ask anything" },
      { href: "/downloads", label: "Downloads" },
    ],
  },
];

/** Second-level nav for pages that are sub-tabs of the same top-level Streamlit page. */
export function SubNav() {
  const pathname = usePathname();
  // "/" is a prefix of every path, so it only ever matches itself
  const on = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const group = GROUPS.find((g) => g.links.some((l) => on(l.href)));
  if (!group) return null;

  return (
    <nav className="mx-auto flex max-w-2xl gap-4 overflow-x-auto border-t border-line px-4 pt-2 sm:max-w-3xl">
      {group.links.map((link) => {
        const active = on(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors ${
              active ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
