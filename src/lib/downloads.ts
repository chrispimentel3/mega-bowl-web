import { fetchRemoteJson } from "./fetchRemoteJson";

export type RosterRow = {
  name: string;
  slot: string;
  pos: string;
  nfl_team: string | null;
  yahoo_id: string | null;
  gsis_id: string | null;
  pfr_id: string | null;
  matched_name: string | null;
  match_method: string;
  resolved: boolean;
  unmapped: boolean;
};

export type Downloads = { available: boolean; roster: RosterRow[]; match_line: string };

const REMOTE_URL = process.env.DOWNLOADS_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getDownloads(): Promise<Downloads> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "DOWNLOADS_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "downloads.json");
  const samplePath = path.join(process.cwd(), "src", "data", "downloads.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}

/** Reads a CSV export (player_stats.csv, ff_opportunity.csv) for the download routes below —
 * these are files, not JSON, so they skip getDownloads' fetch-and-parse pattern but follow the
 * same remote/sibling precedence. */
export async function readCsvExport(remoteUrl: string | undefined, filename: string): Promise<string | null> {
  if (remoteUrl) {
    const res = await fetch(remoteUrl, { next: { revalidate: 3600 } });
    return res.ok ? res.text() : null;
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", filename);

  try {
    return await readFile(siblingPath, "utf-8");
  } catch {
    return null;
  }
}
