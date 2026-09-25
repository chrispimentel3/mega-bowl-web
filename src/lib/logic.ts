import { fetchRemoteJson } from "./fetchRemoteJson";

export type LogicTopic = { key: string; title: string; headline: string; detail: string };

export type Logic = { topics: LogicTopic[] };

const REMOTE_URL = process.env.LOGIC_URL;

/** Same fetch-with-fallback pattern as every other export — see src/lib/action-board.ts. */
export async function getLogic(): Promise<Logic> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 86400, "LOGIC_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "logic.json");
  const samplePath = path.join(process.cwd(), "src", "data", "logic.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
