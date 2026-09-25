"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/start-sit", label: "Lineup" },
  { href: "/matchups", label: "Matchups" },
];

/** Second-level nav for pages that are sub-tabs of "Who do I start?" in the Streamlit app. */
export function SubNav() {
  const pathname = usePathname();
  if (!LINKS.some((l) => pathname.startsWith(l.href))) return null;

  return (
    <nav className="mx-auto flex max-w-2xl gap-4 border-t border-line px-4 pt-2 sm:max-w-3xl">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
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
