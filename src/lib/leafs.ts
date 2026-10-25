import { unstable_cache } from "next/cache";
import { DATA_TAG, fetchRemoteJson } from "./fetchRemoteJson";

const TEAM = "TOR";
const NHL = "https://api-web.nhle.com/v1";
const MP = "https://moneypuck.com/moneypuck/playerData";
const REVALIDATE = 1800;

export type LeafsGame = {
  id: number;
  date: string;
  opp: string;
  home: boolean;
  gf: number;
  ga: number;
  result: "W" | "L" | "OTL";
  /** MoneyPuck 5-on-5, null until MoneyPuck has the game */
  xgf: number | null;
  xga: number | null;
  cfPct: number | null;
  xgPct: number | null;
};

export type LeafsSkater = {
  id: number;
  name: string;
  pos: string;
  gp: number;
  g: number;
  a: number;
  pts: number;
  plusMinus: number;
  shots: number;
  toi: number; // seconds per game
  ixg: number | null; // individual xG, all situations
  gameScore: number | null; // MoneyPuck game score, per game
  xgPct: number | null; // on-ice 5v5 xGF%
  cfPct: number | null; // on-ice 5v5 CF%
};

export type LeafsGoalie = { id: number; name: string; gp: number; w: number; l: number; otl: number; svPct: number; gaa: number; gsax: number | null };

export type LeafsStanding = {
  gp: number; w: number; l: number; otl: number; pts: number; pointPctg: number;
  gf: number; ga: number; divisionRank: number; leagueRank: number; streak: string; l10: string;
};

export type Leafs = {
  season: string; // "2026-27"
  standing: LeafsStanding | null;
  games: LeafsGame[];
  upcoming: { date: string; opp: string; home: boolean }[];
  skaters: LeafsSkater[];
  goalies: LeafsGoalie[];
};

/** NHL seasons start in October; September is preseason of the new one. */
function seasonStart(now = new Date()) {
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

// MoneyPuck CSVs have no quoted fields, so a plain split is enough.
function parseCsv(text: string) {
  const [head, ...lines] = text.trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => {
    const v = l.split(",");
    return Object.fromEntries(cols.map((c, i) => [c, v[i]])) as Record<string, string>;
  });
}

async function fetchCsv(url: string) {
  // no-store: these files are over Next's 2MB fetch-cache limit; the parsed, filtered result is cached below instead
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`MoneyPuck ${res.status}: ${url}`);
  return parseCsv(await res.text());
}

/** MoneyPuck's per-game team rows and the Leafs' season player rows, filtered down to what the page uses. */
const getMoneyPuck = unstable_cache(
  async (start: number) => {
    const [teamRows, skaterRows, goalieRows] = await Promise.all([
      fetchCsv(`${MP}/careers/gameByGame/regular/teams/${TEAM}.csv`),
      fetchCsv(`${MP}/seasonSummary/${start}/regular/skaters.csv`),
      fetchCsv(`${MP}/seasonSummary/${start}/regular/goalies.csv`),
    ]);
    const games = Object.fromEntries(
      teamRows
        .filter((r) => r.season === String(start) && r.situation === "5on5")
        .map((r) => [r.gameId, { xgf: +r.xGoalsFor, xga: +r.xGoalsAgainst, cfPct: +r.corsiPercentage, xgPct: +r.xGoalsPercentage }]),
    );
    const skaters: Record<string, { ixg?: number; gameScore?: number; xgPct?: number; cfPct?: number }> = {};
    for (const r of skaterRows) {
      if (r.team !== TEAM) continue;
      const s = (skaters[r.playerId] ??= {});
      if (r.situation === "all") {
        s.ixg = +r.I_F_xGoals;
        s.gameScore = +r.gameScore / Math.max(1, +r.games_played);
      } else if (r.situation === "5on5") {
        s.xgPct = +r.onIce_xGoalsPercentage;
        s.cfPct = +r.onIce_corsiPercentage;
      }
    }
    const goalies = Object.fromEntries(
      goalieRows
        .filter((r) => r.team === TEAM && r.situation === "all")
        .map((r) => [r.playerId, +r.xGoals - +r.goals]),
    );
    return { games, skaters, goalies };
  },
  ["leafs-moneypuck"],
  { revalidate: REVALIDATE, tags: [DATA_TAG] },
);

type Name = { default: string };
type NhlTeam = { abbrev: string; score?: number };
type NhlGame = {
  id: number; gameType: number; gameDate: string; gameState: string;
  homeTeam: NhlTeam; awayTeam: NhlTeam; gameOutcome?: { lastPeriodType: string };
};
type NhlSkater = {
  playerId: number; firstName: Name; lastName: Name; positionCode: string; gamesPlayed: number;
  goals: number; assists: number; points: number; plusMinus: number; shots: number; avgTimeOnIcePerGame: number;
};
type NhlGoalie = {
  playerId: number; firstName: Name; lastName: Name; gamesPlayed: number; wins: number; losses: number;
  overtimeLosses: number; savePercentage: number; goalsAgainstAverage: number;
};

export async function getLeafs(): Promise<Leafs> {
  const start = seasonStart();
  const id = `${start}${start + 1}`;

  const [sched, stats, standings, mp] = await Promise.all([
    fetchRemoteJson<{ games: NhlGame[] }>(`${NHL}/club-schedule-season/${TEAM}/${id}`, REVALIDATE, "NHL schedule"),
    fetchRemoteJson<{ skaters: NhlSkater[]; goalies: NhlGoalie[] }>(`${NHL}/club-stats/${TEAM}/${id}/2`, REVALIDATE, "NHL club stats"),
    fetchRemoteJson<{ standings: Record<string, unknown>[] }>(`${NHL}/standings/now`, REVALIDATE, "NHL standings"),
    // MoneyPuck is the extra layer; the page still works off NHL data if it's down
    getMoneyPuck(start).catch(() => ({ games: {}, skaters: {}, goalies: {} }) as Awaited<ReturnType<typeof getMoneyPuck>>),
  ]);

  const regular = sched.games.filter((g) => g.gameType === 2);
  const games: LeafsGame[] = regular
    .filter((g) => g.gameState === "OFF" || g.gameState === "FINAL")
    .map((g) => {
      const home = g.homeTeam.abbrev === TEAM;
      const [us, them] = home ? [g.homeTeam, g.awayTeam] : [g.awayTeam, g.homeTeam];
      const gf = us.score ?? 0;
      const ga = them.score ?? 0;
      const adv = mp.games[String(g.id)];
      return {
        id: g.id, date: g.gameDate, opp: them.abbrev, home, gf, ga,
        result: gf > ga ? "W" : g.gameOutcome?.lastPeriodType === "REG" ? "L" : "OTL",
        xgf: adv?.xgf ?? null, xga: adv?.xga ?? null, cfPct: adv?.cfPct ?? null, xgPct: adv?.xgPct ?? null,
      };
    });
  const upcoming = regular
    .filter((g) => g.gameState === "FUT" || g.gameState === "PRE")
    .slice(0, 5)
    .map((g) => {
      const home = g.homeTeam.abbrev === TEAM;
      return { date: g.gameDate, opp: (home ? g.awayTeam : g.homeTeam).abbrev, home };
    });

  const t = standings.standings.find((s) => (s.teamAbbrev as Name).default === TEAM) as Record<string, number & string> | undefined;
  const standing: LeafsStanding | null = t
    ? {
        gp: t.gamesPlayed, w: t.wins, l: t.losses, otl: t.otLosses, pts: t.points, pointPctg: t.pointPctg,
        gf: t.goalFor, ga: t.goalAgainst, divisionRank: t.divisionSequence, leagueRank: t.leagueSequence,
        streak: `${t.streakCode}${t.streakCount}`, l10: `${t.l10Wins}-${t.l10Losses}-${t.l10OtLosses}`,
      }
    : null;

  const skaters = stats.skaters
    .map((s) => {
      const adv = mp.skaters[String(s.playerId)] ?? {};
      return {
        id: s.playerId, name: `${s.firstName.default} ${s.lastName.default}`, pos: s.positionCode,
        gp: s.gamesPlayed, g: s.goals, a: s.assists, pts: s.points, plusMinus: s.plusMinus, shots: s.shots,
        toi: s.avgTimeOnIcePerGame, ixg: adv.ixg ?? null, gameScore: adv.gameScore ?? null,
        xgPct: adv.xgPct ?? null, cfPct: adv.cfPct ?? null,
      };
    })
    .sort((a, b) => b.pts - a.pts || b.g - a.g);

  const goalies = stats.goalies
    .map((g) => ({
      id: g.playerId, name: `${g.firstName.default} ${g.lastName.default}`, gp: g.gamesPlayed,
      w: g.wins, l: g.losses, otl: g.overtimeLosses, svPct: g.savePercentage, gaa: g.goalsAgainstAverage,
      gsax: mp.goalies[String(g.playerId)] ?? null,
    }))
    .sort((a, b) => b.gp - a.gp);

  return { season: `${start}-${String(start + 1).slice(2)}`, standing, games, upcoming, skaters, goalies };
}
