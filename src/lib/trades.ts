import { fetchRemoteJson } from "./fetchRemoteJson";

export type TradeImpact = {
  my_lineup_delta: number;
  their_lineup_delta: number;
  i_would_start: string[];
  i_would_bench: string[];
  they_would_start: string[];
  they_would_bench: string[];
};

export type TradeOffer = {
  give: string;
  give_val: number;
  get: string;
  get_val: number;
  addresses: string;
  fairness: number;
  edge: number;
  impact: TradeImpact | null;
};

export type TradeGroup = {
  partner: string;
  they_need: string | null;
  offers: TradeOffer[];
};

/** HANDOFF v1.3 Pass 4 (ff-dashboard mega/trade_theses.py): one engine-built offer.
 *  d_* numbers are points per week (d_week: this week only; d_ros: rest of season) and
 *  d_title is a change in title PROBABILITY (0.012 = +1.2 percentage points). */
export type ThesisSide = {
  d_week: number;
  d_ros: number;
  d_title: number;
  se_title: number;
  title_noise: boolean;
  p_title?: number;
  p_playoffs?: number;
  p_playoffs_now?: number;
};

export type ThesisPlayer = { name: string; pos: string; ros_pg: number };

export type ThesisRank = {
  name: string;
  pos: string;
  our_rank: number | null;
  ecr_rank: number | null;
  driver: string | null;
  view: string;
};

import type { TeamProfile } from "@/lib/tradeSearch";

export type TradeThesis = {
  partner: string;
  /** what the partner is thin at and can spare; absent in files exported before this existed */
  partner_profile?: TeamProfile | null;
  shape: string;
  give: ThesisPlayer[];
  get: ThesisPlayer[];
  tags: string[];
  all_tags: string[];
  thesis: string;
  kill: string;
  second: { tag: string; thesis: string } | null;
  us: ThesisSide;
  them: ThesisSide;
  i_would_start: string[];
  i_would_bench: string[];
  they_would_start: string[];
  they_would_bench: string[];
  fa_add: string | null;
  netted_free_swap: boolean;
  pitch: string;
  p_accept: number;
  flag: "LIKELY" | "EXPLOIT" | "NEEDS_PITCH" | "LONGSHOT";
  fairness: number;
  /** what you send that would sit on their bench, worded by the service */
  sits_for_them?: string[];
  ranks: { give: ThesisRank[]; get: ThesisRank[] };
};

export type TradesMeta = {
  evaluated?: number;
  simulated?: number;
  shown?: number;
  p_playoffs?: number | null;
  p_title?: number | null;
  posture?: "protect" | "balanced" | "swing" | null;
  seasons?: number;
  priors?: string;
  league_trades?: number;
  bias_teams?: string[];
};

export type Trades = {
  available: boolean;
  version?: number;
  cards?: TradeThesis[];
  meta?: TradesMeta;
  groups: TradeGroup[];
  roster_src: string | null;
  impact_available: boolean;
};

const REMOTE_URL = process.env.TRADES_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getTrades(): Promise<Trades> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "TRADES_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "trades.json");
  const samplePath = path.join(process.cwd(), "src", "data", "trades.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
