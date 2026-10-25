import { DATA_TAG } from "./fetchRemoteJson";

const TEAM = "TOR";
const NHL = "https://api-web.nhle.com/v1";
// every TOR game MoneyPuck has (all seasons, one row per situation); filtered to this season below
const MONEYPUCK = `https://moneypuck.com/moneypuck/playerData/careers/gameByGame/regular/teams/${TEAM}.csv`;
// every team's and player's season totals, for league averages and ranks
const STATS = "https://api.nhle.com/stats/rest/en";
const LEAFS_ID = 10;
export const ROLL = 10;
const REVALIDATE = 3600;

/** NHL seasons start in October; July onward counts as the next season. */
export function currentSeason(now = new Date()) {
  const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return { nhl: `${y}${y + 1}`, moneypuck: y, label: `${y}–${String(y + 1).slice(2)}` };
}

async function get(url: string, kind: "json" | "text") {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE, tags: [DATA_TAG] },
    headers: { "User-Agent": "Mozilla/5.0 (personal Leafs dashboard)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return kind === "json" ? res.json() : res.text();
}

type NhlGame = {
  id: number;
  gameType: number;
  gameDate: string;
  gameState: string;
  homeTeam: { abbrev: string; score?: number };
  awayTeam: { abbrev: string; score?: number };
  gameOutcome?: { lastPeriodType: string };
};

export type Game = {
  id: number;
  date: string;
  opp: string;
  home: boolean;
  gf: number;
  ga: number;
  /** W, L, OTL (lost in OT/SO) */
  result: "W" | "L" | "OTL";
  ot: string;
  /** MoneyPuck 5v5, null if MoneyPuck hasn't posted the game (or is unreachable) */
  xgPct: number | null;
  cfPct: number | null;
};

export type Skater = {
  id: number; name: string; pos: string; gp: number; g: number; a: number; p: number;
  pm: number; ppg: number; shots: number; toi: number;
  /** points rank among all NHL forwards (or defensemen), null if the league table is unavailable */
  rank: Ctx | null;
};
export type Goalie = { id: number; name: string; gp: number; w: number; l: number; otl: number; gaa: number; svPct: number; so: number };
export type Form = {
  id: number; name: string; pos: string; seasonPpg: number; lastGp: number; lastP: number; lastG: number; lastPpg: number;
  /** points in each of the last ROLL games, oldest first */
  last: number[]; rank: Ctx | null;
};
/** one row of the NHL standings */
export type Standing = {
  team: string; name: string; division: string; gp: number; w: number; l: number; otl: number;
  pts: number; ptsPct: number; gd: number; rank: number;
};
/** the average NHL regular at a position (played at least half the games so far) */
export type RefSkater = { name: string; gp: number; g: number; a: number; p: number; ppg: number; pm: number; toi: number };

const isD = (pos: string) => pos === "D";
const name = (p: { firstName: { default: string }; lastName: { default: string } }) =>
  `${p.firstName.default} ${p.lastName.default}`;

/** CSV row -> object keyed by header. ponytail: naive comma split, fine for MoneyPuck's unquoted numeric CSV. */
export function parseCsv(text: string) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));
}

/** MoneyPuck 5v5 xG% / Corsi% by NHL game id. */
async function moneypuck(season: number): Promise<Map<number, { xg: number; cf: number }>> {
  try {
    const rows = parseCsv((await get(MONEYPUCK, "text")) as string);
    return new Map(
      rows
        .filter((r) => r.season === String(season) && r.situation === "5on5")
        .map((r) => [Number(r.gameId), { xg: Number(r.xGoalsPercentage), cf: Number(r.corsiPercentage) }]),
    );
  } catch {
    return new Map(); // dashboard still works off NHL data alone
  }
}

/** Leafs' value, league average and rank (1 = best) for one metric across all teams/players. */
export type Ctx = { value: number; avg: number; rank: number; of: number };
export function context<T>(rows: T[], isUs: (r: T) => boolean, get: (r: T) => number, lowerIsBetter = false): Ctx | null {
  const us = rows.find(isUs);
  if (!us) return null;
  const value = get(us);
  const vals = rows.map(get);
  return {
    value,
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    rank: 1 + vals.filter((v) => (lowerIsBetter ? v < value : v > value)).length,
    of: vals.length,
  };
}

export type TeamCtx = { label: string; ctx: Ctx; fmt: "pct" | "num" };

type TeamRow = {
  teamId: number; pointPct: number; goalsForPerGame: number; goalsAgainstPerGame: number;
  shotsForPerGame: number; shotsAgainstPerGame: number; powerPlayPct: number; penaltyKillPct: number; faceoffWinPct: number;
};
type SkaterRow = {
  playerId: number; positionCode: string; points: number; goals: number; assists: number;
  gamesPlayed: number; plusMinus: number; timeOnIcePerGame: number;
};
type StandingRow = {
  teamAbbrev: { default: string }; placeName?: { default: string }; teamName: { default: string }; divisionName: string;
  gamesPlayed: number; wins: number; losses: number; otLosses: number; points: number; pointPctg: number; goalDifferential: number;
};
type GoalieRow = { saves: number; shotsAgainst: number; goalsAgainst: number; timeOnIce: number };

const stats = <T>(path: string, nhlSeason: string) =>
  get(`${STATS}/${path}?limit=-1&cayenneExp=${encodeURIComponent(`seasonId=${nhlSeason} and gameTypeId=2`)}`, "json")
    .then((r) => (r as { data: T[] }).data)
    .catch(() => [] as T[]); // no league context beats no page

/** Leafs vs the other 31 teams: NHL team summary plus MoneyPuck's 5v5 season numbers. */
async function teamContext(nhlSeason: string, mpSeason: number): Promise<TeamCtx[]> {
  const [teams, mp] = await Promise.all([
    stats<TeamRow>("team/summary", nhlSeason),
    get(`https://moneypuck.com/moneypuck/playerData/seasonSummary/${mpSeason}/regular/teams.csv`, "text")
      .then((t) => parseCsv(t as string).filter((r) => r.situation === "5on5"))
      .catch(() => []),
  ]);
  const us = (r: TeamRow) => r.teamId === LEAFS_ID;
  const mpUs = (r: Record<string, string>) => r.team === TEAM;
  const per60 = (k: string) => (r: Record<string, string>) => (Number(r[k]) * 3600) / Number(r.iceTime);
  const rows: [string, Ctx | null, "pct" | "num"][] = [
    ["Points %", context(teams, us, (r) => r.pointPct), "pct"],
    ["Goals for / game", context(teams, us, (r) => r.goalsForPerGame), "num"],
    ["Goals against / game", context(teams, us, (r) => r.goalsAgainstPerGame, true), "num"],
    ["Shots for / game", context(teams, us, (r) => r.shotsForPerGame), "num"],
    ["Shots against / game", context(teams, us, (r) => r.shotsAgainstPerGame, true), "num"],
    ["Power play %", context(teams, us, (r) => r.powerPlayPct), "pct"],
    ["Penalty kill %", context(teams, us, (r) => r.penaltyKillPct), "pct"],
    ["Faceoff %", context(teams, us, (r) => r.faceoffWinPct), "pct"],
    ["xGoals % (5v5)", context(mp, mpUs, (r) => Number(r.xGoalsPercentage)), "pct"],
    ["Corsi % (5v5)", context(mp, mpUs, (r) => Number(r.corsiPercentage)), "pct"],
    ["xGoals for / 60 (5v5)", context(mp, mpUs, per60("xGoalsFor")), "num"],
    ["xGoals against / 60 (5v5)", context(mp, mpUs, per60("xGoalsAgainst"), true), "num"],
  ];
  return rows.filter((r): r is [string, Ctx, "pct" | "num"] => r[1] != null).map(([label, ctx, fmt]) => ({ label, ctx, fmt }));
}

/** Mean of the last `n` values ending at each index (skipping nulls); null until any exist. */
export function rolling(values: (number | null)[], n = ROLL): (number | null)[] {
  return values.map((_, i) => {
    const w = values.slice(Math.max(0, i - n + 1), i + 1).filter((v): v is number => v != null);
    return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
  });
}

export async function getLeafs() {
  const season = currentSeason();
  const [sched, club, mp, team, lgSkaters, lgGoalies, standRows] = await Promise.all([
    get(`${NHL}/club-schedule-season/${TEAM}/${season.nhl}`, "json") as Promise<{ games: NhlGame[] }>,
    get(`${NHL}/club-stats/${TEAM}/${season.nhl}/2`, "json") as Promise<{ skaters: any[]; goalies: any[] }>, // eslint-disable-line @typescript-eslint/no-explicit-any
    moneypuck(season.moneypuck),
    teamContext(season.nhl, season.moneypuck),
    stats<SkaterRow>("skater/summary", season.nhl),
    stats<GoalieRow>("goalie/summary", season.nhl),
    get(`${NHL}/standings/now`, "json").then((r) => (r as { standings: StandingRow[] }).standings).catch(() => [] as StandingRow[]),
  ]);

  // ordered like the NHL does it: points %, then points
  const standings: Standing[] = standRows
    .map((r) => ({
      team: r.teamAbbrev.default, name: r.placeName?.default ?? r.teamName.default, division: r.divisionName,
      gp: r.gamesPlayed, w: r.wins, l: r.losses, otl: r.otLosses, pts: r.points, ptsPct: r.pointPctg, gd: r.goalDifferential, rank: 0,
    }))
    .sort((a, b) => b.ptsPct - a.ptsPct || b.pts - a.pts)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const regular = sched.games.filter((g) => g.gameType === 2);
  const games: Game[] = regular
    .filter((g) => g.gameState === "OFF" || g.gameState === "FINAL")
    .map((g) => {
      const home = g.homeTeam.abbrev === TEAM;
      const [us, them] = home ? [g.homeTeam, g.awayTeam] : [g.awayTeam, g.homeTeam];
      const gf = us.score ?? 0, ga = them.score ?? 0;
      const ot = g.gameOutcome?.lastPeriodType ?? "REG";
      const m = mp.get(g.id);
      return {
        id: g.id, date: g.gameDate, opp: them.abbrev, home, gf, ga, ot: ot === "REG" ? "" : ot,
        result: gf > ga ? "W" : ot === "REG" ? "L" : "OTL",
        xgPct: m?.xg ?? null, cfPct: m?.cf ?? null,
      };
    });
  const upcoming = regular.filter((g) => g.gameState === "FUT" || g.gameState === "PRE").slice(0, 5).map((g) => ({
    id: g.id, date: g.gameDate, home: g.homeTeam.abbrev === TEAM,
    opp: g.homeTeam.abbrev === TEAM ? g.awayTeam.abbrev : g.homeTeam.abbrev,
  }));

  const skaters: Skater[] = club.skaters.map((s) => ({
    id: s.playerId, name: name(s), pos: s.positionCode, gp: s.gamesPlayed, g: s.goals, a: s.assists, p: s.points,
    pm: s.plusMinus, ppg: s.powerPlayGoals, shots: s.shots, toi: s.avgTimeOnIcePerGame,
    rank: context(lgSkaters.filter((r) => isD(r.positionCode) === isD(s.positionCode)), (r) => r.playerId === s.playerId, (r) => r.points),
  })).sort((a, b) => b.p - a.p || b.g - a.g);
  const goalies: Goalie[] = club.goalies.map((g) => ({
    id: g.playerId, name: name(g), gp: g.gamesPlayed, w: g.wins, l: g.losses, otl: g.overtimeLosses,
    gaa: g.goalsAgainstAverage, svPct: g.savePercentage, so: g.shutouts,
  })).sort((a, b) => b.gp - a.gp);

  const base = (s: Skater) => ({ id: s.id, name: s.name, pos: s.pos, seasonPpg: s.p / s.gp, rank: s.rank });
  // recent form for the top scorers: last ROLL games they played vs their season pace
  const form: Form[] = await Promise.all(
    skaters.filter((s) => s.gp > 0).slice(0, 8).map(async (s) => {
      try {
        const log = ((await get(`${NHL}/player/${s.id}/game-log/${season.nhl}/2`, "json")) as {
          gameLog: { gameDate: string; goals: number; points: number }[];
        }).gameLog;
        const last = [...log].sort((a, b) => a.gameDate.localeCompare(b.gameDate)).slice(-ROLL);
        const lastP = last.reduce((t, g) => t + g.points, 0);
        return { ...base(s), lastGp: last.length, lastP, last: last.map((g) => g.points),
          lastG: last.reduce((t, g) => t + g.goals, 0), lastPpg: last.length ? lastP / last.length : 0 };
      } catch {
        return { ...base(s), lastGp: 0, lastP: 0, lastG: 0, lastPpg: 0, last: [] };
      }
    }),
  );

  const w = games.filter((g) => g.result === "W").length;
  const l = games.filter((g) => g.result === "L").length;
  const otl = games.length - w - l;
  const gfPct = games.map((g) => (g.gf + g.ga ? g.gf / (g.gf + g.ga) : 0.5));
  const [rGf, rXg, rCf] = [rolling(gfPct), rolling(games.map((g) => g.xgPct)), rolling(games.map((g) => g.cfPct))];
  const trend = { goals: rGf, xg: rXg, cf: rCf, gf: rolling(games.map((g) => g.gf)), ga: rolling(games.map((g) => g.ga)) };

  const sum = (k: keyof GoalieRow) => lgGoalies.reduce((t, g) => t + g[k], 0);
  const lgGoalie = lgGoalies.length
    ? { svPct: sum("saves") / sum("shotsAgainst"), gaa: (sum("goalsAgainst") * 3600) / sum("timeOnIce") }
    : null;

  // average NHL regular at forward / defense, so player lines have something to sit next to
  const maxGp = Math.max(0, ...lgSkaters.map((r) => r.gamesPlayed));
  const refSkaters: RefSkater[] = [false, true].flatMap((d) => {
    const rows = lgSkaters.filter((r) => isD(r.positionCode) === d && r.gamesPlayed >= Math.max(1, maxGp / 2));
    if (!rows.length) return [];
    const avg = (f: (r: SkaterRow) => number) => rows.reduce((t, r) => t + f(r), 0) / rows.length;
    const [gp, g, a] = [avg((r) => r.gamesPlayed), avg((r) => r.goals), avg((r) => r.assists)];
    return [{ name: `NHL avg ${d ? "defenseman" : "forward"}`, gp, g, a, p: g + a, ppg: (g + a) / gp, pm: avg((r) => r.plusMinus), toi: avg((r) => r.timeOnIcePerGame) }];
  });

  return {
    season, games, team, lgGoalie, standings, refSkaters, upcoming, skaters, goalies, form, trend,
    hasMoneyPuck: games.some((g) => g.xgPct != null),
    record: { w, l, otl, pts: 2 * w + otl, ptsPct: games.length ? (2 * w + otl) / (2 * games.length) : 0,
      gf: games.reduce((t, g) => t + g.gf, 0), ga: games.reduce((t, g) => t + g.ga, 0) },
  };
}
