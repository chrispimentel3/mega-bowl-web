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
    /** starters whose team played but who have no stat line — absent on an older export */
    dead_starts?: { n: number; proj: number; players: string[] };
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

/** n player-weeks; tag_pct the average published tag; vs_ours_pct actual vs our projection */
export type TagGrade = { n: number; tag_pct?: number; vs_ours_pct?: number };

export type CallGrades = {
  n: number;
  right?: number;
  brier?: number;
  /** weeks graded before Start/Sit published chances, rebuilt from the projections at kickoff */
  rebuilt_weeks?: number[];
  buckets: { bucket: string; n: number; said: number; happened: number }[];
  rows?: { week: number; start: string; sit: string; p: number; won: boolean; source: "published" | "rebuilt" }[];
};

/** how far Sunday's prop lines moved from the midweek consensus toward our projection:
 *  0 = the market ignored where we differed, 1 = it agreed fully (mega/scorecard.grade_market) */
export type MarketFit = { n: number; disagree: number; toward_ours?: number; se?: number };
export type Market = MarketFit & { weeks: number[]; by_pos?: Record<string, MarketFit> };

export type LiveCalib = {
  season: number;
  through_week: number;
  defense: Record<string, { beta: number; tested: number; dev_gain_pct: number; mae_gain: number; active: boolean }>;
  /** bucket "0".."3" = P(plays) ≤50%, 50–80%, 80–95%, 95–100%; p is what it now counts as */
  availability: { buckets: Record<string, { said: number; n: number; p: number }>; tested: number; brier_gain: number; active: boolean };
  odds: { s: number; lam: number; n: number; logloss_gain?: number; active: boolean };
};

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
    dead_starts?: { n: number; proj: number };
  } | null;
  waivers: WaiverGrade[];
  /** matchup tags graded: what tagged players who played scored against our projection at kickoff */
  matchups?: Partial<Record<"good" | "neutral" | "tough", TagGrade>> & { spread?: number };
  /** the weekly self-calibration (mega/live_calib.py): three settings refit on graded weeks */
  live_calib?: LiveCalib;
  /** the close-call chances Start/Sit showed, graded: said vs happened (mega/live_calib.grade_calls) */
  call_grades?: CallGrades;
  /** did Sunday's lines move toward our midweek projection? — absent on an older export */
  market?: Market;
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
