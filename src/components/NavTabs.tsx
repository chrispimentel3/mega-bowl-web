"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveIntoView, Pending, SECTIONS as LINKS } from "./navHelpers";



export function NavTabs() {
  const pathname = usePathname();
  const ref = useActiveIntoView(pathname);

  return (
    <nav ref={ref} className="scroll-fade relative mx-auto mt-2 hidden max-w-2xl gap-1 overflow-x-auto px-4 pb-2 pt-1 sm:flex sm:max-w-3xl">
      {LINKS.map((link) => {
        const active = link.matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`hit whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-navy text-white" : "text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {link.label}
            <Pending />
          </Link>
        );
      })}
    </nav>
  );
}
