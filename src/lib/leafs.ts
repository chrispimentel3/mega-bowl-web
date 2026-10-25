import { DATA_TAG } from "./fetchRemoteJson";

const TEAM = "TOR";
const NHL = "https://api-web.nhle.com/v1";
// every TOR game MoneyPuck has (all seasons, one row per situation); filtered to this season below
const MONEYPUCK = `https://moneypuck.com/moneypuck/playerData/careers/gameByGame/regular/teams/${TEAM}.csv`;
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
};
export type Goalie = { id: number; name: string; gp: number; w: number; l: number; otl: number; gaa: number; svPct: number; so: number };
export type Form = { id: number; name: string; seasonPpg: number; lastGp: number; lastP: number; lastG: number; lastPpg: number };

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

/** Mean of the last `n` values ending at each index (skipping nulls); null until any exist. */
export function rolling(values: (number | null)[], n = ROLL): (number | null)[] {
  return values.map((_, i) => {
    const w = values.slice(Math.max(0, i - n + 1), i + 1).filter((v): v is number => v != null);
    return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
  });
}

export async function getLeafs() {
  const season = currentSeason();
  const [sched, stats, mp] = await Promise.all([
    get(`${NHL}/club-schedule-season/${TEAM}/${season.nhl}`, "json") as Promise<{ games: NhlGame[] }>,
    get(`${NHL}/club-stats/${TEAM}/${season.nhl}/2`, "json") as Promise<{ skaters: any[]; goalies: any[] }>, // eslint-disable-line @typescript-eslint/no-explicit-any
    moneypuck(season.moneypuck),
  ]);

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

  const skaters: Skater[] = stats.skaters.map((s) => ({
    id: s.playerId, name: name(s), pos: s.positionCode, gp: s.gamesPlayed, g: s.goals, a: s.assists, p: s.points,
    pm: s.plusMinus, ppg: s.powerPlayGoals, shots: s.shots, toi: s.avgTimeOnIcePerGame,
  })).sort((a, b) => b.p - a.p || b.g - a.g);
  const goalies: Goalie[] = stats.goalies.map((g) => ({
    id: g.playerId, name: name(g), gp: g.gamesPlayed, w: g.wins, l: g.losses, otl: g.overtimeLosses,
    gaa: g.goalsAgainstAverage, svPct: g.savePercentage, so: g.shutouts,
  })).sort((a, b) => b.gp - a.gp);

  // recent form for the top scorers: last ROLL games they played vs their season pace
  const form: Form[] = await Promise.all(
    skaters.filter((s) => s.gp > 0).slice(0, 8).map(async (s) => {
      try {
        const log = ((await get(`${NHL}/player/${s.id}/game-log/${season.nhl}/2`, "json")) as {
          gameLog: { gameDate: string; goals: number; points: number }[];
        }).gameLog;
        const last = [...log].sort((a, b) => b.gameDate.localeCompare(a.gameDate)).slice(0, ROLL);
        const lastP = last.reduce((t, g) => t + g.points, 0);
        return { id: s.id, name: s.name, seasonPpg: s.p / s.gp, lastGp: last.length, lastP,
          lastG: last.reduce((t, g) => t + g.goals, 0), lastPpg: last.length ? lastP / last.length : 0 };
      } catch {
        return { id: s.id, name: s.name, seasonPpg: s.p / s.gp, lastGp: 0, lastP: 0, lastG: 0, lastPpg: 0 };
      }
    }),
  );

  const w = games.filter((g) => g.result === "W").length;
  const l = games.filter((g) => g.result === "L").length;
  const otl = games.length - w - l;
  const gfPct = games.map((g) => (g.gf + g.ga ? g.gf / (g.gf + g.ga) : 0.5));
  const [rGf, rXg, rCf] = [rolling(gfPct), rolling(games.map((g) => g.xgPct)), rolling(games.map((g) => g.cfPct))];
  const trend = games.map((g, i) => ({
    game: `${i + 1}`, "Goals %": rGf[i], "xGoals % (5v5)": rXg[i], "Corsi % (5v5)": rCf[i],
  }));

  return {
    season, games, upcoming, skaters, goalies, form, trend,
    hasMoneyPuck: games.some((g) => g.xgPct != null),
    record: { w, l, otl, pts: 2 * w + otl, ptsPct: games.length ? (2 * w + otl) / (2 * games.length) : 0,
      gf: games.reduce((t, g) => t + g.gf, 0), ga: games.reduce((t, g) => t + g.ga, 0) },
  };
}
