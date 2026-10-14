import { getStartSit } from "@/lib/start-sit";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { SectionHeading } from "@/components/SectionHeading";
import { LineupRow } from "@/components/LineupRow";
import { KpiRow } from "@/components/KpiRow";

export const revalidate = 3600;

export default async function StartSitPage() {
  const [ss, ab] = await Promise.all([getStartSit(), getActionBoard()]);

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

            <SectionHeading title="Recommended starters" />
            <div className="grid gap-3 sm:grid-cols-2">
              {ss.starters.map((row) => (
                <LineupRow key={row.player} row={row} />
              ))}
            </div>

            <SectionHeading title="Bench" />
            <div className="grid gap-3 sm:grid-cols-2">
              {ss.bench.map((row) => (
                <LineupRow key={row.player} row={row} />
              ))}
            </div>

            <p className="mt-6 text-sm text-muted">
              The lineup is set on our own weekly projection — usage, role and this week&apos;s
              Vegas lines, blended with the consensus of six sites — with the consensus shown beside
              it. The Scorecard grades both lineups every week. Two estimates within about two points
              of each other is a coin flip, not a recommendation — when it&apos;s that close,
              start the player with the bigger target share and the better team target rank,
              because volume holds up week to week and points do not.
            </p>
          </>
        )}
      </main>
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
      {text}
    </div>
  );
}
