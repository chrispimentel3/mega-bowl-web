import { fetchRemoteJson } from "./fetchRemoteJson";

export type PlayoffStarter = {
  name: string;
  pos: string;
  slot: string;
  pts: number;
  team: string | null;
  opp: string | null;
  /** how the opponent's defense has treated the position: 1 = allows the most */
  ease: number | null;
  tag: "easy" | "tough" | "bye" | null;
  /** on IR now, projected back by then */
  ir: boolean;
};

export type Playoffs = {
  available: boolean;
  weeks?: number[];
  lineups?: { week: number; total: number; starters: PlayoffStarter[] }[];
  rank?: { mine: number; of: number; avg: number; league: number; best: { team: string; avg: number } };
  thin?: { pos: string; mine: number; league: number; gap: number }[];
  stashes?: {
    name: string;
    pos: string;
    team: string | null;
    gain: number;
    by_week: { week: number; gain: number; opp: string | null; tag: PlayoffStarter["tag"] }[];
  }[];
  handcuffs?: { starter: string; cuff: string; clear_two: boolean; owner: string; mine: boolean }[];
  /** free agents worth holding to keep from the rival who'd start him in the playoffs */
  blocks?: {
    name: string;
    pos: string;
    team: string | null;
    rival: string;
    rival_gain: number;
    my_title_drop: number;
    se: number;
    rival_title_gain: number;
  }[];
};

const EMPTY: Playoffs = { available: false };

// playoffs.json sits next to league.json — same trick as history.ts, no new Vercel variable
const REMOTE_URL =
  process.env.PLAYOFFS_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "playoffs.json");

export async function getPlayoffs(): Promise<Playoffs> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<Playoffs>(REMOTE_URL, 3600, "PLAYOFFS_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "playoffs.json"), "utf-8"),
    );
  } catch {
    return EMPTY;
  }
}
