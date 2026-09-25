import { fetchRemoteJson } from "./fetchRemoteJson";

export type ArchMineRow = {
  player: string;
  pos: string;
  team: string;
  arch_fit: number;
  tags: string;
  carries_pg: number | null;
  tgt_share: number | null;
  tm_rank: number | null;
  age: number | null;
  exp_yrs: number | null;
  why: string;
};

export type ArchBoardRow = {
  status: "mine" | "rostered" | "available";
  player: string;
  pos: string;
  team: string;
  arch_fit: number;
  tags: string;
  half_ppr_pg: number | null;
  proj_ppg: number | null;
  tgt_share: number | null;
  tm_rank: number | null;
  why: string;
};

export type Archetypes = {
  available: boolean;
  mine: ArchMineRow[];
  board: ArchBoardRow[];
};

const REMOTE_URL = process.env.ARCHETYPES_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getArchetypes(): Promise<Archetypes> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 3600, "ARCHETYPES_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "archetypes.json");
  const samplePath = path.join(process.cwd(), "src", "data", "archetypes.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
