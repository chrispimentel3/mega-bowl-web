import {
  parseEvent, scoreBox, scoreTeams,
  type LiveSetup, type LiveTeam, type NflGame, type Scored,
} from "@/lib/liveScoring";

/** Live fantasy scores for this week's matchups, scored from ESPN's public NFL box scores
 *  (src/lib/liveScoring.ts). Every visitor shares the cached ESPN fetches: the scoreboard
 *  and games under way refresh every 30s, finished games hourly. */
export const dynamic = "force-dynamic";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const SETUP_URL =
  process.env.LIVE_SETUP_URL || process.env.LEAGUE_URL?.replace(/league\.json$/, "live_setup.json");

export type LiveResponse = {
  available: boolean;
  reason?: string;
  season?: number;
  week?: number;
  my_team?: string;
  updated?: string;
  live?: boolean;
  games?: NflGame[];
  matchups?: { a: LiveTeam; b: LiveTeam }[];
};

async function getSetup(): Promise<LiveSetup | null> {
  if (SETUP_URL) {
    const res = await fetch(SETUP_URL, { next: { revalidate: 600 } });
    return res.ok ? res.json() : null;
  }
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "live_setup.json"), "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  const setup = await getSetup();
  if (!setup?.available) {
    return Response.json({ available: false, reason: setup?.reason ?? "No lineups published yet." } satisfies LiveResponse);
  }

  const sbRes = await fetch(`${ESPN}/scoreboard?dates=${setup.season}&seasontype=2&week=${setup.week}`, {
    next: { revalidate: 30 },
  });
  if (!sbRes.ok) {
    return Response.json({ available: false, reason: "The NFL scoreboard isn't answering right now." } satisfies LiveResponse);
  }
  const games: NflGame[] = ((await sbRes.json()).events ?? []).map(parseEvent);

  const scored = new Map<string, Scored & { team: string }>();
  await Promise.all(
    games
      .filter((g) => g.state !== "pre")
      .map(async (g) => {
        const res = await fetch(`${ESPN}/summary?event=${g.id}`, { next: { revalidate: g.state === "post" ? 3600 : 30 } });
        if (!res.ok) return;
        for (const [k, v] of scoreBox(await res.json(), g)) scored.set(k, v);
      }),
  );

  const teams = new Map(scoreTeams(setup, games, scored).map((t) => [t.team, t]));
  const matchups = setup.matchups
    .filter(([a, b]) => teams.has(a) && teams.has(b))
    .map(([a, b]) => ({ a: teams.get(a)!, b: teams.get(b)! }))
    .sort((x, y) => Number(y.a.team === setup.my_team || y.b.team === setup.my_team)
                  - Number(x.a.team === setup.my_team || x.b.team === setup.my_team));

  return Response.json({
    available: true,
    season: setup.season,
    week: setup.week,
    my_team: setup.my_team,
    updated: new Date().toISOString(),
    live: games.some((g) => g.state === "in"),
    games,
    matchups,
  } satisfies LiveResponse);
}
