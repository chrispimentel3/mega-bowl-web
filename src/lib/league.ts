import { fetchRemoteJson } from "./fetchRemoteJson";

export type OddsRow = {
  team: string;
  p_playoffs: number;
  p_bye: number;
  p_title: number;
  mean_seed: number;
};

export type StandingsRow = {
  rank: number;
  team: string;
  manager: string | null;
  wins: number;
  losses: number;
  ties: number;
  points_for?: number;
  points_against?: number;
  streak?: string;
  faab_balance?: number;
  moves?: number;
  trades?: number;
};

export type XwinsRow = {
  power_rank: number;
  team: string;
  xwins: number;
  power: number;
  wins: number;
  luck_w: number;
  pf: number;
  ppg: number;
  cv: number;
};

export type RosterStrengthRow = {
  power_rank: number;
  team: string;
  starters_pg: number;
  bench_pg: number;
  rank: number;
  luck: number;
  matched: number;
};

export type WeeklyResultRow = {
  team: string;
  opponent: string;
  points: number;
  opp_points: number | null;
  proj?: number;
  result?: string;
  week: number;
};

export type League = {
  my_team: string;
  playoff_odds: OddsRow[];
  standings: { available: boolean; source: string | null; rows: StandingsRow[] };
  power_xwins: { available: boolean; through_week: number | null; rows: XwinsRow[] };
  power_roster_strength: RosterStrengthRow[];
  transactions: Record<string, unknown>[];
  weekly_results: { available: boolean; source: string | null; rows: WeeklyResultRow[] };
};

const REMOTE_URL = process.env.LEAGUE_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getLeague(): Promise<League> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "LEAGUE_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "league.json");
  const samplePath = path.join(process.cwd(), "src", "data", "league.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
