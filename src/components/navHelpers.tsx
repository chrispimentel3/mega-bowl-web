"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";

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
