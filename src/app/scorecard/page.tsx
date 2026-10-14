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
                        Our lineup scored <b>{pts(w.lineup.ours)}</b> of a possible {pts(w.lineup.best)}
                        {w.lineup.should_have_started.length
                          ? ` — ${w.lineup.should_have_started.join(", ")} should have started.`
                          : " — the best lineup that roster had."}
                      </p>
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

            <p className="mt-6 text-xs text-muted">
              Skill positions only; kickers and defenses aren&apos;t in the stats this grades from. Insurance and
              bye-cover pickups aren&apos;t graded on points. Playoff and title odds get graded when the season ends.
            </p>
          </>
        )}
      </main>
    </>
  );
}
