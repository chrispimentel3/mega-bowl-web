import { fetchRemoteJson } from "./fetchRemoteJson";

export type RankingRow = {
  gsis_id: string;
  player: string;
  pos: string;
  team: string | null;
  rank: number;
  proj: number;
  proj_source: string;
  opponent: string | null;
  matchup_pct: number | null;
  matchup_basis: "defense+vegas" | "defense_only" | null;
  mine: boolean;
};

export type Rankings = {
  available: boolean;
  season: number;
  next_week: number;
  rows: RankingRow[];
};

const REMOTE_URL = process.env.RANKINGS_URL;

/** Same fetch-with-fallback pattern as every other export — see src/lib/action-board.ts.
 * Data comes from `mega/rankings_web.py`: every skill player ranked within his own
 * position by projected points for the coming week, league-wide (not roster-scoped). */
export async function getRankings(): Promise<Rankings> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "RANKINGS_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "rankings.json");
  const samplePath = path.join(process.cwd(), "src", "data", "rankings.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
