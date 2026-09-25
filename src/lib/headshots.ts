import { fetchRemoteJson } from "./fetchRemoteJson";

export type Headshots = Record<string, string>;

const REMOTE_URL = process.env.HEADSHOTS_URL;

/** Player display name -> nflverse headshot URL. Same fetch-with-fallback pattern as
 * every other export — see src/lib/action-board.ts for why. Every page depends on this
 * one (fetched once in the root layout), so a failure degrades to no photos rather than
 * throwing — losing headshots site-wide is much better than crashing every page. */
export async function getHeadshots(): Promise<Headshots> {
  if (REMOTE_URL) {
    try {
      return await fetchRemoteJson<Headshots>(REMOTE_URL, 86400, "HEADSHOTS_URL");
    } catch {
      return {};
    }
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "headshots.json");
  const samplePath = path.join(process.cwd(), "src", "data", "headshots.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    try {
      return JSON.parse(await readFile(samplePath, "utf-8"));
    } catch {
      return {};
    }
  }
}
