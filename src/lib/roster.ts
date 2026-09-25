import { fetchRemoteJson } from "./fetchRemoteJson";

export type RosterRow = {
  slot: string;
  player: string;
  pos: string;
  games: number;
  half_ppr_pg: number;
  roll_pg: number;
  last_wk: number | null;
  xfp_tot: number | null;
  xfp_diff: number | null;
  tgt_pg: number | null;
  tgt_pct: number | null;
  tm_rank: number | null;
  carry_pg: number | null;
  report_status: string | null;
  opp: string | null;
  implied: number | null;
};

export type Roster = {
  available: boolean;
  headline: string;
  subhead: string;
  kpis: {
    roll: number;
    starters_proj: number;
    roster_act_minus_xfp: number | null;
    top_starter: string | null;
    top_starter_ppg: number | null;
    coldest_starter: string | null;
    coldest_starter_ppg: number | null;
    injury_flags: number;
  } | null;
  roster: RosterRow[];
};

const REMOTE_URL = process.env.ROSTER_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getRoster(): Promise<Roster> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "ROSTER_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "roster.json");
  const samplePath = path.join(process.cwd(), "src", "data", "roster.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
