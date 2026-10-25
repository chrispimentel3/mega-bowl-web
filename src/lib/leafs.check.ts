// run: npx tsx src/lib/leafs.check.ts
import assert from "node:assert";
import { getLeafs, rolling, parseCsv, currentSeason, context } from "./leafs";

assert.deepEqual(rolling([1, null, 3], 2), [1, 1, 3]);
assert.deepEqual(parseCsv("a,b\n1,2\n"), [{ a: "1", b: "2" }]);
assert.deepEqual(context([3, 1, 2], (v) => v === 2, (v) => v), { value: 2, avg: 2, rank: 2, of: 3 });
assert.equal(context([3, 1, 2], (v) => v === 2, (v) => v, true)!.rank, 2);
assert.equal(context([3, 1], (v) => v === 9, (v) => v), null);
assert.equal(currentSeason(new Date("2026-10-25")).nhl, "20262027");
assert.equal(currentSeason(new Date("2027-03-01")).nhl, "20262027");

const g = (id: number, home: string, hs: number, away: string, as: number, ot = "REG", st = "OFF") =>
  ({ id, gameType: 2, gameDate: `2026-10-0${id}`, gameState: st, homeTeam: { abbrev: home, score: hs }, awayTeam: { abbrev: away, score: as }, gameOutcome: { lastPeriodType: ot } });
const n = (f: string, l: string) => ({ firstName: { default: f }, lastName: { default: l } });
globalThis.fetch = (async (url: string) => {
  const body = url.includes("club-schedule") ? { games: [g(1, "TOR", 4, "MTL", 1), g(2, "BOS", 3, "TOR", 2, "OT"), g(3, "TOR", 1, "OTT", 2), g(4, "TOR", 0, "NYR", 0, "REG", "FUT")] }
    : url.includes("club-stats") ? { skaters: [{ playerId: 1, ...n("Auston", "Matthews"), positionCode: "C", gamesPlayed: 3, goals: 3, assists: 1, points: 4, plusMinus: 2, powerPlayGoals: 1, shots: 12, avgTimeOnIcePerGame: 1250 }], goalies: [{ playerId: 2, ...n("Joseph", "Woll"), gamesPlayed: 3, wins: 1, losses: 1, overtimeLosses: 1, goalsAgainstAverage: 2.0, savePercentage: 0.915, shutouts: 0 }] }
    : url.includes("team/summary") ? { data: [{ teamId: 10, pointPct: 0.6, goalsForPerGame: 3.5 }, { teamId: 6, pointPct: 0.7, goalsForPerGame: 2.5 }] }
    : url.includes("skater/summary") ? { data: [{ playerId: 1, positionCode: "C", points: 4 }, { playerId: 5, positionCode: "L", points: 9 }, { playerId: 6, positionCode: "D", points: 20 }] }
    : url.includes("goalie/summary") ? { data: [{ saves: 90, shotsAgainst: 100, goalsAgainst: 10, timeOnIce: 18000 }] }
    : url.includes("game-log") ? { gameLog: [{ gameDate: "2026-10-01", goals: 2, points: 3 }, { gameDate: "2026-10-03", goals: 1, points: 1 }] }
    : null;
  if (url.includes("seasonSummary")) return new Response("team,situation,xGoalsPercentage,corsiPercentage,xGoalsFor,xGoalsAgainst,iceTime\nTOR,5on5,0.55,0.52,30,25,36000\nBOS,5on5,0.45,0.48,25,30,36000\n");
  if (url.includes("moneypuck")) return new Response("season,gameId,situation,xGoalsPercentage,corsiPercentage\n2026,1,5on5,0.6,0.55\n2026,1,all,0.1,0.1\n2025,2,5on5,0.9,0.9\n");
  return new Response(JSON.stringify(body));
}) as typeof fetch;

getLeafs().then((d) => {
assert.deepEqual(d.games.map((x) => x.result), ["W", "OTL", "L"]);
assert.deepEqual(d.record, { w: 1, l: 1, otl: 1, pts: 3, ptsPct: 0.5, gf: 7, ga: 6 });
assert.equal(d.games[1].opp, "BOS"); assert.equal(d.games[1].home, false);
assert.equal(d.games[0].xgPct, 0.6); assert.equal(d.games[1].xgPct, null);
assert.equal(d.upcoming[0].opp, "NYR");
assert.equal(d.form[0].lastP, 4);
assert.equal(d.trend[1]["Goals %"], (0.8 + 0.4) / 2);
const t = Object.fromEntries(d.team.map((x) => [x.label, x.ctx]));
assert.equal(t["Points %"].rank, 2); assert.ok(Math.abs(t["Points %"].avg - 0.65) < 1e-9);
assert.equal(t["xGoals % (5v5)"].rank, 1);
assert.equal(t["xGoals against / 60 (5v5)"].rank, 1); // 2.5/60 beats 3.0/60
assert.equal(d.skaters[0].rank!.rank, 2); assert.equal(d.skaters[0].rank!.of, 2); // among forwards only
assert.equal(d.lgGoalie!.svPct, 0.9); assert.equal(d.lgGoalie!.gaa, 2);
console.log("leafs ok");
});
