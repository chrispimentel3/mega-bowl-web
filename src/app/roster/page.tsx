import { getRoster } from "@/lib/roster";
import { getRoutes } from "@/lib/routes";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { KpiRow } from "@/components/KpiRow";
import { SectionHeading } from "@/components/SectionHeading";
import { RosterPlayerRow } from "@/components/RosterPlayerRow";
import { RouteTableRow } from "@/components/RouteTableRow";
import { RouteScatterChart } from "@/components/RouteScatterChart";

export const revalidate = 3600;

export default async function RosterPage() {
  const [roster, routes, ab] = await Promise.all([getRoster(), getRoutes(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!roster.available ? (
          <EmptyNote text="No stats yet for this season/week range." />
        ) : (
          <>
            <AnswerCard headline={roster.headline} subhead={roster.subhead} />

            {roster.kpis ? (
              <div className="mt-4">
                <KpiRow
                  items={[
                    { label: `Starters · L${roster.kpis.roll} proj`, value: roster.kpis.starters_proj.toFixed(0), sub: "sum of rolling avg" },
                    { label: "Roster Act−xFP", value: roster.kpis.roster_act_minus_xfp != null ? `${roster.kpis.roster_act_minus_xfp >= 0 ? "+" : ""}${roster.kpis.roster_act_minus_xfp.toFixed(0)}` : "—", sub: "over/under usage" },
                    { label: "Injury flags", value: String(roster.kpis.injury_flags), sub: "starters Q or worse" },
                  ]}
                />
              </div>
            ) : null}

            <SectionHeading title="Your roster" />
            <div className="grid gap-2 sm:grid-cols-2">
              {roster.roster.map((row) => (
                <RosterPlayerRow key={row.player} row={row} />
              ))}
            </div>
          </>
        )}

        {routes.available ? (
          <>
            <SectionHeading title="Route usage" />
            <p className="mb-3 text-sm text-muted">
              Target share tells you how big his slice is. These tell you how good the slice is:
              how often he&apos;s on the field, and how often it moves the chains. Dashed line is
              the {Math.round(routes.threshold * 100)}% league-winner rate for a WR.
            </p>
            {routes.scatter.length > 0 ? (
              <RouteScatterChart points={routes.scatter} threshold={routes.threshold} />
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {routes.table.map((row) => (
                <RouteTableRow key={row.player} row={row} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Routes are estimated from snap share × team dropbacks. Under {routes.min_routes} routes
              in the window, treat the rates as noise.
            </p>
          </>
        ) : null}
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
