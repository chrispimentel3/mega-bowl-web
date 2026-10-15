import { getRoster } from "@/lib/roster";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { KpiRow } from "@/components/KpiRow";
import { SectionHeading } from "@/components/SectionHeading";
import { RosterPlayerRow } from "@/components/RosterPlayerRow";

export const revalidate = 3600;

export default async function RosterPage() {
  const [roster, ab] = await Promise.all([getRoster(), getActionBoard()]);

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
