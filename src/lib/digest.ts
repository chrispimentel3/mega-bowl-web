import { fetchRemoteJson } from "./fetchRemoteJson";

export type DigestLine = { kind: string; text: string };

export type DigestTableRow = {
  team: string;
  points: number;
  rank: number;
  allplay: string;
  won: boolean;
  opponent: string;
  record: string;
};

export type DigestGame = { winner: string; w_pts: number; loser: string; l_pts: number; margin: number };

export type DigestSlateGame = {
  a: string;
  b: string;
  a_record: string;
  b_record: string;
  a_ppg: number;
  b_ppg: number;
  a_power: number | null;
  b_power: number | null;
  a_playoffs: number | null;
  b_playoffs: number | null;
  mine: boolean;
  stakes: number;
};

export type DigestMover = {
  team: string;
  p_before: number;
  p_after: number;
  delta: number;
  title_before: number;
  title_after: number;
};

export type Digest = {
  available: boolean;
  reason?: string;
  season: number;
  week: number;
  next_week: number;
  my_team: string;
  my_result: (DigestTableRow & { opp_points: number }) | null;
  headlines: DigestLine[];
  table: DigestTableRow[];
  games: DigestGame[];
  odds_movers: { available: boolean; from_week?: number; rows: DigestMover[] };
  slate: DigestSlateGame[];
  my_game: DigestSlateGame | null;
  game_of_week: DigestSlateGame | null;
  todo: {
    headline: string | null;
    waiver: { player: string; pos: string; bid: number; drop: string | null; why: string } | null;
    trade: { partner: string; give: string; get: string } | null;
  };
};

// digest.json sits next to league.json, so without its own variable it's read from the
// same place — one less environment variable to set on Vercel
const REMOTE_URL =
  process.env.DIGEST_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "digest.json");

/** Same pattern as `getLeague` — see src/lib/action-board.ts for why. */
export async function getDigest(): Promise<Digest> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson(REMOTE_URL, 3600, "DIGEST_URL");
    } catch {
      // the export hasn't produced one yet
      return { available: false, reason: "The digest hasn't been built yet." } as Digest;
    }
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "digest.json");
  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return { available: false, reason: "The digest hasn't been built yet." } as Digest;
  }
}
