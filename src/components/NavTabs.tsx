"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "This Week", matches: ["/"] },
  { href: "/start-sit", label: "Lineup & Matchups", matches: ["/start-sit", "/matchups"] },
  {
    href: "/waivers",
    label: "Waivers & Trades",
    matches: ["/waivers", "/trades", "/wopr", "/archetypes"],
  },
  {
    href: "/roster",
    label: "Season",
    matches: ["/roster", "/axe", "/usage", "/league", "/draft"],
  },
  {
    href: "/players",
    label: "Player Lookup",
    matches: ["/players", "/glossary", "/news"],
  },
  {
    href: "/ask",
    label: "Data Search",
    matches: ["/ask", "/downloads"],
  },
  {
    href: "/logic",
    label: "Logic",
    matches: ["/logic"],
  },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-4 pb-2 sm:max-w-3xl">
      {LINKS.map((link) => {
        const active = link.matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-navy text-white" : "text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
