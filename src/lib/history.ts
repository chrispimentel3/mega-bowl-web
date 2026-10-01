import { fetchRemoteJson } from "./fetchRemoteJson";

export type HistoryStanding = {
  rank: number;
  team: string;
  record: string;
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
  made_playoffs: boolean;
  seat: number | null;
  mine: boolean;
};

export type HistoryRosterPlayer = { slot: string | null; player: string; pos: string | null; nfl_team: string | null };

export type HistorySeason = {
  year: number;
  league_name: string | null;
  champion: string | null;
  champion_seat: number | null;
  standings: HistoryStanding[];
  rosters: Record<string, HistoryRosterPlayer[]>;
};

export type HistoryRecord = { label: string; team: string; year: number; value: string };

export type AllTimeRow = {
  seat: number | null;
  team: string;
  seasons: number;
  titles: number;
  playoffs: number;
  record: string;
  win_pct: number;
  pf: number;
  years_won: number[];
  mine: boolean;
};

export type History = {
  available: boolean;
  seasons: HistorySeason[];
  records: HistoryRecord[];
  all_time: { rows: AllTimeRow[]; named_only: number };
  /** seasons the league has played that haven't been pulled from Yahoo yet */
  missing: number[];
};

const EMPTY: History = {
  available: false, seasons: [], records: [], all_time: { rows: [], named_only: 0 }, missing: [],
};

// history.json sits next to league.json — same trick as digest.ts, no new Vercel variable
const REMOTE_URL =
  process.env.HISTORY_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "history.json");

export async function getHistory(): Promise<History> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<History>(REMOTE_URL, 3600, "HISTORY_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "history.json"), "utf-8"),
    );
  } catch {
    return EMPTY;
  }
}
