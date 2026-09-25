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
  odds: number | null;
  their_odds: number | null;
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
  rows: TradeSearchRow[];
};

export async function getTradePool(): Promise<TradePoolRow[]> {
  const res = await fetch(`${API_URL}/trade-pool`);
  if (!res.ok) throw new Error(`Trade API /trade-pool failed: ${res.status}`);
  return res.json();
}

export async function searchTrades(
  pid: string,
  mine: boolean,
  opts: { flags?: string[]; twoPlayer?: boolean; order?: "accept" | "gain" } = {},
): Promise<TradeSearchResult> {
  const res = await fetch(`${API_URL}/trade-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pid,
      mine,
      flags: opts.flags ?? ["LIKELY", "EXPLOIT", "NEEDS_PITCH"],
      two_player: opts.twoPlayer ?? true,
      order: opts.order ?? "accept",
    }),
  });
  if (res.status === 400 || res.status === 503) {
    const body = await res.json().catch(() => ({ detail: "Search failed." }));
    throw new Error(body.detail || "Search failed.");
  }
  if (!res.ok) throw new Error(`Trade API /trade-search failed: ${res.status}`);
  return res.json();
}
