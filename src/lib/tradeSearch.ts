/** Client for the live trade-search endpoints (service/main.py in ff-dashboard, the same
 * Render service "Ask anything" talks to — see src/lib/ask.ts for why this one page-family
 * can't be a static export: the question is "pick anyone in the league," not a fixed list. */
const API_URL = process.env.NEXT_PUBLIC_ASK_API_URL || "http://localhost:8008";

export type TradePoolRow = {
  label: string;
  player: string;
  pos: string;
  team: string;
  value: number;
  pid: string;
  mine: boolean;
  /** in an IR slot; absent on an older API deploy */
  ir?: boolean;
};

export type TradeSearchRow = {
  partner: string;
  shape: string;
  give: string[];
  get: string[];
  d_me: number;
  d_them: number;
  mkt_ratio: number;
  flag: "LIKELY" | "EXPLOIT" | "NEEDS_PITCH" | "LONGSHOT";
  /** a 2-for-1 credited net of the free agent that fills the open spot, who you could add
   *  without trading; absent on an older API deploy */
  netted?: boolean;
  fa_add?: string[];
  /** players in the offer on injured reserve, with the share of the remaining games each
   *  is projected to play — how they're valued */
  on_ir?: { name: string; avail: number | null }[];
  odds: number | null;
  their_odds: number | null;
  /** change in title probability (0.01 = +1pt), from the v1.3 player-level sim; absent on
   *  an older API deploy */
  title?: number | null;
  their_title?: number | null;
  title_noise?: boolean | null;
  /** near-duplicates folded into this offer: same shape and the same headline players, a different
   *  throw-in (shown up to a handful; n_variants counts them all); absent on an older API deploy */
  variants?: { give: string[]; get: string[]; d_me: number; d_them: number; flag: string }[];
  n_variants?: number;
  watch: string | null;
  i_would_start: string[];
  i_would_bench: string[];
  they_would_start: string[];
  they_would_bench: string[];
};

export type TradeSearchResult = {
  evaluated: number;
  padded: number;
  matched: number;
  sim_available: boolean;
  /** true on the offers-only answer; the odds come from a second call */
  odds_pending?: boolean;
  rows: TradeSearchRow[];
  /** team search only: the team searched, and their players ranked by what each would add to
   *  your lineup (best offer's gain in points per week) */
  team?: string;
  targets?: { name: string; pos: string | null; best_d_me: number; offers: number }[];
  /** team search only: where the team is thin (points a week below the league's average
   *  starters there) and bench players who'd start for the typical team */
  profile?: { needs: { pos: string; gap: number }[]; spare: { name: string; pos: string; ppg: number }[] };
  /** team search only: how many offers of each shape were found, before the 60-per-view cap */
  shape_counts?: Record<string, number>;
};

/** Only the best this-many offers get priced in playoff/title odds (SIM_TOP in the service). */
export const ODDS_TOP = 12;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The API is on Render's free tier, which sleeps after ~15 idle minutes and answers
 *  502/503 (or not at all) for up to a minute while it wakes or redeploys. Retry through
 *  that instead of failing on the first try. */
async function fetchWaking(url: string, init?: RequestInit, waits = [3000, 8000, 15000, 30000]): Promise<Response> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, init);
      if (![502, 503, 504].includes(res.status) || i >= waits.length) return res;
      // a 503 carrying our own JSON detail is a real answer, not a wake-up
      if (res.headers.get("content-type")?.includes("application/json")) return res;
    } catch (e) {
      if (i >= waits.length) throw e;
    }
    await sleep(waits[i]);
  }
}

export async function getTradePool(): Promise<TradePoolRow[]> {
  const res = await fetchWaking(`${API_URL}/trade-pool`);
  if (!res.ok) throw new Error(`Trade API /trade-pool failed: ${res.status}`);
  return res.json();
}

export async function searchTrades(
  pid: string,
  mine: boolean,
  opts: { flags?: string[]; twoPlayer?: boolean; order?: "accept" | "gain"; odds?: boolean } = {},
): Promise<TradeSearchResult> {
  const res = await fetchWaking(`${API_URL}/trade-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pid,
      mine,
      flags: opts.flags ?? ["LIKELY", "EXPLOIT", "NEEDS_PITCH"],
      two_player: opts.twoPlayer ?? true,
      order: opts.order ?? "accept",
      odds: opts.odds ?? true,
    }),
  });
  if (res.status === 400 || res.status === 503) {
    const body = await res.json().catch(() => ({ detail: "Search failed." }));
    throw new Error(body.detail || "Search failed.");
  }
  if (!res.ok) throw new Error(`Trade API /trade-search failed: ${res.status}`);
  return res.json();
}

/** Every offer to one team, plus their players ranked as targets (service /trade-team). */
export async function searchTeam(
  team: string,
  opts: { flags?: string[]; size?: 1 | 2 | 3; shape?: string | null; order?: "accept" | "gain"; odds?: boolean } = {},
): Promise<TradeSearchResult> {
  const res = await fetchWaking(`${API_URL}/trade-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team,
      flags: opts.flags ?? ["LIKELY", "EXPLOIT", "NEEDS_PITCH"],
      size: opts.size ?? 3,
      shape: opts.shape ?? null,
      order: opts.order ?? "accept",
      odds: opts.odds ?? true,
    }),
  });
  if (res.status === 400 || res.status === 503) {
    const body = await res.json().catch(() => ({ detail: "Search failed." }));
    throw new Error(body.detail || "Search failed.");
  }
  if (!res.ok) throw new Error(`Trade API /trade-team failed: ${res.status}`);
  return res.json();
}
