import { fetchRemoteJson } from "./fetchRemoteJson";

export type TrendRow = { player: string; week: number; value: number };

export type TrendMover = {
  player: string;
  pos: string;
  mine: boolean;
  prev: number;
  last: number;
  delta: number;
};

export type Trend = {
  available: boolean;
  players: string[];
  rows: TrendRow[];
  /** name -> position, and whether he's on our roster; absent in older exports */
  info?: Record<string, { pos: string; mine: boolean }>;
  /** change between each player's last two snapshots, biggest first */
  movers?: { weeks: number[]; up: TrendMover[]; down: TrendMover[] };
};

const EMPTY: Trend = { available: false, players: [], rows: [] };

/** Weekly snapshots (mega/history.py) started 2026-09-25 and cover the whole league, so
 * a trend is a line per player plus who moved most. Same fetch-with-fallback
 * pattern as every other export; see src/lib/action-board.ts for why. */
async function getTrend(remoteUrl: string | undefined, filename: string): Promise<Trend> {
  if (remoteUrl) {
    try {
      return await fetchRemoteJson<Trend>(remoteUrl, 3600, filename);
    } catch {
      return EMPTY;
    }
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", filename);
  const samplePath = path.join(
    process.cwd(), "src", "data",
    filename.replace(/_/g, "-").replace(".json", ".sample.json"),
  );

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    try {
      return JSON.parse(await readFile(samplePath, "utf-8"));
    } catch {
      return EMPTY;
    }
  }
}

export const getWoprTrend = () => getTrend(process.env.WOPR_TREND_URL, "wopr_trend.json");
export const getArchetypeTrend = () => getTrend(process.env.ARCHETYPE_TREND_URL, "archetype_trend.json");
export const getTradeValueTrend = () => getTrend(process.env.TRADE_VALUE_TREND_URL, "trade_value_trend.json");
