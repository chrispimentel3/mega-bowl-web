import { fetchRemoteJson } from "./fetchRemoteJson";

/** One free agent in a HANDOFF v1.3 lane (ff-dashboard mega/waiver_value.py). Every
 *  number is points per week across the rest of the season unless its name says
 *  otherwise; `next3` is the next three weeks only. */
export type WaiverLaneRow = {
  player: string;
  pos: string;
  nfl_team: string;
  ppg: number | null;
  lane: "bid_now" | "early_signal" | "stash";
  fit_pts: number;
  start: number;
  cover: number;
  insure: number;
  next3: number;
  mechanism: "START" | "COVER" | "INSURE" | "";
  handcuff: boolean;
  insures: string | null;
  drop: string | null;
  drop_cost: number | null;
  drop_insure: number | null;
  drop_flip: number | null;
  signal: string | null;
  p_expand: number | null;
  gain_if_expands: number | null;
  signal_score: number | null;
  pct_ros: number | null;
  market_on: boolean;
  flip: number | null;
  bid: number;
  max_bid: number;
  role: string | null;
  why: string;
  d_title?: number | null;
  se_title?: number | null;
  title_noise?: boolean | null;
  /** injured: already priced (his weeks before `out_back` count for nothing); this labels it */
  out_status?: string | null;
  out_back?: number | null;
};

export type WaiverChip = { player: string; pos: string; nfl_team: string; flip: number; flip_buyers: number };

export type WaiverBlindRow = Record<string, unknown> & { player: string; pos: string };

export type Waivers = {
  available: boolean;
  need_aware: boolean;
  headline: string;
  subhead: string;
  faab: { known: boolean; mine?: number; richer?: number; max_rival?: number; median_rival?: number; teams?: number } | null;
  market: { claims: number; median: number; max: number; contested: number; listed_spend: number; league_spend: number; unlisted_spend: number } | null;
  lanes: { bid_now: WaiverLaneRow[]; early_signal: WaiverLaneRow[]; stash: WaiverLaneRow[] };
  trade_chips: WaiverChip[];
  roster_notes: string[];
  meta: {
    weeks?: number[];
    tau_bid?: number;
    fit_min?: number;
    budget_left?: number;
    error?: string;
    title?: { p_playoffs?: number; p_title?: number; posture?: "protect" | "balanced" | "swing"; seasons?: number };
  };
  blind_board: WaiverBlindRow[];
};

const REMOTE_URL = process.env.WAIVERS_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getWaivers(): Promise<Waivers> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "WAIVERS_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "waivers.json");
  const samplePath = path.join(process.cwd(), "src", "data", "waivers.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
