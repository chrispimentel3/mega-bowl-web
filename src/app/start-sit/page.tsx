import { getStartSit, type Call } from "@/lib/start-sit";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { SectionHeading } from "@/components/SectionHeading";
import { LineupRow } from "@/components/LineupRow";
import { KpiRow } from "@/components/KpiRow";

export const revalidate = 3600;

export default async function StartSitPage() {
  const [ss, ab] = await Promise.all([getStartSit(), getActionBoard()]);
  const calls = [...(ss.calls ?? [])].sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || b.p - a.p);
  const callFor = new Map(calls.map((c) => [c.sit, c]));

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ss.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!ss.available || !ss.kpis ? (
          <EmptyNote text="Projections aren't available right now, so lineup recommendations are off." />
        ) : (
          <>
            <AnswerCard headline={ss.headline} subhead={ss.subhead} />

            <div className="mt-4">
              <KpiRow
                items={[
                  { label: `Wk ${ss.next_week} proj total`, value: ss.kpis.proj_total.toFixed(1), sub: "optimal starting 9" },
                  { label: "Close calls", value: String(ss.kpis.close_calls), sub: "within 2 pts" },
                  {
                    label: "Vs consensus",
                    value: ss.kpis.differs ? String(ss.kpis.differs.length) : "—",
                    sub: ss.kpis.differs?.length ? "starters it would bench" : "same lineup",
                  },
                ]}
              />
            </div>

            {calls.length ? (
              <>
                <SectionHeading title="Close calls" />
                <div className="grid gap-2">
                  {calls.map((c) => (
                    <CallRow key={`${c.start}|${c.sit}`} c={c} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  The chance the player we start outscores the one on the bench, from each player&apos;s range of
                  outcomes. Under 55% is a coin flip, 55–65% a lean, 65% and up clear. The Scorecard checks every
                  week that the chances we show come true about as often as they say.
                </p>
              </>
            ) : null}

            <SectionHeading title="Recommended starters" />
            <div className="grid gap-3 sm:grid-cols-2">
              {ss.starters.map((row) => (
                <LineupRow key={row.player} row={row} />
              ))}
            </div>

            <SectionHeading title="Bench" />
            <div className="grid gap-3 sm:grid-cols-2">
              {ss.bench.map((row) => (
                <LineupRow key={row.player} row={row} call={callFor.get(row.player)} />
              ))}
            </div>

            <p className="mt-6 text-sm text-muted">
              The lineup is set on our own weekly projection — usage, role and this week&apos;s
              Vegas lines, blended with the consensus of six sites — with the consensus shown beside
              it. The Scorecard grades both lineups every week. On a coin flip either player is fine;
              if you want a tiebreaker, start the one with the bigger target share and the better
              team target rank, because volume holds up week to week and points do not.
            </p>
          </>
        )}
      </main>
    </>
  );
}

const VERDICT_RANK: Record<Call["verdict"], number> = { clear: 0, lean: 1, "coin flip": 2 };
const VERDICT_STYLE: Record<Call["verdict"], string> = {
  clear: "bg-pos-rb/15 text-pos-rb-text",
  lean: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "coin flip": "bg-line text-muted",
};

/** "Boston over White · 50% · coin flip"; tap for the reasons (signed points) and the context. */
function CallRow({ c }: { c: Call }) {
  return (
    <details className="group rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 text-sm text-ink">
          <span className="font-semibold">{c.start}</span> over <span className="font-semibold">{c.sit}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-display text-lg font-bold leading-none text-ink">{Math.round(c.p * 100)}%</span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${VERDICT_STYLE[c.verdict]}`}>{c.verdict}</span>
          <span className="text-xs text-muted transition-transform group-open:rotate-180" aria-hidden>▾</span>
        </span>
      </summary>
      <div className="mt-2 space-y-1.5 border-t border-line pt-2 text-sm">
        {c.verdict === "coin flip" ? <p className="text-ink">Either is fine.</p> : null}
        {c.why.length ? (
          <ul className="space-y-0.5 text-ink">
            {c.why.map((r) => (
              <li key={r.factor}>
                <span className="inline-block w-16 font-semibold tabular-nums">
                  {r.pts > 0 ? "+" : ""}
                  {r.pts.toFixed(1)}
                </span>
                {r.label}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-xs text-muted">
          {c.gap >= 0 ? `${c.start} projects ${c.gap.toFixed(1)} pts higher` : `${c.sit} projects ${(-c.gap).toFixed(1)} pts higher`}
          {c.why.length ? "; the reasons above add up to that gap." : "."}
        </p>
        {c.context.map((line) => (
          <p key={line} className="text-xs text-muted">
            {line}
          </p>
        ))}
      </div>
    </details>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
      {text}
    </div>
  );
}
