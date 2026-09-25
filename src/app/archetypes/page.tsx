import { getArchetypes } from "@/lib/archetypes";
import { getArchetypeTrend } from "@/lib/trends";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { ArchMineCard } from "@/components/ArchMineCard";
import { ArchetypeBoard } from "@/components/ArchetypeBoard";
import { TrendChart } from "@/components/TrendChart";

export const revalidate = 3600;

export default async function ArchetypesPage() {
  const [arch, trend, ab] = await Promise.all([getArchetypes(), getArchetypeTrend(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mt-4 text-sm text-muted">
          Every player scored 0–100 against the Mega Bowl league-winner blueprint, with
          thresholds prorated per game. QB rushing volume, RB early-ADP youth, WR sticky
          first-down production in the breakout window, TE alpha role on a WR-thin offense.
        </p>

        {!arch.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Blueprint scores aren&apos;t available right now.
          </div>
        ) : (
          <>
            <SectionHeading title="Your roster — archetype fit" />
            <div className="grid gap-3 sm:grid-cols-2">
              {arch.mine.map((row) => (
                <ArchMineCard key={row.player} row={row} />
              ))}
            </div>

            <SectionHeading title="Best fits — who to target" />
            <ArchetypeBoard rows={arch.board} />

            <SectionHeading title="Your roster's fit score over time" />
            <TrendChart trend={trend} yLabel="Fit (0–100)" />
          </>
        )}
      </main>
    </>
  );
}
