export type TradeOffer = {
  give: string;
  give_val: number;
  get: string;
  get_val: number;
  addresses: string;
  fairness: number;
  edge: number;
};

export type TradeGroup = {
  partner: string;
  they_need: string | null;
  offers: TradeOffer[];
};

export type Trades = {
  available: boolean;
  groups: TradeGroup[];
  roster_src: string | null;
};

const REMOTE_URL = process.env.TRADES_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getTrades(): Promise<Trades> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`TRADES_URL fetch failed: ${res.status} ${res.statusText}`);
    return res.json();
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "trades.json");
  const samplePath = path.join(process.cwd(), "src", "data", "trades.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
