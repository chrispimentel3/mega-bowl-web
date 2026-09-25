import { fetchRemoteJson } from "./fetchRemoteJson";

export type NewsItem = {
  source: string;
  title: string;
  link: string;
  summary: string;
  published: number | null; // epoch ms, or null
  mentions_mine: boolean;
};

export type News = { available: boolean; items: NewsItem[]; error?: string };

const REMOTE_URL = process.env.NEWS_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. Revalidates more
 * often than most exports since headlines move faster than weekly dashboard data. */
export async function getNews(): Promise<News> {
  if (REMOTE_URL) {
    return fetchRemoteJson(REMOTE_URL, 900, "NEWS_URL");
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "news.json");
  const samplePath = path.join(process.cwd(), "src", "data", "news.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
