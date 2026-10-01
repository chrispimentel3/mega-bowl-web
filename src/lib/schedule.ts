import { fetchRemoteJson } from "./fetchRemoteJson";

/** [week, opponent, matchup %] */
export type ScheduleGame = [number, string, number];

export type Schedule = {
  available: boolean;
  from_week: number;
  games: number;
  /** "CHI|QB" -> the next few games' matchup, averaged */
  table: Record<string, { pct: number; g: ScheduleGame[] }>;
  /** player name -> "CHI|QB" */
  names: Record<string, string>;
};

const EMPTY: Schedule = { available: false, from_week: 0, games: 4, table: {}, names: {} };

// schedule.json sits next to league.json — same trick as digest.ts, no new Vercel variable
const REMOTE_URL =
  process.env.SCHEDULE_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "schedule.json");

/** Every page that shows a free agent or a trade target reads this (via the root layout), so a
 * failure degrades to no schedule tags rather than throwing. */
export async function getSchedule(): Promise<Schedule> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<Schedule>(REMOTE_URL, 3600, "SCHEDULE_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "schedule.json"), "utf-8"),
    );
  } catch {
    return EMPTY;
  }
}
