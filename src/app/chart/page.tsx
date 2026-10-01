import { Suspense } from "react";
import { getActionBoard } from "@/lib/action-board";
import { getStatsTable } from "@/lib/statsTable";
import { Masthead } from "@/components/Masthead";
import { ChartBuilder } from "@/components/ChartBuilder";

export const revalidate = 3600;

export default async function ChartPage() {
  const [ab, table] = await Promise.all([getActionBoard(), getStatsTable()]);
  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">Chart builder</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Put any two stats against each other for every player at the positions you pick —
          the same season numbers the player cards rank on. Start from a preset or pick your own,
          name the players you care about, and copy the link to send the exact chart. Hover a dot
          for the player, click it for his card.
        </p>
        {/* the builder reads its starting chart from the address, which needs a Suspense boundary */}
        <Suspense fallback={null}>
          <ChartBuilder table={table} />
        </Suspense>
      </main>
    </>
  );
}
