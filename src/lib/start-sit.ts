import { fetchRemoteJson } from "./fetchRemoteJson";

export type LineupRow = {
  lineup: string;
  player: string;
  pos: string;
  nfl_team: string | null;
  report_status: string | null;
  opp: string | null;
  ease_rank: number | null;
  proj: number | null;
  proj_adj: number | null;
  proj_source: string | null;
  vegas: number | null;
  vegas_edge: number | null;
  tgt_pct: number | null;
  tm_rank: number | null;
  start_sit: string | null;
  close_call: string | null;
};

export type StartSit = {
  available: boolean;
  headline: string;
  subhead: string;
  kpis: {
    proj_total: number;
    close_calls: number;
    fp_backed: number;
    starters_n: number;
  } | null;
  starters: LineupRow[];
  bench: LineupRow[];
  next_week: number;
};

const REMOTE_URL = process.env.START_SIT_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getStartSit(): Promise<StartSit> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "START_SIT_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "start_sit.json");
  const samplePath = path.join(process.cwd(), "src", "data", "start-sit.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
