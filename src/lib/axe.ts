import { fetchRemoteJson } from "./fetchRemoteJson";

export type AxeRow = {
  player: string;
  expected: number;
  actual: number;
  diff: number;
};

export type Axe = {
  available: boolean;
  week: number;
  rows: AxeRow[];
};

const REMOTE_URL = process.env.AXE_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getAxe(): Promise<Axe> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "AXE_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "axe.json");
  const samplePath = path.join(process.cwd(), "src", "data", "axe.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
