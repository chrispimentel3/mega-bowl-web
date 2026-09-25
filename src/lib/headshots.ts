export type Headshots = Record<string, string>;

const REMOTE_URL = process.env.HEADSHOTS_URL;

/** Player display name -> nflverse headshot URL. Same fetch-with-fallback pattern as
 * every other export — see src/lib/action-board.ts for why. */
export async function getHeadshots(): Promise<Headshots> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 86400 } });
    if (!res.ok) return {};
    return res.json();
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
