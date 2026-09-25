import { fetchRemoteJson } from "./fetchRemoteJson";

export type DraftBoardRow = {
  player: string;
  pos: string;
  drafted_by: string;
  round: number;
  value: number;
  value_delta: number;
  mine: boolean;
};

export type RegressionRow = {
  player: string;
  pos: string;
  gms: number;
  actual: number;
  expected: number;
  diff_pg: number;
  signal: string;
};

export type Draft = {
  available: boolean;
  board: DraftBoardRow[];
  regression: RegressionRow[];
};

const REMOTE_URL = process.env.DRAFT_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getDraft(): Promise<Draft> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "DRAFT_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "draft.json");
  const samplePath = path.join(process.cwd(), "src", "data", "draft.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
