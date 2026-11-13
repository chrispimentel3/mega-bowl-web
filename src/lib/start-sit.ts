import { fetchRemoteJson } from "./fetchRemoteJson";
import type { ModelRead, ModelWhy } from "@/components/ModelCall";

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
  /** the consensus projection beside ours ("ours" in proj_source) — absent on an older export */
  consensus?: number | null;
  vegas: number | null;
  vegas_edge: number | null;
  tgt_pct: number | null;
  tm_rank: number | null;
  start_sit: string | null;
  close_call: string | null;
  /** the fitted matchup model: % on a normal week, worth in points, and its two parts —
   *  absent on an older export */
  matchup_pct?: number | null;
  matchup_pts?: number | null;
  matchup_def_rank?: number | null;
  matchup_vegas_pct?: number | null;
  matchup_basis?: "defense+vegas" | "defense+market" | "defense_only" | null;
  /** our matchup model (ff-dashboard mega/ml_matchup.py): its projection, his average going in,
   *  this week against his usual in points, the call and its reasons — absent on an older
   *  export, null for a player it doesn't score (fewer than 3 games this season, K, DEF) */
  ml_proj?: number | null;
  ml_avg?: number | null;
  ml_week?: number | null;
  ml_call?: ModelRead["call"] | null;
  ml_why?: ModelWhy[] | null;
};

/** A lineup row's model fields as one read, or null when the model didn't score him. */
export function modelRead(r: LineupRow): ModelRead | null {
  return r.ml_proj != null && r.ml_week != null && r.ml_call
    ? { proj: r.ml_proj, week: r.ml_week, call: r.ml_call, avg: r.ml_avg, why: r.ml_why ?? [] }
    : null;
}

/** One reason in a close call, in points; positive favours the starter (they add up to `gap`). */
export type CallReason = { factor: string; label: string; pts: number };

/** A close call (ff-dashboard mega/live_calib.call): the chance `start` outscores `sit`. */
export type Call = {
  start: string;
  sit: string;
  p: number;
  verdict: "coin flip" | "lean" | "clear";
  gap: number;
  why: CallReason[];
  context: string[];
};

export type StartSit = {
  /** close calls, clearest first — absent on an older export */
  calls?: Call[];
  available: boolean;
  headline: string;
  subhead: string;
  kpis: {
    proj_total: number;
    close_calls: number;
    /** our starters the consensus projection would bench — absent on an older export */
    differs?: string[];
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
