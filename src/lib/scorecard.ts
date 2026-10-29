import { fetchRemoteJson } from "./fetchRemoteJson";

export type ProjErr = { n: number; mae_ours: number; mae_consensus: number };

export type ProjSummary = {
  n: number;
  mae_ours?: number;
  mae_consensus?: number;
  /** share of player-weeks where ours was nearer the actual than the consensus */
  ours_closer?: number;
  by_pos?: Record<string, ProjErr>;
  vegas?: { n: number; mae_vegas: number; mae_ours: number; mae_consensus: number };
};

export type Call = { started: string; sat: string; started_pts: number; sat_pts: number; right: boolean };

export type ScoreWeek = {
  week: number;
  /** when the graded version was published: the last one before kickoff */
  snapshot: string;
  lineup: {
    ours: number;
    best: number;
    left: number;
    /** what each projection's lineup would have scored: ours, and the consensus's */
    shadow?: { ours: number; consensus: number };
    should_have_started: string[];
    calls: Call[];
    bye_calls: string[];
  } | null;
  projections: ProjSummary | null;
};

export type WaiverGrade = {
  week: number; add: string; drop: string; add_pts: number; drop_pts: number; weeks: number; right: boolean;
};

export type TradeGrade = {
  week: number;
  partner: string;
  give: string[];
  get: string[];
  /** what the card said the deal adds to your lineup, pts/wk */
  said: number | null;
  weeks: number;
  /** your best lineup with the deal minus without it, per week since */
  per_week: number;
  right: boolean | null;
};

/** what we said (a probability) against how often it happened, bucketed */
export type Calib = { bucket: string; n: number; said: number; happened: number };

export type Scorecard = {
  available: boolean;
  season?: number;
  through_week: number;
  weeks: ScoreWeek[];
  totals: {
    lineup_weeks: number;
    points_left: number;
    perfect_weeks: number;
    shadow?: { ours: number; consensus: number };
    calls: number;
    calls_right: number;
    projections: ProjSummary;
    waivers: number;
    waivers_right: number;
  } | null;
  waivers: WaiverGrade[];
  /** matchup tags graded: what tagged players scored against their own average before that week */
  matchups?: Record<"good" | "neutral" | "tough", { n: number; vs_avg_pct: number }>;
  /** this season's graded weeks re-weighting ours vs the consensus by position */
  live_blend?: { weights: Record<string, number>; tested: number; mae_gain?: number; active: boolean };
  /** the week's prop movers (the books raised his role) and what they then scored */
  movers?: { week: number; player: string; pos: string; kind: "UP" | "NEW"; pts: number; before: number | null }[];
  /** every trade idea the home board showed, replayed on your roster from the week it appeared */
  trades?: { n: number; helped: number; hurt: number; per_week: number | null; rows: TradeGrade[] };
  /** each game's win chance from the season sim at kickoff, against who won */
  odds?: {
    n?: number;
    favorites_won?: number;
    said?: number;
    buckets?: Calib[];
    games?: { week: number; favorite: string; underdog: string; p: number; won: boolean }[];
  };
  /** weekly playoff odds against who made it — only once the regular season is over */
  playoff_odds?: { available: boolean; after_week?: number; n?: number; weeks?: number[]; buckets?: Calib[] };
};

const EMPTY: Scorecard = { available: false, through_week: 0, weeks: [], totals: null, waivers: [] };

// scorecard.json sits next to league.json — same trick as history.ts, no new Vercel variable
const REMOTE_URL =
  process.env.SCORECARD_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "scorecard.json");

export async function getScorecard(): Promise<Scorecard> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<Scorecard>(REMOTE_URL, 3600, "SCORECARD_URL");
    } catch {
      return EMPTY;
    }
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(
      await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "scorecard.json"), "utf-8"),
    );
  } catch {
    return EMPTY;
  }
}
