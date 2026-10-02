import { fetchRemoteJson, RemoteFetchError } from "./fetchRemoteJson";

export type PlayerIndexRow = {
  gsis_id: string;
  name: string;
  pos: string;
  team: string | null;
  last_team: string | null;
  label: string;
  mine: boolean;
};

export type PlayerIndex = {
  available: boolean;
  index: PlayerIndexRow[];
};

export type PlayerBio = {
  jersey_number: number | null;
  age: number | null;
  height: string | null;
  weight: number | null;
  college: string | null;
  draft_number: number | null;
  entry_year: number | null;
  headshot_url: string | null;
};

export type PlayerOwnership = {
  kind: "mine" | "other_team" | "waivers" | "no_team" | "free_agent" | "unknown";
  team: string | null;
  slot: string | null;
  waiver_until: string | null;
};

export type CardRow = { stat: string; value_fmt: string; pos_rank: string; means: string };

export type RoleRow = {
  metric: string;
  him: number | null;
  role_avg: number | null;
  vs_role: number | null;
  nfl_avg: number | null;
  vs_nfl: number | null;
  fmt: string;
};

export type RoleSection = {
  headline: string;
  from_usage: boolean;
  games: number;
  rows: RoleRow[];
};

export type ThisWeek = {
  bye: boolean;
  opponent?: string;
  home?: boolean;
  ease_rank?: number | null;
  out_reason?: string | null;
  projection?: number | null;
  proj_source?: string | null;
  matchup_mult?: number | null;
  matchup_pct?: number | null;
  matchup_basis?: "defense+vegas" | "defense_only" | null;
  matchup_def_rank?: number | null;
  matchup_def_pct?: number | null;
  matchup_vegas_pct?: number | null;
  matchup_baseline?: number | null;
  expected_pts?: number | null;
  delta_pts?: number | null;
};

export type GameLogRow = Record<string, number | string | null>;

export type SeasonPayload = {
  games: number;
  pts_pg: number | null;
  xfp_pg: number | null;
  vs_exp_pg: number | null;
  usage_label: string;
  usage_value: number | null;
  usage_fmt: string | null;
  ranks: Record<string, string | null>;
  card: CardRow[];
  game_log: GameLogRow[];
  role: RoleSection | null;
  this_week: ThisWeek | null;
};

export type PlayerDetail = {
  gsis_id: string;
  name: string;
  pos: string;
  team: string | null;
  last_team: string | null;
  bio: PlayerBio;
  ownership: PlayerOwnership;
  nfl_status: string | null;
  out_reason: string | null;
  seasons: Record<string, SeasonPayload>;
  error?: string;
};

const INDEX_URL = process.env.PLAYERS_INDEX_URL;
const PLAYERS_BASE_URL = process.env.PLAYERS_BASE_URL; // e.g. .../data/web/players (no trailing slash)

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why, plus the
 * players-specific wrinkle: the full per-player detail set runs to several MB, so it's
 * split into this small index and one file per player (see ff-dashboard/tools/export_web.py),
 * fetched only for whichever player is actually being viewed. */
export async function getPlayerIndex(): Promise<PlayerIndex> {
  if (INDEX_URL) {
    return fetchRemoteJson(INDEX_URL, 3600, "PLAYERS_INDEX_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "players_index.json");
  const samplePath = path.join(process.cwd(), "src", "data", "players-index.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}

export async function getPlayer(gsisId: string): Promise<PlayerDetail | null> {
  if (PLAYERS_BASE_URL) {
    try {
      return await fetchRemoteJson<PlayerDetail>(`${PLAYERS_BASE_URL}/${gsisId}.json`, 3600, "PLAYERS_BASE_URL");
    } catch (e) {
      if (e instanceof RemoteFetchError && e.status === 404) return null;
      // A real 404 means this player genuinely doesn't have a card (not on any roster
      // this app tracks) — that's a normal "not found". Anything else is a transient
      // fetch failure surviving 3 retries; degrading to null here (same "not found"
      // page) beats crashing the whole page on a raw.githubusercontent.com hiccup.
      console.error(`getPlayer(${gsisId}) failed after retries:`, e);
      return null;
    }
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "players", `${gsisId}.json`);
  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    // Fall back to the one bundled sample player so local dev without the sibling repo
    // still shows something for at least one gsis_id.
    const samplePath = path.join(process.cwd(), "src", "data", "player-sample.json");
    try {
      const sample = JSON.parse(await readFile(samplePath, "utf-8")) as PlayerDetail;
      return sample.gsis_id === gsisId ? sample : null;
    } catch {
      return null;
    }
  }
}
