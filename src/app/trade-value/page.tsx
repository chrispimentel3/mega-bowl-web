import { getTradeValueTrend } from "@/lib/trends";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TrendChart } from "@/components/TrendChart";

export const revalidate = 3600;

export default async function TradeValuePage() {
  const [ab, valueTrend] = await Promise.all([getActionBoard(), getTradeValueTrend()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <SectionHeading title="Trade value, week by week" />
        <p className="mb-3 text-sm text-muted">
          Where the trade market ranks each player at their position (WR1 is the most valuable
          receiver), from FantasyCalc, a site whose values come from thousands of real trades. A
          riser is a sell and a faller a buy, if you believe the role hasn&apos;t changed.
        </p>
        {valueTrend.available ? (
          <TrendChart trend={valueTrend} unit="int" yLabel="Rank at position" />
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No trade-value history yet.
          </div>
        )}
      </main>
    </>
  );
}
