import { fetchRemoteJson } from "./fetchRemoteJson";

export type TeamEnvRow = {
  team: string;
  players: string;
  matchup: string;
  total: number | null;
  spread: number | null;
  implied_pts: number | null;
};

export type VegasPlayerRow = {
  gsis_id: string;
  player: string;
  team: string;
  pos: string;
  vegas: number;
  vegas_parts: number;
  vegas_filled: number;
  vegas_complete: boolean;
  owner: string;
};

export type PlayerDifficultyRow = {
  player: string;
  pos: string;
  matchup: string;
  ease_rank: number;
  pa_pg: number;
  verdict: "great" | "good" | "tough" | "avoid" | string;
};

export type Matchups = {
  available: boolean;
  next_week: number;
  my_team: string;
  team_environment: TeamEnvRow[];
  vegas_players: VegasPlayerRow[];
  player_difficulty: PlayerDifficultyRow[];
};

const REMOTE_URL = process.env.MATCHUPS_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getMatchups(): Promise<Matchups> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "MATCHUPS_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "matchups.json");
  const samplePath = path.join(process.cwd(), "src", "data", "matchups.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
