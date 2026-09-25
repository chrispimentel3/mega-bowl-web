export type ShopHoldRow = {
  player: string;
  pos: string;
  slot: string;
  half_ppr_pg: number;
  per_g: number;
  tgt_pct: number | null;
  tm_rank: number | null;
  why: string;
};

export type WaiverRow = {
  player: string;
  pos: string;
  why: string;
  gain?: number;
  bid?: number;
  max_bid?: number;
  drop?: string;
  pg_recent?: number;
  tgt_pct?: number;
  tm_rank?: number;
  add_score?: number;
};

export type TradeRow = {
  partner: string;
  give: string;
  give_val: number;
  get: string;
  get_val: number;
  addresses: string;
  fairness: number;
};

export type ActionBoard = {
  headline: string;
  subhead: string;
  basis: { prior_season: number; season: number; weeks: number } | null;
  xfp_available: boolean;
  shop: ShopHoldRow[];
  hold: ShopHoldRow[];
  waivers: WaiverRow[];
  trades: TradeRow[];
  roster_src: string | null;
  season: number;
  week: number;
  next_week: number;
};

const REMOTE_URL = process.env.ACTION_BOARD_URL;

/**
 * Data comes from ff-dashboard's `mega/action_board.py` (via `tools/export_web.py`),
 * never recomputed here — this app is presentation only. In production ACTION_BOARD_URL
 * points at the committed JSON in the public ff-dashboard repo (raw.githubusercontent.com).
 * Locally, without that env var, we read the sibling checkout directly so `npm run dev`
 * works against real, current data with no extra setup.
 */
export async function getActionBoard(): Promise<ActionBoard> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`ACTION_BOARD_URL fetch failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "action_board.json");
  const samplePath = path.join(process.cwd(), "src", "data", "action-board.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
