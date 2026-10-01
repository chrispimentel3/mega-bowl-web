import { fetchRemoteJson } from "./fetchRemoteJson";

/** The league-wide season stat table behind the chart builder (ff-dashboard
 *  mega/stats_web.py) — the same numbers the player cards rank on. Columnar on the wire. */

export type MetricKind = "pct" | "num" | "int" | "signed";
export type Metric = { key: string; label: string; kind: MetricKind; positions: string[]; means: string };

export type StatsTable = {
  available: boolean;
  metrics: Metric[];
  columns: string[];
  rows: (string | number | boolean | null)[][];
};

export type StatRow = {
  gsis_id: string;
  name: string;
  pos: string;
  team: string | null;
  season: number;
  owner: string | null;
  mine: boolean;
  [metric: string]: string | number | boolean | null;
};

export function toRows(t: StatsTable): StatRow[] {
  return t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c, r[i]])) as StatRow);
}

export function formatMetric(v: number | null | undefined, kind: MetricKind): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (kind === "pct") return `${(v * 100).toFixed(1)}%`;
  if (kind === "int") return Math.round(v).toLocaleString();
  if (kind === "signed") return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(Math.abs(v) < 2 ? 2 : 1)}`;
  return v.toFixed(Math.abs(v) < 2 ? 2 : 1);
}

// stats_table.json sits next to league.json — one less Vercel variable
const REMOTE_URL =
  process.env.STATS_TABLE_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "stats_table.json");

const EMPTY: StatsTable = { available: false, metrics: [], columns: [], rows: [] };

export async function getStatsTable(): Promise<StatsTable> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson(REMOTE_URL, 3600, "STATS_TABLE_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "stats_table.json"), "utf-8"));
  } catch {
    return EMPTY;
  }
}
