import { getScorecard, type Call, type LiveCalib, type Market, type ModelGrade, type ProjErr } from "@/lib/scorecard";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { KpiRow } from "@/components/KpiRow";
import { SimpleTable } from "@/components/SimpleTable";

export const revalidate = 3600;

const pts = (v: number) => v.toFixed(1);
const signedPct = (v: unknown) =>
  typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%` : "—";

/** One line per setting the weekly calibration refits (mega/live_calib.py). */
function learnedLines(c: LiveCalib): { label: string; on: boolean; text: string }[] {
  const lines: { label: string; on: boolean; text: string }[] = [];
  for (const [pos, d] of Object.entries(c.defense ?? {})) {
    const fit = `fit ${Math.abs(d.dev_gain_pct).toFixed(1)}% ${d.dev_gain_pct >= 0 ? "better" : "worse"}`;
    const miss = `average miss ${Math.abs(d.mae_gain).toFixed(2)} pts ${d.mae_gain >= 0 ? "smaller" : "bigger"}`;
    lines.push({ label: `${pos} defense matchup`, on: d.active,
      text: `β ${d.beta.toFixed(2)}: ${fit}, ${miss}, over ${d.tested} week${d.tested === 1 ? "" : "s"}` });
  }
  const a = c.availability;
  const sure = a?.buckets?.["3"];
  if (a && sure) {
    lines.push({ label: "Chance he plays", on: a.active,
      text: `a player we had at ${Math.round(sure.said * 100)}% to play counts as ${Math.round(sure.p * 100)}% (${sure.n} player-weeks), over ${a.tested} week${a.tested === 1 ? "" : "s"}` });
  }
  const o = c.odds;
  if (o) {
    lines.push({ label: "Win odds", on: o.active,
      text: o.active
        ? `gaps between teams' expected scores shrunk to ${Math.round(o.lam * 100)}% (${o.n} graded games)`
        : `would shrink the gaps between teams' expected scores to ${Math.round(o.lam * 100)}%; ${o.n} of the 30 graded games it needs`,
    });
  }
  return lines;
}

function Verdict({ right }: { right: boolean }) {
  return right ? (
    <span className="shrink-0 whitespace-nowrap font-semibold text-pos-rb-text">✓ Right</span>
  ) : (
    <span className="shrink-0 whitespace-nowrap font-semibold text-crimson">✗ Wrong</span>
  );
}

function CallRow({ c }: { c: Call }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="min-w-0 text-ink">
        Started <b>{c.started}</b> ({pts(c.started_pts)}) over {c.sat} ({pts(c.sat_pts)})
      </span>
      <Verdict right={c.right} />
    </li>
  );
}

export default async function ScorecardPage() {
  const [sc, ab] = await Promise.all([getScorecard(), getActionBoard()]);
  const t = sc.totals;
  const p = t?.projections;
  const cg = sc.call_grades;
  const saidAll = cg?.n ? cg.buckets.reduce((s, b) => s + b.said * b.n, 0) / cg.n : 0;
  // the honesty check: a band with enough calls whose chances didn't come true
  const offBands = (cg?.buckets ?? []).filter((b) => b.n >= 30 && Math.abs(b.said - b.happened) > 0.05);
  const posRows = Object.entries(p?.by_pos ?? {}).map(([pos, e]) => ({ pos, ...(e as ProjErr) }));
  if (p?.vegas) {
    posRows.push({ pos: "Vegas-priced", n: p.vegas.n, mae_ours: p.vegas.mae_ours, mae_consensus: p.vegas.mae_consensus });
  }

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">Scorecard</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          The site&apos;s own calls, graded against what happened. Each week is read exactly as it was published
          before kickoff.
        </p>

        {!sc.available || !t ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No finished weeks to grade yet.
          </div>
        ) : (
          <>
            <KpiRow
              items={[
                cg && cg.n
                  ? { label: "Close-call chances", value: `${Math.round(saidAll * 100)}% → ${Math.round(((cg.right ?? 0) / cg.n) * 100)}%`,
                      sub: `said → happened · ${cg.n} calls` }
                  : { label: "Close calls right", value: `${t.calls_right} of ${t.calls}`, sub: "our pick outscored the sit" },
                { label: "Left on the bench", value: pts(t.points_left), sub: `pts over ${t.lineup_weeks} weeks` },
                {
                  label: "Projection error",
                  value: p?.mae_ours != null ? pts(p.mae_ours) : "—",
                  sub: p?.mae_consensus != null ? `pts a player · consensus ${pts(p.mae_consensus)}` : "pts a player",
                },
              ]}
            />

            {cg && cg.n ? (
              <>
                <SectionHeading title="Close-call chances, graded" />
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={cg.buckets}
                  columns={[
                    { key: "bucket", label: "Called" },
                    { key: "n", label: "Calls", align: "right" },
                    { key: "said", label: "Said", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                    { key: "happened", label: "Happened", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  Every close call on Start/Sit, with the chance we gave the player we started. Honest chances come true
                  about as often as they say.{" "}
                  {offBands.length
                    ? `Off by more than 5 points: ${offBands.map((b) => `${b.bucket} (said ${Math.round(b.said * 100)}%, happened ${Math.round(b.happened * 100)}%)`).join("; ")}.`
                    : cg.buckets.some((b) => b.n >= 30)
                      ? "Every band with 30+ calls is within 5 points."
                      : "No band has the 30 calls it takes to judge yet."}
                  {cg.brier != null ? ` Brier score ${cg.brier.toFixed(3)} (a coin flip scores 0.250; lower is better).` : ""}
                  {cg.rebuilt_weeks?.length
                    ? ` Weeks ${cg.rebuilt_weeks.join(", ")} came before Start/Sit showed chances, so theirs are rebuilt from the projections as they stood at kickoff.`
                    : ""}
                </p>
              </>
            ) : null}

            {t.dead_starts ? (
              <p className="mt-4 text-sm text-ink">
                <b>Starters who didn&apos;t play:</b> {t.dead_starts.n}
                {t.dead_starts.n ? ` (${pts(t.dead_starts.proj)} projected points)` : ""}.{" "}
                <span className="text-muted">
                  A starter whose team played but who has no stat line — usually a late scratch the 7 AM
                  refresh couldn&apos;t see yet.
                </span>
              </p>
            ) : null}

            {t.shadow ? (
              <>
                <SectionHeading title="Our lineups vs the consensus's" />
                <p className="text-sm text-ink">
                  Set on our projections, the lineup scored <b>{pts(t.shadow.ours)}</b> over {t.lineup_weeks} weeks;
                  set on the consensus, <b>{pts(t.shadow.consensus)}</b> —{" "}
                  {t.shadow.ours >= t.shadow.consensus
                    ? `${pts(t.shadow.ours - t.shadow.consensus)} more for ours.`
                    : `${pts(t.shadow.consensus - t.shadow.ours)} more for the consensus.`}{" "}
                  <span className="text-muted">Start/Sit runs on ours since week 6; this is how we&apos;ll know if it shouldn&apos;t.</span>
                </p>
              </>
            ) : null}

            {p && p.n ? (
              <>
                <SectionHeading title="Projections vs the consensus" />
                <p className="mb-2 text-sm text-muted">
                  Our weekly projection was nearer the actual score than the consensus of six sites for{" "}
                  <b className="text-ink">{Math.round((p.ours_closer ?? 0) * 100)}%</b> of {p.n.toLocaleString()}{" "}
                  player-weeks. Average miss in points, lower is better:
                </p>
                <SimpleTable
                  rowKey={(r) => r.pos}
                  rows={posRows}
                  columns={[
                    { key: "pos", label: "Players" },
                    { key: "n", label: "Player-weeks", align: "right" },
                    { key: "mae_ours", label: "Ours", align: "right", format: (v) => pts(v as number) },
                    { key: "mae_consensus", label: "Consensus", align: "right", format: (v) => pts(v as number) },
                  ]}
                />
                {p.vegas ? (
                  <p className="mt-2 text-xs text-muted">
                    Vegas props, on the {p.vegas.n} player-weeks they priced, missed by {pts(p.vegas.mae_vegas)}.
                  </p>
                ) : null}
              </>
            ) : null}

            {sc.ml?.n ? (
              <>
                <SectionHeading title="Our matchup model, graded" />
                <ModelGraded g={sc.ml} />
              </>
            ) : null}

            <SectionHeading title="Do Sunday's lines agree with us?" />
            <MarketCheck m={sc.market} />

            <SectionHeading title="Week by week" />
            <div className="grid gap-3">
              {sc.weeks.map((w) => (
                <section key={w.week} className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-display text-base font-bold text-ink">Week {w.week}</h3>
                    <span className="text-xs text-muted">as published {w.snapshot}</span>
                  </div>
                  {w.lineup ? (
                    <>
                      <p className="mt-1 text-sm text-ink">
                        The published lineup scored <b>{pts(w.lineup.ours)}</b> of a possible {pts(w.lineup.best)}
                        {w.lineup.should_have_started.length
                          ? ` — ${w.lineup.should_have_started.join(", ")} should have started.`
                          : " — the best lineup that roster had."}
                      </p>
                      {w.lineup.shadow ? (
                        <p className="mt-0.5 text-xs text-muted">
                          On our projections: {pts(w.lineup.shadow.ours)} · on the consensus: {pts(w.lineup.shadow.consensus)}
                        </p>
                      ) : null}
                      {w.lineup.dead_starts?.n ? (
                        <p className="mt-0.5 text-xs font-semibold text-crimson">
                          Started but didn&apos;t play: {w.lineup.dead_starts.players.join(", ")} ({pts(w.lineup.dead_starts.proj)} projected)
                        </p>
                      ) : null}
                      {w.lineup.calls.length ? (
                        <ul className="mt-1 divide-y divide-line">
                          {w.lineup.calls.map((c) => (
                            <CallRow key={`${c.started}-${c.sat}`} c={c} />
                          ))}
                        </ul>
                      ) : null}
                      {w.lineup.bye_calls.length ? (
                        <p className="mt-1 text-xs text-muted">
                          {w.lineup.bye_calls.join(" and ")} {w.lineup.bye_calls.length > 1 ? "were" : "was"} listed as a
                          close call while on bye — a bug this scorecard caught, fixed since. Not counted.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {w.projections && w.projections.n ? (
                    <p className="mt-2 text-xs text-muted">
                      Projections: ours missed by {pts(w.projections.mae_ours ?? 0)}, the consensus by{" "}
                      {pts(w.projections.mae_consensus ?? 0)} ({w.projections.n} players).
                    </p>
                  ) : null}
                </section>
              ))}
            </div>

            {sc.waivers.length ? (
              <>
                <SectionHeading title="Waiver pickups we said would start" />
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {sc.waivers.map((w) => (
                    <li key={`${w.add}-${w.drop}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 text-ink">
                        Wk {w.week}: add <b>{w.add}</b> ({pts(w.add_pts)}), drop {w.drop} ({pts(w.drop_pts)})
                        <span className="text-muted"> · {w.weeks} wk{w.weeks > 1 ? "s" : ""}</span>
                      </span>
                      <Verdict right={w.right} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {sc.matchups && Object.keys(sc.matchups).length ? (
              <>
                <SectionHeading title="Matchup tags" />
                <SimpleTable
                  rowKey={(r) => r.tag}
                  rows={(["good", "neutral", "tough"] as const)
                    .filter((b) => sc.matchups?.[b])
                    .map((b) => ({ tag: b === "good" ? "Good (+5% or better)" : b === "tough" ? "Tough (−5% or worse)" : "Neutral", ...sc.matchups![b] }))}
                  columns={[
                    { key: "tag", label: "Tagged" },
                    { key: "n", label: "Player-weeks", align: "right" },
                    { key: "tag_pct", label: "Average tag", align: "right", format: (v) => signedPct(v) },
                    { key: "vs_ours_pct", label: "Vs our projection", align: "right", format: (v) => signedPct(v) },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  Every tagged player who played, against our projection at kickoff. A good tag should land above
                  neutral, a tough one below.
                  {sc.matchups.spread != null ? <> Good tags beat tough ones by {sc.matchups.spread.toFixed(1)} points.</> : null}
                </p>
              </>
            ) : null}

            {sc.live_calib && sc.live_calib.defense ? (
              <>
                <SectionHeading title="What the model learned this week" />
                <ul className="space-y-1.5 text-sm text-ink">
                  {learnedLines(sc.live_calib).map((l) => (
                    <li key={l.label}>
                      <span className="font-medium">{l.label}:</span>{" "}
                      <span className={l.on ? "font-semibold text-pos-rb-text" : "text-muted"}>{l.on ? "on" : "off"}</span>
                      {" — "}
                      {l.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Refit every week on this season&apos;s graded weeks (through week {sc.live_calib.through_week}), each
                  anchored to ten seasons of history. A setting switches on only after it beats leaving it alone, week
                  by week: 4 tested weeks for the player settings, and 30 graded games for win odds.
                </p>
              </>
            ) : null}

            {sc.live_blend && Object.keys(sc.live_blend.weights).length ? (
              <>
                <SectionHeading title="Learning from this season" />
                <p className="text-sm text-ink">
                  {sc.live_blend.active ? (
                    <>Start/Sit now leans on this season&apos;s results:{" "}</>
                  ) : (
                    <>
                      Off for now — {sc.live_blend.tested} week{sc.live_blend.tested === 1 ? "" : "s"} tested, and it
                      switches on after 4 that beat our projections alone. It would weight:{" "}
                    </>
                  )}
                  {Object.entries(sc.live_blend.weights)
                    .map(([pos, w]) => `${pos} ${Math.round(w * 100)}% ours`)
                    .join(" · ")}
                  , the rest the consensus.
                </p>
              </>
            ) : null}

            {sc.movers?.length ? (
              <>
                <SectionHeading title="When the books moved a role" />
                <p className="mb-2 text-sm text-muted">
                  {sc.movers.filter((m) => m.before != null && m.pts > m.before).length} of{" "}
                  {sc.movers.filter((m) => m.before != null).length} players the books raised then beat their
                  average from before.
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {sc.movers.map((m) => (
                    <li key={`${m.week}-${m.player}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 text-ink">
                        Wk {m.week}: <b>{m.player}</b> <span className="text-muted">{m.pos}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                        {pts(m.pts)} pts{m.before != null ? ` · was ${pts(m.before)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {sc.trades?.n ? (
              <>
                <SectionHeading title="Trade ideas, replayed" />
                <p className="mb-2 text-sm text-ink">
                  {sc.trades.n} trade idea{sc.trades.n === 1 ? "" : "s"} from the home board, each replayed on your roster
                  from the week it first showed: <b>{sc.trades.helped}</b> would have helped your lineup,{" "}
                  <b>{sc.trades.hurt}</b> would have hurt it
                  {sc.trades.per_week != null
                    ? ` — ${sc.trades.per_week >= 0 ? "+" : ""}${pts(sc.trades.per_week)} pts a week on average.`
                    : "."}
                </p>
                <details className="rounded-xl border border-line bg-card px-4 shadow-sm">
                  <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">Every idea</summary>
                  <ul className="divide-y divide-line">
                    {sc.trades.rows.map((r) => (
                      <li key={`${r.week}-${r.give.join("+")}-${r.get.join("+")}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0 text-ink">
                          Wk {r.week} · {r.partner}: give {r.give.join(" + ")}, get <b>{r.get.join(" + ")}</b>
                          <span className="block text-xs text-muted">
                            {r.per_week >= 0 ? "+" : ""}
                            {pts(r.per_week)}/wk over {r.weeks} wk{r.weeks === 1 ? "" : "s"}
                            {r.said != null ? ` · we said ${r.said >= 0 ? "+" : ""}${pts(r.said)}` : ""}
                          </span>
                        </span>
                        {r.right == null ? <span className="shrink-0 text-muted">—</span> : <Verdict right={r.right} />}
                      </li>
                    ))}
                  </ul>
                </details>
                <p className="mt-2 text-xs text-muted">
                  Your best lineup each week with the deal and without it, on what was actually scored. A week stops
                  counting once a player you&apos;d have given leaves your roster.
                </p>
              </>
            ) : null}

            {sc.odds?.n ? (
              <>
                <SectionHeading title="Win odds" />
                <p className="mb-2 text-sm text-ink">
                  Favorites won <b>{sc.odds.favorites_won}</b> of {sc.odds.n} games; we gave them{" "}
                  <b>{Math.round((sc.odds.said ?? 0) * 100)}%</b> on average.
                </p>
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={sc.odds.buckets ?? []}
                  columns={[
                    { key: "bucket", label: "Chance we gave" },
                    { key: "n", label: "Games", align: "right" },
                    { key: "said", label: "We said", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                    { key: "happened", label: "Won", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                  ]}
                />
                {sc.odds.games?.length ? (
                  <details className="mt-2 rounded-xl border border-line bg-card px-4 shadow-sm">
                    <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">Every game</summary>
                    <ul className="divide-y divide-line">
                      {sc.odds.games.map((g) => (
                        <li key={`${g.week}-${g.favorite}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 text-ink">
                            Wk {g.week}: <b>{g.favorite}</b> {Math.round(g.p * 100)}% vs {g.underdog}
                          </span>
                          <Verdict right={g.won} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  Each game&apos;s chance from the season simulation as it stood before kickoff. Over a season, the
                  favorites we gave 70% should win about 70% of the time.
                </p>
              </>
            ) : null}

            {sc.playoff_odds?.available && sc.playoff_odds.buckets?.length ? (
              <>
                <SectionHeading title="Playoff odds" />
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={sc.playoff_odds.buckets}
                  columns={[
                    { key: "bucket", label: "Odds we gave" },
                    { key: "n", label: "Team-weeks", align: "right" },
                    { key: "said", label: "We said", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                    { key: "happened", label: "Made it", align: "right", format: (v) => `${Math.round((v as number) * 100)}%` },
                  ]}
                />
              </>
            ) : null}

            <p className="mt-6 text-xs text-muted">
              Skill positions only; kickers and defenses aren&apos;t in the stats this grades from. Insurance and
              bye-cover pickups aren&apos;t graded on points.{" "}
              {sc.playoff_odds?.available
                ? "Title odds get graded when the season ends."
                : `Playoff odds get graded once the field is set after week ${sc.playoff_odds?.after_week ?? 14}; title odds when the season ends.`}
            </p>
          </>
        )}
      </main>
    </>
  );
}

/** Where our midweek projection differed from the consensus, how far Sunday's prop lines moved
 *  toward ours. Faster than waiting on results: a line moving our way says we knew something. */
function MarketCheck({ m }: { m?: Market }) {
  const share = (v: number) => `${Math.round(v * 100)}%`;
  if (!m || m.toward_ours == null || m.se == null) {
    return (
      <p className="text-sm text-muted">
        When our midweek projection differs from the consensus, do Sunday morning&apos;s prop lines move toward
        ours? {m?.n ? `${m.n} player-weeks so far; a number shows from 30.` : "This starts with week 10's Sunday lines and is graded the Tuesday after."}
      </p>
    );
  }
  const lo = m.toward_ours - 1.96 * m.se;
  const pos = Object.entries(m.by_pos ?? {}).filter(([, f]) => f.toward_ours != null && f.se != null);
  return (
    <>
      <p className="text-sm text-ink">
        Where our midweek projection differed from the consensus, Sunday&apos;s prop lines moved{" "}
        <b>{share(m.toward_ours)}</b> of the way toward ours (± {share(1.96 * m.se)}), over {m.n.toLocaleString()} player-weeks
        in week{m.weeks.length > 1 ? "s" : ""} {m.weeks.join(", ")}.{" "}
        {lo > 0
          ? "The market keeps finding what we saw first."
          : "Not yet clear of zero: too early to say the market agrees with us."}
      </p>
      {pos.length ? (
        <ul className="mt-1 text-xs text-muted">
          {pos.map(([p, f]) => (
            <li key={p}>
              {p}: {share(f.toward_ours!)} ± {share(1.96 * f.se!)} over {f.n}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        0% would mean the market ignored where we differed; 100% that it ended up exactly at ours.
      </p>
    </>
  );
}

/** The matchup model against ours and the consensus on the player-weeks it scored, and whether
 *  it has earned a share of the Lineup projection. */
function ModelGraded({ g }: { g: ModelGrade }) {
  const replayed = g.weeks?.replayed ?? [];
  const published = g.weeks?.published ?? [];
  const b = g.blend;
  return (
    <>
      <p className="text-sm text-ink">
        On {g.n.toLocaleString()} player-weeks the model missed by <b>{(g.mae_ml ?? 0).toFixed(2)}</b> points on
        average; our projection missed by {(g.mae_ours ?? 0).toFixed(2)} and the consensus by{" "}
        {(g.mae_consensus ?? 0).toFixed(2)}. Lower is better.
      </p>
      <p className="mt-1 text-sm text-ink">
        {b.active ? (
          <>
            <b>It has earned a place:</b> {Math.round(b.u * 100)}% of the Lineup projection now comes from the model,
            after the blend beat our projection alone by {(b.mae_gain ?? 0).toFixed(2)} points a player over {b.tested} tested
            weeks.
          </>
        ) : (
          <>
            <b>Not in your lineup yet.</b> Blending it into our projection{" "}
            {b.mae_gain != null && b.tested
              ? `${b.mae_gain > 0 ? "helped" : "cost"} ${Math.abs(b.mae_gain).toFixed(2)} points a player over ${b.tested} tested weeks`
              : "hasn't been tested on enough weeks"}
            ; it joins only after the blend wins over 4 or more.
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-muted">
        {published.length ? `Graded as published before kickoff: week${published.length > 1 ? "s" : ""} ${published.join(", ")}. ` : ""}
        {replayed.length
          ? `Week${replayed.length > 1 ? "s" : ""} ${replayed.join(", ")} ${replayed.length > 1 ? "are" : "is"} replayed: the model run afterwards on what was known before each week, which flatters it a little (it sees who really sat out).`
          : ""}
      </p>
    </>
  );
}
