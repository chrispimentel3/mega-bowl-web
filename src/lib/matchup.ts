import { fetchRemoteJson } from "./fetchRemoteJson";
import type { StartSit } from "./start-sit";

/** This week's opponent run through Start/Sit (ff-dashboard tools/export_web.py `matchup`):
 *  the same projections, matchup reads and optimizer as my lineup, plus who they are. */
export type Matchup = Omit<StartSit, "calls"> & { opp: string | null };

const EMPTY: Matchup = {
  available: false, headline: "", subhead: "", kpis: null, starters: [], bench: [], next_week: 0, opp: null,
};

// matchup.json sits next to league.json — same trick as scorecard.ts, no new Vercel variable
const REMOTE_URL =
  process.env.MATCHUP_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "matchup.json");

export async function getMatchup(): Promise<Matchup> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<Matchup>(REMOTE_URL, 3600, "MATCHUP_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "matchup.json"), "utf-8"),
    );
  } catch {
    return EMPTY;
  }
}
