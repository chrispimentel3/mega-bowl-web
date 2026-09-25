import { fetchRemoteJson } from "./fetchRemoteJson";

export type GlossaryRow = { tag: string; "what it means": string; "why it matters": string };

export type GlossaryGroup = { key: string; title: string; lede: string; rows: GlossaryRow[] };

export type Glossary = { headline: string; groups: GlossaryGroup[] };

const REMOTE_URL = process.env.GLOSSARY_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getGlossary(): Promise<Glossary> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 86400, "GLOSSARY_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "glossary.json");
  const samplePath = path.join(process.cwd(), "src", "data", "glossary.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
