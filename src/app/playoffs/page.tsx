import { getPlayoffs, type Playoffs, type PlayoffStarter } from "@/lib/playoffs";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { KpiRow } from "@/components/KpiRow";
import { PosBadge } from "@/components/PosBadge";

export const revalidate = 3600;

const SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX"];

function Opp({ s }: { s: Pick<PlayoffStarter, "opp" | "tag"> }) {
  if (s.tag === "bye" || !s.opp) return <span className="font-semibold text-crimson">bye</span>;
  return (
    <span className="whitespace-nowrap">
      {s.opp}
      {s.tag === "easy" ? <span className="ml-1 font-semibold text-pos-rb-text">easy</span> : null}
      {s.tag === "tough" ? <span className="ml-1 font-semibold text-crimson">tough</span> : null}
    </span>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Rooting({ r }: { r: NonNullable<Playoffs["rooting"]> }) {
  const real = r.games.filter((g) => !g.noise);
  return (
    <>
      <SectionHeading title={`Week ${r.week}: what matters`} />
      {r.mine ? (
        <div className="rounded-xl border border-line bg-card px-4 py-3 text-sm shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-ink">
              Your game vs <b>{r.mine.opp}</b>
            </span>
            <span className="shrink-0 whitespace-nowrap font-semibold text-ink">
              {pct(r.mine.playoffs_if_lose)} → {pct(r.mine.playoffs_if_win)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Playoff odds if you lose vs win ({pct(r.mine.p_win)} to win). Title odds {pct(r.mine.title_if_lose)} →{" "}
            {pct(r.mine.title_if_win)}.
          </p>
        </div>
      ) : null}
      {real.length ? (
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
          {real.map((g) => (
            <li key={g.root_for} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 text-ink">
                Root for <b>{g.root_for}</b> <span className="text-muted">over {g.against}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap font-semibold text-pos-rb-text">
                +{(g.d_playoffs * 100).toFixed(1)}pp
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No other game this week moves your playoff odds beyond the simulation&apos;s noise.</p>
      )}
      <p className="mt-2 text-xs text-muted">
        From the title simulation: your playoff odds in the seasons where each result happens against the seasons where
        it doesn&apos;t.
      </p>
    </>
  );
}

export default async function PlayoffsPage() {
  const [pp, ab] = await Promise.all([getPlayoffs(), getActionBoard()]);
  const lineups = pp.lineups ?? [];
  // one row per starting slot, a column per playoff week
  const rows = lineups[0]
    ? lineups[0].starters
        .map((_, i) => lineups.map((l) => l.starters[i]))
        .sort((a, b) => SLOT_ORDER.indexOf(a[0].slot) - SLOT_ORDER.indexOf(b[0].slot))
    : [];

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">Playoff plan</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Weeks {pp.weeks?.join(", ") ?? "15, 16, 17"}: your lineup, where it&apos;s thin, and who to stash. Every number
          already counts the chance a player is hurt by then.
        </p>

        {!pp.available || !pp.rank ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            The playoff plan isn&apos;t available right now.
          </div>
        ) : (
          <>
            <KpiRow
              items={[
                { label: "Playoff lineup", value: pp.rank.avg.toFixed(1), sub: "pts a week" },
                { label: "League rank", value: `${pp.rank.mine} of ${pp.rank.of}`, sub: `average ${pp.rank.league.toFixed(1)}` },
                { label: "Best", value: pp.rank.best.avg.toFixed(1), sub: pp.rank.best.team },
              ]}
            />

            {pp.rooting ? <Rooting r={pp.rooting} /> : null}

            <SectionHeading title="Your playoff lineup" />
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 font-medium">Slot</th>
                    {lineups.map((l) => (
                      <th key={l.week} className="px-3 py-2 font-medium">Wk {l.week}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((cells, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 align-top text-xs font-bold uppercase text-muted">{cells[0].slot}</td>
                      {cells.map((s, j) => (
                        <td key={j} className="px-3 py-2 align-top">
                          <div className="font-medium text-ink">
                            {s.name}
                            {s.ir ? <span className="ml-1 text-xs text-muted">(IR now)</span> : null}
                          </div>
                          <div className="text-xs text-muted">
                            {s.pts.toFixed(1)} · <Opp s={s} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-ink/5">
                    <td className="px-3 py-2 text-xs font-bold uppercase text-muted">Total</td>
                    {lineups.map((l) => (
                      <td key={l.week} className="px-3 py-2 font-display font-bold text-ink">{l.total.toFixed(1)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              &ldquo;Easy&rdquo; and &ldquo;tough&rdquo; are how that defense has treated the position this season — top
              and bottom eight of 32.
            </p>

            <SectionHeading title="Where you're thin" />
            {pp.thin?.length ? (
              <ul className="grid gap-2">
                {pp.thin.map((t) => (
                  <li key={t.pos} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2.5 text-sm shadow-sm">
                    <span className="flex items-center gap-2">
                      <PosBadge pos={t.pos} />
                      <span className="text-ink">
                        Your {t.pos}s project <b>{t.mine.toFixed(1)}</b> a week, the league&apos;s {t.league.toFixed(1)}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-semibold text-crimson">−{t.gap.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No position sits well below the league&apos;s average starters.</p>
            )}

            <SectionHeading title="Stash for the playoffs" />
            {pp.stashes?.length ? (
              <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                {pp.stashes.map((s) => (
                  <li key={s.name} className="py-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink">
                        <PosBadge pos={s.pos} />
                        <b>{s.name}</b> <span className="text-muted">{s.team}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-semibold text-ink">
                        +{s.gain.toFixed(1)} <span className="font-normal text-muted">pts</span>
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {s.by_week.map((b, i) => (
                        <span key={b.week}>
                          {i ? " · " : ""}wk {b.week} +{b.gain.toFixed(1)} <Opp s={b} />
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No free agent would start for you in the playoffs right now.</p>
            )}
            <p className="mt-2 text-xs text-muted">
              What each would add to your playoff lineup across the three weeks, summed. The waiver board decides when a
              roster spot is worth spending on him now.
            </p>

            {pp.blocks?.length ? (
              <>
                <SectionHeading title="Keep away from rivals" />
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {pp.blocks.map((b) => (
                    <li key={b.name} className="py-2.5 text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-ink">
                          <PosBadge pos={b.pos} />
                          <b>{b.name}</b> <span className="text-muted">{b.team}</span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-semibold text-crimson">
                          −{(b.my_title_drop * 100).toFixed(1)}pp
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        If {b.rival} adds him: +{b.rival_gain.toFixed(1)} pts to their playoff lineup, your title odds{" "}
                        −{(b.my_title_drop * 100).toFixed(1)} points (±{(b.se * 100).toFixed(1)}).
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Each is handed, in the title simulation, to the rival whose playoff lineup he helps most — the
                  likeliest to claim him. Only drops beyond the simulation&apos;s own noise are shown.
                </p>
              </>
            ) : null}

            {pp.handcuffs?.length ? (
              <>
                <SectionHeading title="Handcuffs" />
                <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
                  {pp.handcuffs.map((h) => (
                    <li key={h.starter} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 text-ink">
                        Behind <b>{h.starter}</b>: {h.cuff}
                        {h.clear_two ? "" : <span className="text-muted"> (a committee)</span>}
                      </span>
                      <span className={`shrink-0 whitespace-nowrap text-xs font-semibold ${h.mine ? "text-pos-rb-text" : h.owner === "free agent" ? "text-ink" : "text-muted"}`}>
                        {h.mine ? "yours" : h.owner}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
