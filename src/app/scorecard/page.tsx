import { getScorecard, type Call, type LiveCalib, type Market, type ModelGrade, type ProjErr } from "@/lib/scorecard";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { KpiRow } from "@/components/KpiRow";
import { SimpleTable } from "@/components/SimpleTable";

export const revalidate = 3600;

const pts = (v: number) => v.toFixed(1);
const pct = (v: number) => `${Math.round(v * 100)}%`;
const signedPct = (v: unknown) =>
  typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%` : "—";
/** "3 weeks", "1 week" */
const count = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
/** "A", "A and B", "A, B and C" */
const names = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** One line per setting the site re-checks every week (mega/live_calib.py), in plain words. */
function learnedLines(c: LiveCalib): { label: string; on: boolean; text: string }[] {
  const lines: { label: string; on: boolean; text: string }[] = [];
  for (const [pos, d] of Object.entries(c.defense ?? {})) {
    const moved = `${d.mae_gain >= 0 ? "cut" : "raised"} the average miss by ${Math.abs(d.mae_gain).toFixed(2)} points`;
    lines.push({ label: `Opposing defense, ${pos}s`, on: d.active,
      text: d.tested
        ? `${d.active ? "Counted in" : "Left out of"} ${pos} projections. Over ${count(d.tested, "week")} of testing, counting it ${moved}.`
        : "Not tested yet." });
  }
  const a = c.availability;
  const sure = a?.buckets?.["3"];
  if (a && sure) {
    const games = `${sure.n.toLocaleString()} player-games`;
    lines.push({ label: "Chance he plays", on: a.active,
      text: a.active
        ? `A player we marked ${pct(sure.said)} sure to play now counts as ${pct(sure.p)}, in line with how often such players really played (${games}).`
        : `Players we marked ${pct(sure.said)} sure to play did so about ${pct(sure.p)} of the time (${games}). Not adjusted for yet.` });
  }
  const o = c.odds;
  if (o) {
    const trim = Math.round((1 - o.lam) * 100);
    lines.push({ label: "Win chances", on: o.active,
      text: o.active
        ? `Pulled toward 50/50: the gap between two teams' expected scores is trimmed by ${trim}% (${count(o.n, "game")} graded).`
        : `No change yet. This needs 30 graded games and has ${o.n}. It would trim the gap between two teams' expected scores by ${trim}%, pulling win chances toward 50/50.`,
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
  // the honesty check: a group with enough calls whose chances didn't come true
  const offBands = (cg?.buckets ?? []).filter((b) => b.n >= 30 && Math.abs(b.said - b.happened) > 0.05);
  const posRows = Object.entries(p?.by_pos ?? {}).map(([pos, e]) => ({ pos, ...(e as ProjErr) }));
  if (p?.vegas) {
    posRows.push({ pos: "With Vegas lines", n: p.vegas.n, mae_ours: p.vegas.mae_ours, mae_consensus: p.vegas.mae_consensus });
  }

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">Scorecard</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Every call this site made, checked against what happened. Each week is graded from what the site showed
          before kickoff, never in hindsight. &ldquo;The consensus&rdquo; means the average projection from six other
          sites.
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
                  ? { label: "Close calls right", value: `${cg.right ?? 0} of ${cg.n}`,
                      sub: `${pct((cg.right ?? 0) / cg.n)} · we expected ${pct(saidAll)}` }
                  : { label: "Close calls right", value: `${t.calls_right} of ${t.calls}`, sub: "our pick outscored the sit" },
                { label: "Points left on the bench", value: pts(t.points_left), sub: `over ${count(t.lineup_weeks, "week")}` },
                {
                  label: "Average miss",
                  value: p?.mae_ours != null ? pts(p.mae_ours) : "—",
                  sub: p?.mae_consensus != null ? `pts per player · consensus ${pts(p.mae_consensus)}` : "pts per player",
                },
              ]}
            />

            {cg && cg.n ? (
              <>
                <SectionHeading title="Close calls: were our chances right?" />
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={cg.buckets}
                  columns={[
                    { key: "bucket", label: "How sure we were" },
                    { key: "n", label: "Calls", align: "right" },
                    { key: "said", label: "Chance we gave", align: "right", format: (v) => pct(v as number) },
                    { key: "happened", label: "How often it won", align: "right", format: (v) => pct(v as number) },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  A close call is two players the Lineup page had within 2 points of each other. For each one we gave
                  the chance that the player we started would outscore the one we sat. Good chances come true about as
                  often as they say: a group we gave 60% should win about 60% of the time.
                </p>
                <p className="mt-1 text-xs text-muted">
                  {offBands.length
                    ? `Off by more than 5 percentage points: ${offBands.map((b) => `${b.bucket} (we said ${pct(b.said)}, it happened ${pct(b.happened)})`).join("; ")}.`
                    : cg.buckets.some((b) => b.n >= 30)
                      ? "Every group with at least 30 calls landed within 5 percentage points."
                      : "No group has 30 calls yet, which is the least it takes to judge."}
                  {cg.brier != null
                    ? ` Overall score: ${cg.brier.toFixed(3)}. Guessing 50% every time scores 0.250, and lower is better.`
                    : ""}
                  {cg.rebuilt_weeks?.length
                    ? ` Week${cg.rebuilt_weeks.length > 1 ? "s" : ""} ${cg.rebuilt_weeks.join(", ")} came before the Lineup page showed chances, so theirs were worked out afterwards from that week's projections.`
                    : ""}
                </p>
              </>
            ) : null}

            {t.dead_starts ? (
              <p className="mt-4 text-sm text-ink">
                <b>Starters who didn&apos;t play:</b> {t.dead_starts.n}
                {t.dead_starts.n ? `, worth ${pts(t.dead_starts.proj)} projected points` : ""}.{" "}
                <span className="text-muted">
                  These are players we said to start whose team played without them, usually because they were ruled
                  out after the morning update.
                </span>
              </p>
            ) : null}

            {t.shadow ? (
              <>
                <SectionHeading title="Lineups: our projections vs the consensus" />
                <p className="text-sm text-ink">
                  A lineup set from our projections every week would have scored <b>{pts(t.shadow.ours)}</b> over{" "}
                  {count(t.lineup_weeks, "week")}. Set from the consensus, it would have scored{" "}
                  <b>{pts(t.shadow.consensus)}</b>. That is{" "}
                  {t.shadow.ours >= t.shadow.consensus
                    ? `${pts(t.shadow.ours - t.shadow.consensus)} more for ours.`
                    : `${pts(t.shadow.consensus - t.shadow.ours)} more for the consensus.`}{" "}
                  <span className="text-muted">
                    The Lineup page has used our projections since week 6. This is the check on that choice.
                  </span>
                </p>
              </>
            ) : null}

            {p && p.n ? (
              <>
                <SectionHeading title="Projections: ours vs the consensus" />
                <p className="mb-2 text-sm text-muted">
                  Our projection was closer to the real score than the consensus on{" "}
                  <b className="text-ink">{pct(p.ours_closer ?? 0)}</b> of {p.n.toLocaleString()} player-games. The
                  table shows how far off each was on average, in points. Lower is better.
                </p>
                <SimpleTable
                  rowKey={(r) => r.pos}
                  rows={posRows}
                  columns={[
                    { key: "pos", label: "Position" },
                    { key: "n", label: "Player-games", align: "right" },
                    { key: "mae_ours", label: "Ours", align: "right", format: (v) => pts(v as number) },
                    { key: "mae_consensus", label: "Consensus", align: "right", format: (v) => pts(v as number) },
                  ]}
                />
                {p.vegas ? (
                  <p className="mt-2 text-xs text-muted">
                    On the {p.vegas.n.toLocaleString()} player-games that had Vegas player lines, the lines themselves
                    were off by {pts(p.vegas.mae_vegas)}.
                  </p>
                ) : null}
              </>
            ) : null}

            {sc.ml?.n ? (
              <>
                <SectionHeading title="The matchup model, graded" />
                <ModelGraded g={sc.ml} />
              </>
            ) : null}

            <SectionHeading title="Does Vegas move toward our numbers?" />
            <MarketCheck m={sc.market} />

            <SectionHeading title="Week by week" />
            <div className="grid gap-3">
              {sc.weeks.map((w) => (
                <section key={w.week} className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-display text-base font-bold text-ink">Week {w.week}</h3>
                    <span className="text-xs text-muted">the site as of {w.snapshot}</span>
                  </div>
                  {w.lineup ? (
                    <>
                      <p className="mt-1 text-sm text-ink">
                        The lineup we recommended scored <b>{pts(w.lineup.ours)}</b> out of a possible{" "}
                        {pts(w.lineup.best)}.{" "}
                        {w.lineup.should_have_started.length
                          ? `${names(w.lineup.should_have_started)} should have started.`
                          : "That was the best lineup your roster had."}
                      </p>
                      {w.lineup.shadow ? (
                        <p className="mt-0.5 text-xs text-muted">
                          Set from our projections: {pts(w.lineup.shadow.ours)}. Set from the consensus:{" "}
                          {pts(w.lineup.shadow.consensus)}.
                        </p>
                      ) : null}
                      {w.lineup.dead_starts?.n ? (
                        <p className="mt-0.5 text-xs font-semibold text-crimson">
                          Started but didn&apos;t play: {names(w.lineup.dead_starts.players)} ({pts(w.lineup.dead_starts.proj)} projected)
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
                          {names(w.lineup.bye_calls)} {w.lineup.bye_calls.length > 1 ? "were" : "was"} listed as a close
                          call while on bye. That was a bug, since fixed, and it isn&apos;t counted.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {w.projections && w.projections.n ? (
                    <p className="mt-2 text-xs text-muted">
                      Projections for {count(w.projections.n, "player")}: ours were off by{" "}
                      {pts(w.projections.mae_ours ?? 0)} points on average, the consensus by{" "}
                      {pts(w.projections.mae_consensus ?? 0)}.
                    </p>
                  ) : null}
                </section>
              ))}
            </div>

            {sc.waivers.length ? (
              <>
                <SectionHeading title="Waiver pickups we said to start" />
                <p className="mb-2 text-sm text-muted">
                  Points each player has scored since the week we recommended the swap. Right means the pickup has
                  outscored the player we said to drop.
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {sc.waivers.map((w) => (
                    <li key={`${w.add}-${w.drop}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 text-ink">
                        Week {w.week}: add <b>{w.add}</b> ({pts(w.add_pts)} pts), drop {w.drop} ({pts(w.drop_pts)} pts)
                        <span className="text-muted"> · over {count(w.weeks, "week")}</span>
                      </span>
                      <Verdict right={w.right} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {sc.matchups && Object.keys(sc.matchups).length ? (
              <>
                <SectionHeading title="Good and Tough matchup tags" />
                <SimpleTable
                  rowKey={(r) => r.tag}
                  rows={(["good", "neutral", "tough"] as const)
                    .filter((b) => sc.matchups?.[b])
                    .map((b) => ({ tag: b === "good" ? "Good (+5% or better)" : b === "tough" ? "Tough (−5% or worse)" : "Neutral", ...sc.matchups![b] }))}
                  columns={[
                    { key: "tag", label: "Tag" },
                    { key: "n", label: "Player-games", align: "right" },
                    { key: "tag_pct", label: "Tag said", align: "right", format: (v) => signedPct(v) },
                    { key: "vs_ours_pct", label: "What happened", align: "right", format: (v) => signedPct(v) },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  The Good and Tough tags shown on lineup rows. &ldquo;Tag said&rdquo; is how far the tag expected a
                  player to move from a normal week. &ldquo;What happened&rdquo; is how his score compared with our
                  projection. Players tagged Good should finish ahead of players tagged Tough.
                  {sc.matchups.spread != null
                    ? sc.matchups.spread >= 0
                      ? ` They did, by ${sc.matchups.spread.toFixed(1)} percentage points.`
                      : ` They didn't: players tagged Tough finished ahead by ${Math.abs(sc.matchups.spread).toFixed(1)} percentage points.`
                    : ""}
                </p>
              </>
            ) : null}

            {sc.live_calib && sc.live_calib.defense ? (
              <>
                <SectionHeading title="Settings the site adjusts as the season goes" />
                <ul className="space-y-1.5 text-sm text-ink">
                  {learnedLines(sc.live_calib).map((l) => (
                    <li key={l.label}>
                      <span className="font-medium">{l.label}:</span>{" "}
                      <span className={l.on ? "font-semibold text-pos-rb-text" : "text-muted"}>{l.on ? "on" : "off"}</span>
                      {". "}
                      {l.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Each setting is re-checked every week against this season&apos;s results (through week{" "}
                  {sc.live_calib.through_week}), starting from ten seasons of history. It turns on only after testing
                  shows it makes the numbers better: 4 weeks for the player settings, 30 games for win chances.
                </p>
              </>
            ) : null}

            {sc.live_blend && Object.keys(sc.live_blend.weights).length ? (
              <>
                <SectionHeading title="How much the Lineup page leans on the consensus" />
                <p className="text-sm text-ink">
                  {sc.live_blend.active ? (
                    <>This season&apos;s results set the mix the Lineup page uses:{" "}</>
                  ) : (
                    <>
                      Not in use yet. It has been tested on {count(sc.live_blend.tested, "week")} and turns on after 4
                      in which the mix beats our projections alone. It would use:{" "}
                    </>
                  )}
                  {Object.entries(sc.live_blend.weights)
                    .map(([pos, w]) => {
                      const ours = Math.round(w * 100);
                      return ours >= 100 ? `${pos} all ours` : `${pos} ${ours}% ours and ${100 - ours}% consensus`;
                    })
                    .join(" · ")}
                  .
                </p>
              </>
            ) : null}

            {sc.movers?.length ? (
              <>
                <SectionHeading title="When Vegas raised a player's line" />
                <p className="mb-2 text-sm text-muted">
                  {sc.movers.filter((m) => m.before != null && m.pts > m.before).length} of{" "}
                  {sc.movers.filter((m) => m.before != null).length} players whose Vegas line jumped went on to beat
                  their earlier scoring average that week.
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {sc.movers.map((m) => (
                    <li key={`${m.week}-${m.player}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 text-ink">
                        Week {m.week}: <b>{m.player}</b> <span className="text-muted">{m.pos}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                        scored {pts(m.pts)}{m.before != null ? ` · averaged ${pts(m.before)} before` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {sc.trades?.n ? (
              <>
                <SectionHeading title="Trade ideas, checked against what happened" />
                <p className="mb-2 text-sm text-ink">
                  {count(sc.trades.n, "trade idea")} from the This Week page, each followed from the week it first
                  appeared: <b>{sc.trades.helped}</b> would have helped your lineup and <b>{sc.trades.hurt}</b> would
                  have hurt it
                  {sc.trades.per_week != null
                    ? `. On average that is ${sc.trades.per_week >= 0 ? "+" : "−"}${pts(Math.abs(sc.trades.per_week))} points a week.`
                    : "."}
                </p>
                <details className="rounded-xl border border-line bg-card px-4 shadow-sm">
                  <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">Every idea</summary>
                  <ul className="divide-y divide-line">
                    {sc.trades.rows.map((r) => (
                      <li key={`${r.week}-${r.give.join("+")}-${r.get.join("+")}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0 text-ink">
                          Week {r.week} · {r.partner}: give {r.give.join(" + ")}, get <b>{r.get.join(" + ")}</b>
                          <span className="block text-xs text-muted">
                            {r.per_week >= 0 ? "+" : "−"}
                            {pts(Math.abs(r.per_week))} points a week over {count(r.weeks, "week")}
                            {r.said != null ? ` · we predicted ${r.said >= 0 ? "+" : "−"}${pts(Math.abs(r.said))}` : ""}
                          </span>
                        </span>
                        {r.right == null ? <span className="shrink-0 text-muted">—</span> : <Verdict right={r.right} />}
                      </li>
                    ))}
                  </ul>
                </details>
                <p className="mt-2 text-xs text-muted">
                  For each idea we compare your best lineup with the trade and without it, using the points actually
                  scored. An idea stops being followed once a player you would have traded away leaves your roster.
                </p>
              </>
            ) : null}

            {sc.odds?.n ? (
              <>
                <SectionHeading title="Win chances" />
                <p className="mb-2 text-sm text-ink">
                  Favorites won <b>{sc.odds.favorites_won}</b> of {count(sc.odds.n, "game")}. We gave them a{" "}
                  <b>{pct(sc.odds.said ?? 0)}</b> chance on average.
                </p>
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={sc.odds.buckets ?? []}
                  columns={[
                    { key: "bucket", label: "Chance we gave" },
                    { key: "n", label: "Games", align: "right" },
                    { key: "said", label: "Average chance", align: "right", format: (v) => pct(v as number) },
                    { key: "happened", label: "Favorite won", align: "right", format: (v) => pct(v as number) },
                  ]}
                />
                {sc.odds.games?.length ? (
                  <details className="mt-2 rounded-xl border border-line bg-card px-4 shadow-sm">
                    <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">Every game</summary>
                    <ul className="divide-y divide-line">
                      {sc.odds.games.map((g) => (
                        <li key={`${g.week}-${g.favorite}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 text-ink">
                            Week {g.week}: <b>{g.favorite}</b> {pct(g.p)} vs {g.underdog}
                          </span>
                          <Verdict right={g.won} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  Each game&apos;s win chance as the site showed it before kickoff. If the chances are right, favorites
                  we gave 70% should win about 70% of the time.
                </p>
              </>
            ) : null}

            {sc.playoff_odds?.available && sc.playoff_odds.buckets?.length ? (
              <>
                <SectionHeading title="Playoff odds" />
                <p className="mb-2 text-sm text-muted">
                  Each team&apos;s playoff odds every week, against whether that team made the playoffs.
                </p>
                <SimpleTable
                  rowKey={(r) => r.bucket}
                  rows={sc.playoff_odds.buckets}
                  columns={[
                    { key: "bucket", label: "Odds we gave" },
                    { key: "n", label: "Times given", align: "right" },
                    { key: "said", label: "Average odds", align: "right", format: (v) => pct(v as number) },
                    { key: "happened", label: "Made the playoffs", align: "right", format: (v) => pct(v as number) },
                  ]}
                />
              </>
            ) : null}

            <p className="mt-6 text-xs text-muted">
              Only quarterbacks, running backs, receivers and tight ends are graded; the stats behind this page
              don&apos;t cover kickers and defenses. Pickups made as injury insurance or to cover a bye aren&apos;t
              graded on points.{" "}
              {sc.playoff_odds?.available
                ? "Title odds are graded when the season ends."
                : `Playoff odds are graded once the playoff field is set after week ${sc.playoff_odds?.after_week ?? 14}, and title odds when the season ends.`}
            </p>
          </>
        )}
      </main>
    </>
  );
}

/** Where our projection early in the week differed from the consensus, how far Sunday's Vegas
 *  player lines moved toward ours. Faster than waiting on results: a line moving our way says
 *  we saw something first. */
function MarketCheck({ m }: { m?: Market }) {
  if (!m || m.toward_ours == null || m.se == null) {
    return (
      <p className="text-sm text-muted">
        When our projection early in the week differs from the consensus, do Vegas player lines on Sunday morning end
        up closer to ours? If they do, we saw something before the market did.{" "}
        {m?.n
          ? `${count(m.n, "player-game")} so far. It takes 30 to show a number.`
          : "This starts with week 10's Sunday lines and is graded the Tuesday after."}
      </p>
    );
  }
  const margin = 1.96 * m.se;
  const clear = m.toward_ours - margin > 0;
  const pos = Object.entries(m.by_pos ?? {}).filter(([, f]) => f.toward_ours != null && f.se != null);
  return (
    <>
      <p className="text-sm text-ink">
        Where our projection early in the week differed from the consensus, Sunday&apos;s Vegas player lines moved{" "}
        <b>{pct(m.toward_ours)}</b> of the way toward ours, give or take {pct(margin)}. That covers{" "}
        {m.n.toLocaleString()} player-games in week{m.weeks.length > 1 ? "s" : ""} {m.weeks.join(", ")}.{" "}
        {clear
          ? "That is more than chance: the market tends to catch up to what we saw."
          : "That could still be chance, so it is too early to say."}
      </p>
      {pos.length ? (
        <ul className="mt-1 text-xs text-muted">
          {pos.map(([p, f]) => (
            <li key={p}>
              {p}: {pct(f.toward_ours!)}, give or take {pct(1.96 * f.se!)} ({count(f.n, "player-game")})
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        0% would mean Vegas ignored where we differed. 100% would mean it ended up exactly at our number.
      </p>
    </>
  );
}

/** The matchup model against ours and the consensus on the player-games it scored, and whether
 *  it has earned a share of the Lineup projection. */
function ModelGraded({ g }: { g: ModelGrade }) {
  const replayed = g.weeks?.replayed ?? [];
  const published = g.weeks?.published ?? [];
  const b = g.blend;
  const weeksOf = (xs: number[]) => `week${xs.length > 1 ? "s" : ""} ${xs.join(", ")}`;
  return (
    <>
      <p className="text-sm text-ink">
        Over {g.n.toLocaleString()} player-games the matchup model was off by{" "}
        <b>{(g.mae_ml ?? 0).toFixed(2)}</b> points on average. Our projection was off by{" "}
        {(g.mae_ours ?? 0).toFixed(2)} and the consensus by {(g.mae_consensus ?? 0).toFixed(2)}. Lower is better.
      </p>
      <p className="mt-1 text-sm text-ink">
        {b.active ? (
          <>
            <b>It has earned a place.</b> {pct(b.u)} of each Lineup projection now comes from the model. Mixing it in
            beat our projection alone by {(b.mae_gain ?? 0).toFixed(2)} points per player over{" "}
            {count(b.tested, "week")} of testing.
          </>
        ) : (
          <>
            <b>Not in your lineup yet.</b>{" "}
            {b.mae_gain != null && b.tested
              ? `Mixing it into our projection made the numbers ${Math.abs(b.mae_gain).toFixed(2)} points per player ${b.mae_gain > 0 ? "better" : "worse"} over ${count(b.tested, "week")} of testing.`
              : "Mixing it into our projection hasn't been tested on enough weeks."}{" "}
            It is added only once the mix has done better than our projection alone over at least 4 weeks.
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-muted">
        {published.length ? `Graded on what the model published before kickoff: ${weeksOf(published)}. ` : ""}
        {replayed.length
          ? `The model did not exist yet in ${weeksOf(replayed)}, so ${replayed.length > 1 ? "those weeks were" : "that week was"} graded after the fact. That favors it slightly, because it knew who really sat out.`
          : ""}
      </p>
    </>
  );
}
