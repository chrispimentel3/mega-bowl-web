import { fetchRemoteJson } from "./fetchRemoteJson";

export type WoprRow = {
  name: string;
  pos: string;
  team_2026_nfl: string;
  wopr_anchored: number;
  wopr_posrank: number | null;
  board_posrank: number | null;
  rank_delta: number | null;
  ppg_minus_xppg: number | null;
  tags: string;
  owner?: string;
};

export type Wopr = {
  available: boolean;
  meta: {
    ownership_source?: string;
    base_season?: number;
    percentiles?: Record<string, { p50: number; p75: number; p90: number }>;
  };
  mine: WoprRow[];
  opp: WoprRow[];
  fa: WoprRow[];
  unknown: { name: string; pos: string; tags: string }[];
  full_csv_name: string;
};

const REMOTE_URL = process.env.WOPR_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getWopr(): Promise<Wopr> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "WOPR_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "wopr.json");
  const samplePath = path.join(process.cwd(), "src", "data", "wopr.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
