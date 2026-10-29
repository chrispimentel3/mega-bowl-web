import { getScorecard, type Call, type ProjErr } from "@/lib/scorecard";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { KpiRow } from "@/components/KpiRow";
import { SimpleTable } from "@/components/SimpleTable";

export const revalidate = 3600;

const pts = (v: number) => v.toFixed(1);

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
                { label: "Close calls right", value: `${t.calls_right} of ${t.calls}`, sub: "our pick outscored the sit" },
                { label: "Left on the bench", value: pts(t.points_left), sub: `pts over ${t.lineup_weeks} weeks` },
                {
                  label: "Projection error",
                  value: p?.mae_ours != null ? pts(p.mae_ours) : "—",
                  sub: p?.mae_consensus != null ? `pts a player · consensus ${pts(p.mae_consensus)}` : "pts a player",
                },
              ]}
            />

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
                    { key: "vs_avg_pct", label: "Vs his average", align: "right",
                      format: (v) => `${(v as number) > 0 ? "+" : ""}${(v as number).toFixed(1)}%` },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  Every ranked player&apos;s published matchup, against what he then scored relative to his own average
                  before that week. A good tag should land above the neutral row, a tough one below it.
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
