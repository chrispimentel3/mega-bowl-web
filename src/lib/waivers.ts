export type WaiverWorthRow = {
  player: string;
  pos: string;
  nfl_team: string;
  ppg: number;
  gain: number;
  bid: number;
  max_bid: number;
  drop: string | null;
  why: string;
};

export type WaiverSpecRow = {
  player: string;
  pos: string;
  nfl_team: string;
  ppg: number;
  add_score: number;
  upside: string;
  why: string;
};

export type WaiverBlindRow = Record<string, unknown> & { player: string; pos: string };

export type Waivers = {
  available: boolean;
  need_aware: boolean;
  headline: string;
  subhead: string;
  faab: { known: boolean; mine?: number; richer?: number; max_rival?: number; median_rival?: number; teams?: number } | null;
  market: { claims: number; median: number; max: number; contested: number; listed_spend: number; league_spend: number; unlisted_spend: number } | null;
  worth: WaiverWorthRow[];
  speculative: WaiverSpecRow[];
  blind_board: WaiverBlindRow[];
};

const REMOTE_URL = process.env.WAIVERS_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getWaivers(): Promise<Waivers> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`WAIVERS_URL fetch failed: ${res.status} ${res.statusText}`);
    return res.json();
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "waivers.json");
  const samplePath = path.join(process.cwd(), "src", "data", "waivers.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
