import { context, getLeafs, ROLL, type Ctx, type Standing } from "@/lib/leafs";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { NhlLogo, SkaterTable, TrendChart } from "./LeafsClient";
import { clamp, day, ord, pct, resultText, resultTone, signed, tier } from "./fmt";
import "./leafs.css";

export const revalidate = 3600;

const TEAM = "TOR";

function Kpi({ label, value, chip, good, sub, meter }: {
  label: string; value: string; chip: string; good: boolean | null; sub: string;
  meter?: { v: number; avg: number; lo: number; hi: number };
}) {
  const at = (v: number) => `${clamp((v - meter!.lo) / (meter!.hi - meter!.lo), 0, 1) * 100}%`;
  return (
    <div className="card kpi">
      <div className="lbl">{label}</div>
      <div className="val num">{value}</div>
      <div className="ctx num"><span className={`chip ${good == null ? "mid" : good ? "good" : "bad"}`}>{chip}</span>{sub}</div>
      {meter ? <div className="meter" title="Leafs vs NHL average"><i style={{ width: at(meter.v) }} /><b style={{ left: at(meter.avg) }} /></div> : null}
    </div>
  );
}

function StandingsTable({ title, rows, extra }: { title: string; rows: Standing[]; extra?: React.ReactNode }) {
  return (
    <div className="card tbl-wrap">
      <table>
        <thead><tr><th>{title}</th><th>GP</th><th>Record</th><th>Pts</th><th>Pts %</th><th>GD</th></tr></thead>
        <tbody className="num">
          {rows.map((r) => (
            <tr key={r.team} className={r.team === TEAM ? "me" : ""}>
              <td><span className="team"><NhlLogo team={r.team} size={22} />{r.name}</span></td>
              <td>{r.gp}</td><td>{r.w}-{r.l}-{r.otl}</td><td><b>{r.pts}</b></td><td>{pct(r.ptsPct)}</td><td>{signed(r.gd)}</td>
            </tr>
          ))}
          {extra}
        </tbody>
      </table>
    </div>
  );
}

export default async function LeafsPage() {
  const [d, ab] = await Promise.all([getLeafs().catch(() => null), getActionBoard()]);
  const masthead = <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />;
  if (!d) {
    return (
      <>
        {masthead}
        <main className="lf"><div className="wrap"><p className="lede" style={{ paddingTop: 24 }}>Couldn&apos;t reach the NHL API. Try again in a bit.</p></div></main>
      </>
    );
  }

  const { record: r, games, standings } = d;
  const gp = games.length;
  const ctx = Object.fromEntries(d.team.map((t) => [t.label, t.ctx])) as Record<string, Ctx | undefined>;
  const me = standings.find((s) => s.team === TEAM);
  const ptsCtx = ctx["Points %"] ?? context(standings, (s) => s.team === TEAM, (s) => s.ptsPct) ?? undefined;
  const gdCtx = context(standings, (s) => s.team === TEAM, (s) => s.gd);
  const rank = me?.rank ?? ptsCtx?.rank;
  const pace = gp ? Math.round((r.pts / gp) * 82) : 0;
  const avgPace = ptsCtx ? Math.round(ptsCtx.avg * 164) : null;
  const last10 = games.slice(-ROLL);
  const n10 = (res: string) => last10.filter((g) => g.result === res).length;
  const l10Pct = last10.length ? (2 * n10("W") + n10("OTL")) / (2 * last10.length) : 0;
  const gfCtx = ctx["Goals for / game"], gaCtx = ctx["Goals against / game"];
  const lgGpg = gfCtx && gaCtx ? (gfCtx.avg + gaCtx.avg) / 2 : null;
  const division = me ? standings.filter((s) => s.division === me.division) : [];
  const top6 = standings.slice(0, 6);
  const fmtCtx = (v: number, f: "pct" | "num") => (f === "pct" ? pct(v) : v.toFixed(2));
  const pctKpi = (label: string, lo: number, hi: number) => {
    const c = ctx[label];
    return c ? <Kpi label={label} value={pct(c.value)} chip={`${ord(c.rank)} in NHL`} good={c.rank <= c.of / 2} sub={`NHL avg ${pct(c.avg)}`} meter={{ v: c.value, avg: c.avg, lo, hi }} /> : null;
  };

  return (
    <>
      {masthead}
      <main className="lf">
        <div className="wrap">
          <div className="hero">
            <NhlLogo team={TEAM} size={84} />
            <div>
              <div className="eyebrow">{d.season.label} Regular season</div>
              <h1>Toronto Maple Leafs</h1>
              <p className="num">
                {gp ? <>{r.w}-{r.l}-{r.otl} · {r.pts} points{rank ? ` · ${ord(rank)} in the NHL` : ""} · on pace for {pace}</> : "No regular-season games played yet."}
              </p>
            </div>
          </div>
          <nav className="jump" aria-label="Sections">
            {[["overview", "Overview"], ["trend", "Trend"], ["league", "Vs league"], ["games", "Games"], ["standings", "Standings"], ["form", "Form"], ["skaters", "Skaters"], ["goalies", "Goalies"]].map(([id, l]) => (
              <a key={id} href={`#${id}`}>{l}</a>
            ))}
          </nav>

          {gp ? (
            <>
              <section id="overview">
                <h2>Overview</h2>
                <p className="lede">Every number is shown next to the NHL average and the Leafs&apos; rank among 32 teams, so you can tell good from normal.</p>
                <div className="kpis">
                  {ptsCtx ? <Kpi label="Points %" value={pct(r.ptsPct)} chip={`${ord(ptsCtx.rank)} in NHL`} good={ptsCtx.rank <= 16} sub={`NHL avg ${pct(ptsCtx.avg)}`} meter={{ v: r.ptsPct, avg: ptsCtx.avg, lo: 0.3, hi: 0.75 }} /> : null}
                  {avgPace != null ? <Kpi label="Points pace" value={String(pace)} chip={`${signed(pace - avgPace)} vs avg`} good={pace >= avgPace} sub={`avg team ≈ ${avgPace}`} meter={{ v: pace, avg: avgPace, lo: 60, hi: 125 }} /> : null}
                  <Kpi label="Goal differential" value={signed(r.gf - r.ga)} chip={gdCtx ? `${ord(gdCtx.rank)} in NHL` : "season"} good={r.gf >= r.ga} sub={`${r.gf} GF · ${r.ga} GA`} />
                  <Kpi label={`Last ${last10.length}`} value={`${n10("W")}-${n10("L")}-${n10("OTL")}`} chip={`${pct(l10Pct, 0)} pts`} good={l10Pct >= (ptsCtx?.avg ?? 0.5)} sub={`vs ${pct(r.ptsPct, 0)} season`} />
                  {pctKpi("xGoals % (5v5)", 0.4, 0.6)}
                  {pctKpi("Power play %", 0.12, 0.32)}
                  {pctKpi("Penalty kill %", 0.7, 0.88)}
                  {gfCtx ? <Kpi label="Goals for / game" value={gfCtx.value.toFixed(2)} chip={`${ord(gfCtx.rank)} in NHL`} good={gfCtx.rank <= 16} sub={`NHL avg ${gfCtx.avg.toFixed(2)}`} meter={{ v: gfCtx.value, avg: gfCtx.avg, lo: 2.3, hi: 4 }} /> : null}
                </div>
              </section>

              <section id="trend">
                <h2>Rolling {ROLL}-game trend</h2>
                <TrendChart games={games} trend={d.trend} hasMoneyPuck={d.hasMoneyPuck} lgGpg={lgGpg} roll={ROLL} />
              </section>

              {d.team.length ? (
                <section id="league">
                  <h2>Leafs vs the league</h2>
                  <p className="lede">Rank out of {d.team[0].ctx.of} teams, 1st = best. Green band = top quarter, red band = bottom quarter. The grey tick is the middle of the pack.</p>
                  <div className="card ranks">
                    <div className="rank-row head"><span>Metric</span><span className="r">Leafs</span><span className="r">NHL avg</span><span className="trk">1st → last</span><span className="r">Rank</span></div>
                    {d.team.map((t) => (
                      <div key={t.label} className="rank-row num">
                        <span>{t.label}</span>
                        <span className="r"><b>{fmtCtx(t.ctx.value, t.fmt)}</b></span>
                        <span className="r" style={{ color: "var(--muted)" }}>{fmtCtx(t.ctx.avg, t.fmt)}</span>
                        <span className="trk"><div className="track"><span className="avg" /><span className="dot" style={{ left: `${((t.ctx.rank - 1) / Math.max(1, t.ctx.of - 1)) * 100}%` }} /></div></span>
                        <span className={`rk ${tier(t.ctx.rank, t.ctx.of)}`}>{ord(t.ctx.rank)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section id="games">
                <h2>Last {last10.length} games</h2>
                <p className="lede">{d.hasMoneyPuck ? "xG% is the Leafs' share of 5-on-5 expected goals. 50% is an even game, so a loss above 55% was likely unlucky." : "Most recent first."}</p>
                <div className="games">
                  {[...last10].reverse().map((g) => (
                    <div key={g.id} className="card game">
                      <div className="top"><NhlLogo team={g.opp} size={32} /><div><div className="opp">{g.home ? "vs" : "@"} {g.opp}</div><div className="date">{day(g.date)}</div></div></div>
                      <div className="score num">{g.gf}–{g.ga} <span className={`chip ${resultTone(g.result)}`}>{resultText(g.result, g.ot)}</span></div>
                      {g.xgPct != null ? (
                        <div className="sub num">xG {pct(g.xgPct, 0)} · {g.xgPct >= 0.5 ? (g.result === "W" ? "deserved it" : "unlucky") : g.result === "W" ? "stole one" : "outplayed"}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {d.upcoming.length ? (
            <section id={gp ? undefined : "games"}>
              <h2>Up next</h2>
              <p className="lede">Opponent strength shown as their points % and league rank.</p>
              <div className="games">
                {d.upcoming.map((g) => {
                  const o = standings.find((s) => s.team === g.opp);
                  return (
                    <div key={g.id} className="card game">
                      <div className="top"><NhlLogo team={g.opp} size={32} /><div><div className="opp">{g.home ? "vs" : "@"} {g.opp}</div><div className="date">{day(g.date)}</div></div></div>
                      {o ? (
                        <>
                          {/* a strong opponent is bad news for the Leafs, so the colors flip */}
                          <div className="sub"><span className={`chip ${{ good: "bad", bad: "good", mid: "mid" }[tier(o.rank, standings.length)]}`}>{ord(o.rank)} in NHL</span></div>
                          <div className="sub num">{o.w}-{o.l}-{o.otl} · {pct(o.ptsPct, 0)} pts</div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {standings.length ? (
            <section id="standings">
              <h2>Standings</h2>
              <p className="lede">The Leafs&apos; division, plus where they sit league-wide.</p>
              <div className="split">
                {division.length ? <StandingsTable title={me!.division} rows={division} /> : null}
                <StandingsTable
                  title="NHL top 6"
                  rows={top6.some((s) => s.team === TEAM) || !me ? top6 : [...top6, me]}
                  extra={ptsCtx ? (
                    <tr className="ref"><td>NHL average team</td><td>—</td><td>—</td><td>—</td><td>{pct(ptsCtx.avg)}</td><td>0</td></tr>
                  ) : null}
                />
              </div>
            </section>
          ) : null}

          {d.form.length ? (
            <section id="form">
              <h2>Who&apos;s hot</h2>
              <p className="lede">Points in each of the last {ROLL} games, compared with the player&apos;s own season pace. Hot = 20%+ above pace, cold = 20%+ below.</p>
              <div className="form">
                {d.form.map((f) => {
                  const state = !f.lastGp ? ["mid", "—"] : f.lastPpg > f.seasonPpg * 1.2 ? ["good", "🔥 Hot"] : f.lastPpg < f.seasonPpg * 0.8 ? ["bad", "🧊 Cold"] : ["mid", "Steady"];
                  const max = Math.max(3, ...f.last);
                  return (
                    <div key={f.id} className="card fcard">
                      <div className="h"><span className="pname">{f.name}<span className="pos">{f.pos}</span></span><span className={`chip ${state[0]}`}>{state[1]}</span></div>
                      <div className="bars" aria-label={`Points by game, last ${f.last.length}`}>
                        {f.last.map((p, i) => <i key={i} className={p ? "" : "z"} style={{ height: `${p ? (p / max) * 100 : 8}%` }} title={`${p} pts`} />)}
                      </div>
                      <div className="ctx num">
                        Last {f.lastGp}: <b>{f.lastP} pts</b> ({f.lastPpg.toFixed(2)}/gm) · Season <b>{f.seasonPpg.toFixed(2)}</b>/gm
                        {f.rank ? ` · ${ord(f.rank.rank)} of ${f.rank.of} ${f.pos === "D" ? "D" : "F"}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section id="skaters">
            <h2>Skaters</h2>
            <p className="lede">Tap a column to sort. PPG = power-play goals. NHL rank is by points among all forwards (or defensemen). Grey rows are the average NHL regular at each position.</p>
            <SkaterTable skaters={d.skaters} refs={d.refSkaters} />
          </section>

          <section id="goalies">
            <h2>Goalies</h2>
            <p className="lede">Save % bar is scaled from .880 to .930. The grey row is the league-wide average.</p>
            <div className="card tbl-wrap">
              <table>
                <thead><tr><th>Goalie</th><th>GP</th><th>Record</th><th>SV%</th><th>GAA</th><th>SO</th>{d.lgGoalie ? <th>vs avg SV%</th> : null}</tr></thead>
                <tbody className="num">
                  {d.goalies.map((g) => (
                    <tr key={g.id}>
                      <td><span className="pname">{g.name}</span></td><td>{g.gp}</td><td>{g.w}-{g.l}-{g.otl}</td>
                      <td>{g.svPct.toFixed(3).replace(/^0/, "")}<span className="bar"><i style={{ width: `${clamp((g.svPct - 0.88) / 0.05, 0, 1) * 100}%` }} /></span></td>
                      <td>{g.gaa.toFixed(2)}</td><td>{g.so}</td>
                      {d.lgGoalie ? <td><span className={`chip ${g.svPct >= d.lgGoalie.svPct ? "good" : "bad"}`}>{signed((g.svPct - d.lgGoalie.svPct) * 1000)} pts</span></td> : null}
                    </tr>
                  ))}
                  {d.lgGoalie ? (
                    <tr className="ref">
                      <td>NHL average</td><td>—</td><td>—</td>
                      <td>{d.lgGoalie.svPct.toFixed(3).replace(/^0/, "")}<span className="bar"><i style={{ width: `${clamp((d.lgGoalie.svPct - 0.88) / 0.05, 0, 1) * 100}%` }} /></span></td>
                      <td>{d.lgGoalie.gaa.toFixed(2)}</td><td>—</td><td>—</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <footer>
            Data: NHL.com (schedule, stats, standings) and MoneyPuck.com (expected goals, Corsi), refreshed hourly. {d.hasMoneyPuck ? "" : "MoneyPuck data isn't available right now, so xG and Corsi are hidden. "}
            Team logos from NHL.com, trademarks of the NHL and its teams.
          </footer>
        </div>
      </main>
    </>
  );
}
