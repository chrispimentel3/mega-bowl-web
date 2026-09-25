"use client";

import { createContext, useContext } from "react";
import type { Headshots } from "@/lib/headshots";

const HeadshotsContext = createContext<Headshots>({});

export function HeadshotsProvider({ headshots, children }: { headshots: Headshots; children: React.ReactNode }) {
  return <HeadshotsContext.Provider value={headshots}>{children}</HeadshotsContext.Provider>;
}

export function useHeadshot(player: string | null | undefined): string | null {
  const headshots = useContext(HeadshotsContext);
  if (!player) return null;
  return headshots[player] ?? null;
}
