export type UsageRow = {
  player: string;
  week: number;
  target_share: number | null;
  half_ppr: number | null;
  targets: number | null;
  carries: number | null;
  snap_share: number | null;
};

export type Usage = {
  available: boolean;
  season: number;
  players: string[];
  starters: string[];
  rows: UsageRow[];
};

const REMOTE_URL = process.env.USAGE_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getUsage(): Promise<Usage> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`USAGE_URL fetch failed: ${res.status} ${res.statusText}`);
    return res.json();
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "usage.json");
  const samplePath = path.join(process.cwd(), "src", "data", "usage.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
