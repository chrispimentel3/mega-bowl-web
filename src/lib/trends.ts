export type TrendRow = { player: string; week: number; value: number };

export type Trend = { available: boolean; players: string[]; rows: TrendRow[] };

const EMPTY: Trend = { available: false, players: [], rows: [] };

/** Weekly snapshots (mega/history.py) are new as of 2026-09-25 — these will be sparse
 * (often a single week) until a few more Tuesdays accumulate. Same fetch-with-fallback
 * pattern as every other export; see src/lib/action-board.ts for why. */
async function getTrend(remoteUrl: string | undefined, filename: string): Promise<Trend> {
  if (remoteUrl) {
    const res = await fetch(remoteUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return EMPTY;
    return res.json();
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
