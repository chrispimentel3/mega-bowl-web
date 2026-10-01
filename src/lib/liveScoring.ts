/** Scores a fantasy week from ESPN's public NFL box scores, as it's played.
 *
 * Yahoo has no API this site can read live scores from, so /api/live does the league's
 * arithmetic itself: half-PPR on Yahoo's default rules (mega/config.py SCORING in
 * ff-dashboard), kickers by field-goal distance, defenses by points allowed and takeaways.
 * Starters, their NFL teams and projections come from data/web/live_setup.json, which
 * ff-dashboard's export writes each morning (mega/live_web.py).
 *
 * Pure functions only (no "@/" imports) so a plain `node` script can check them against a
 * finished week's real Yahoo totals.
 */

/** Must stay identical to `key()` in ff-dashboard's mega/live_web.py. */
export function liveKey(name: string): string {
  let s = name.toLowerCase().replace(/[.'’]/g, "").replace(/-/g, " ");
  s = s.replace(/[^a-z ]/g, " ");
  s = s.replace(/\b(jr|sr|ii|iii|iv|v)\b/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export const SCORING = {
  passYd: 0.04, passTd: 4, int: -1,
  rushYd: 0.1, rushTd: 6,
  rec: 0.5, recYd: 0.1, recTd: 6,
  fumLost: -2, twoPt: 2, retTd: 6,
  pat: 1,
  fgMiss: -1, // a missed PAT costs nothing (matched against week 3's Yahoo totals)
  // field goals by distance
  fg: (yds: number) => (yds >= 50 ? 5 : yds >= 40 ? 4 : 3),
  // defense
  sack: 1, defInt: 2, fumRec: 2, defTd: 6, safety: 2,
  pointsAllowed: (pa: number) =>
    pa === 0 ? 10 : pa <= 6 ? 7 : pa <= 13 ? 4 : pa <= 20 ? 1 : pa <= 27 ? 0 : pa <= 34 ? -1 : -4,
};

export type GameState = "pre" | "in" | "post";

export type NflGame = {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  state: GameState;
  detail: string; // "Final", "Q3 4:12", "Sun 1:00 PM"
  kickoff: string;
  /** share of regulation still to play, 0..1 */
  remaining: number;
};

export type Scored = { pts: number; line: string[] };

type Box = {
  boxscore?: {
    players?: {
      team: { abbreviation: string };
      statistics: { name: string; keys?: string[]; labels?: string[]; athletes: { athlete: { displayName: string }; stats: string[] }[] }[];
    }[];
    teams?: { team: { abbreviation: string }; statistics: { name: string; displayValue: string }[] }[];
  };
  scoringPlays?: { type?: { text?: string }; text?: string; team?: { abbreviation?: string } }[];
};

const num = (v: string | undefined) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

/** ESPN game state from a scoreboard event. */
export function parseEvent(ev: {
  id: string;
  date: string;
  status: { period?: number; clock?: number; type: { state: string; shortDetail?: string; detail?: string } };
  competitions: { competitors: { homeAway: string; score?: string; team: { abbreviation: string } }[] }[];
}): NflGame {
  const comp = ev.competitions[0].competitors;
  const home = comp.find((c) => c.homeAway === "home")!;
  const away = comp.find((c) => c.homeAway === "away")!;
  const state = (ev.status.type.state as GameState) ?? "pre";
  let remaining = state === "post" ? 0 : 1;
  if (state === "in") {
    const q = Math.min(ev.status.period ?? 1, 4);
    const clock = ev.status.clock ?? 900; // seconds left in the quarter
    remaining = (ev.status.period ?? 1) > 4 ? 0 : Math.max(0, ((4 - q) * 900 + clock) / 3600);
  }
  return {
    id: ev.id,
    home: home.team.abbreviation,
    away: away.team.abbreviation,
    homeScore: num(home.score),
    awayScore: num(away.score),
    state,
    detail: ev.status.type.shortDetail ?? ev.status.type.detail ?? "",
    kickoff: ev.date,
    remaining,
  };
}

/** Every offensive player, kicker and defense in one game's box score -> fantasy points,
 *  keyed by liveKey(name) and "DEF:<abbr>". */
export function scoreBox(box: Box, game: NflGame): Map<string, Scored & { team: string }> {
  const out = new Map<string, Scored & { team: string }>();
  const add = (k: string, team: string, pts: number, label: string) => {
    const cur = out.get(k) ?? { pts: 0, line: [], team };
    cur.pts += pts;
    if (label) cur.line.push(label);
    out.set(k, cur);
  };
  const teamsInGame = [game.home, game.away];
  const defense: Record<string, { sacks: number; ints: number; tds: number; safeties: number }> = {};
  for (const t of teamsInGame) defense[t] = { sacks: 0, ints: 0, tds: 0, safeties: 0 };

  for (const side of box.boxscore?.players ?? []) {
    const team = side.team.abbreviation;
    for (const cat of side.statistics) {
      const keys = cat.keys ?? [];
      for (const a of cat.athletes) {
        const k = liveKey(a.athlete.displayName);
        const v = (key: string) => a.stats[keys.indexOf(key)];
        if (cat.name === "passing") {
          const yds = num(v("passingYards")), td = num(v("passingTouchdowns")), int = num(v("interceptions"));
          add(k, team, yds * SCORING.passYd + td * SCORING.passTd + int * SCORING.int,
            `${yds} pass yd${td ? `, ${td} TD` : ""}${int ? `, ${int} INT` : ""}`);
        } else if (cat.name === "rushing") {
          const yds = num(v("rushingYards")), td = num(v("rushingTouchdowns"));
          add(k, team, yds * SCORING.rushYd + td * SCORING.rushTd, `${yds} rush yd${td ? `, ${td} TD` : ""}`);
        } else if (cat.name === "receiving") {
          const rec = num(v("receptions")), yds = num(v("receivingYards")), td = num(v("receivingTouchdowns"));
          add(k, team, rec * SCORING.rec + yds * SCORING.recYd + td * SCORING.recTd,
            `${rec} rec, ${yds} yd${td ? `, ${td} TD` : ""}`);
        } else if (cat.name === "fumbles") {
          const lost = num(v("fumblesLost"));
          if (lost) add(k, team, lost * SCORING.fumLost, `${lost} fum lost`);
        } else if (cat.name === "kickReturns" || cat.name === "puntReturns") {
          const td = num(v(cat.name === "kickReturns" ? "kickReturnTouchdowns" : "puntReturnTouchdowns"));
          if (td) add(k, team, td * SCORING.retTd, `${td} return TD`);
        } else if (cat.name === "kicking") {
          const [xpm] = (v("extraPointsMade/extraPointAttempts") ?? "0/0").split("/");
          if (num(xpm)) add(k, team, num(xpm) * SCORING.pat, `${num(xpm)} PAT`);
          const [fgm, fga] = (v("fieldGoalsMade/fieldGoalAttempts") ?? "0/0").split("/");
          const missed = num(fga) - num(fgm);
          if (missed > 0) add(k, team, missed * SCORING.fgMiss, `${missed} FG missed`);
        } else if (cat.name === "defensive") {
          if (defense[team]) defense[team].sacks += num(v("sacks"));
        } else if (cat.name === "interceptions") {
          if (defense[team]) defense[team].ints += num(v("interceptions"));
        }
      }
    }
  }

  // what only the play-by-play text says: field-goal distances, two-point conversions,
  // defensive and return touchdowns, safeties
  for (const p of box.scoringPlays ?? []) {
    const text = p.text ?? "", type = p.type?.text ?? "", team = p.team?.abbreviation ?? "";
    const fg = /^(.+?) (\d+) Yd Field Goal/.exec(text);
    if (type.startsWith("Field Goal") && fg) {
      const yds = parseInt(fg[2], 10);
      add(liveKey(fg[1]), team, SCORING.fg(yds), `${yds}-yd FG`);
    }
    const pass2 = /\((.+?) Pass to (.+?) for Two-Point Conversion\)/.exec(text);
    if (pass2) {
      add(liveKey(pass2[1]), team, SCORING.twoPt, "2-pt pass");
      add(liveKey(pass2[2]), team, SCORING.twoPt, "2-pt catch");
    }
    const run2 = /\((.+?) (?:Run|Rush) for Two-Point Conversion\)/.exec(text);
    if (run2) add(liveKey(run2[1]), team, SCORING.twoPt, "2-pt run");
    if (defense[team]) {
      if (/(Interception|Fumble|Blocked .*|Kickoff|Punt) Return Touchdown|Fumble Recovery Touchdown|Blocked .* Touchdown/.test(type)) {
        defense[team].tds += 1;
      }
      if (/Safety/i.test(type)) defense[team].safeties += 1;
    }
  }

  const fumblesLostBy: Record<string, number> = {};
  for (const t of box.boxscore?.teams ?? []) {
    const fl = t.statistics.find((s) => s.name === "fumblesLost");
    fumblesLostBy[t.team.abbreviation] = num(fl?.displayValue);
  }
  for (const t of teamsInGame) {
    const opp = t === game.home ? game.away : game.home;
    const pa = t === game.home ? game.awayScore : game.homeScore;
    const d = defense[t];
    const fr = fumblesLostBy[opp] ?? 0;
    const pts = SCORING.pointsAllowed(pa) + d.sacks * SCORING.sack + d.ints * SCORING.defInt
      + fr * SCORING.fumRec + d.tds * SCORING.defTd + d.safeties * SCORING.safety;
    out.set(`DEF:${t}`, {
      pts, team: t,
      line: [`${pa} pts allowed`, `${d.sacks} sk`, `${d.ints} INT`, `${fr} FR`, ...(d.tds ? [`${d.tds} TD`] : [])],
    });
  }
  for (const v of out.values()) v.pts = Math.round(v.pts * 100) / 100;
  return out;
}

export type SetupStarter = {
  slot: string;
  player: string | null;
  key: string | null;
  nfl_team: string | null;
  proj: number;
  proj_avg?: boolean;
};

export type LiveSetup = {
  available: boolean;
  reason?: string;
  season: number;
  week: number;
  my_team: string;
  matchups: [string, string][];
  teams: Record<string, SetupStarter[]>;
};

export type LiveStarter = SetupStarter & {
  pts: number;
  state: GameState | "bye" | "unknown";
  detail: string;
  line: string;
  projFinal: number;
};

export type LiveTeam = {
  team: string;
  pts: number;
  projFinal: number;
  toPlay: number;
  playing: number;
  starters: LiveStarter[];
};

/** Each team's starters scored against every game played or under way. A starter whose
 *  game hasn't started counts his projection toward the projected final; one in a game
 *  under way counts his points so far plus the unplayed share of his projection. */
export function scoreTeams(setup: LiveSetup, games: NflGame[], scored: Map<string, Scored & { team: string }>): LiveTeam[] {
  const gameOf = new Map<string, NflGame>();
  for (const g of games) {
    gameOf.set(g.home, g);
    gameOf.set(g.away, g);
  }
  return Object.entries(setup.teams).map(([team, starters]) => {
    const rows: LiveStarter[] = starters.map((s) => {
      const g = s.nfl_team ? gameOf.get(s.nfl_team) : undefined;
      const hit = s.key ? scored.get(s.key) : undefined;
      // a box-score name can belong to two players; trust it only if the team agrees
      const mine = hit && (!s.nfl_team || hit.team === s.nfl_team) ? hit : undefined;
      const state: LiveStarter["state"] = !s.player ? "unknown" : g ? g.state : s.nfl_team ? "bye" : (mine ? "post" : "unknown");
      const pts = mine && state !== "pre" ? mine.pts : 0;
      const remaining = g ? g.remaining : 0;
      const projFinal = state === "pre" ? s.proj : state === "in" ? pts + s.proj * remaining : pts;
      return {
        ...s, pts, state,
        detail: g ? g.detail : state === "bye" ? "bye" : "",
        line: mine ? mine.line.join(", ") : "",
        projFinal: Math.round(projFinal * 100) / 100,
      };
    });
    const sum = (f: (r: LiveStarter) => number) => Math.round(rows.reduce((a, r) => a + f(r), 0) * 100) / 100;
    return {
      team,
      pts: sum((r) => r.pts),
      projFinal: sum((r) => r.projFinal),
      toPlay: rows.filter((r) => r.state === "pre").length,
      playing: rows.filter((r) => r.state === "in").length,
      starters: rows,
    };
  });
}
