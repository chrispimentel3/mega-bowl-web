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
  /** the likeliest top rival bid (same pricing as yours, on his roster and budget) */
  rival_top?: number | null;
  rival_team?: string | null;
  rivals_n?: number | null;
  /** how the bid was set against the rivals, e.g. "beats BillsMafia's likely $3" */
  bid_note?: string | null;
};

export type StreamWeek = { week: number; opp: string | null; proj: number };
export type StreamRow = {
  player: string; team: string; pos: "K" | "DEF"; weeks: StreamWeek[];
  gain_next: number; gain_avg: number; bid: number; max_bid: number;
  rival_top: number; rival_team: string; rivals_n: number; bid_note: string;
};
/** mega/kdef.py streamers: free-agent defenses and kickers against the one you'd start */
export type Streamers = {
  available: boolean;
  weeks: number[];
  K: { mine: { player: string; weeks: StreamWeek[] }[]; rows: StreamRow[] } | null;
  DEF: { mine: { player: string; weeks: StreamWeek[] }[]; rows: StreamRow[] } | null;
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
  streamers?: Streamers | null;
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
