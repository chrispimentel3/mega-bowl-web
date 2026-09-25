import { getTrades } from "@/lib/trades";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TradeOfferCard } from "@/components/TradeOfferCard";
import { TradeSearchExplorer } from "@/components/TradeSearchExplorer";
import Link from "next/link";

export const revalidate = 3600;

export default async function TradesPage() {
  const [tr, ab] = await Promise.all([getTrades(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <SectionHeading title="Trade around one player" />
        <TradeSearchExplorer />

        <SectionHeading title="Offers the league is set up for" />
        <p className="mt-4 text-sm text-muted">
          Built from your league&apos;s actual rosters — who has a surplus where you&apos;re thin,
          and what they&apos;re short of in return. The percentage is fairness on FantasyCalc
          trade value (the smaller side over the larger — 95%+ is close to even); &quot;addresses&quot;
          names the position the deal actually fixes for you. See{" "}
          <Link href="/logic#trade_value" className="text-navy hover:underline">
            Logic → what the value number actually is
          </Link>{" "}
          for how that&apos;s built.
        </p>

        {!tr.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No trade ideas cleared the fairness filter this run.
          </div>
        ) : (
          tr.groups.map((group) => (
            <div key={group.partner}>
              <SectionHeading title={group.partner} />
              <p className="mb-3 text-xs text-muted">
                {group.they_need
                  ? `Thin at ${group.they_need} — lead with that when you pitch it.`
                  : "No clear positional hole — pitch this one on value, not need."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.offers.map((offer, i) => (
                  <TradeOfferCard key={i} row={offer} />
                ))}
              </div>
            </div>
          ))
        )}

        {tr.roster_src ? (
          <p className="mt-6 text-xs text-muted">Rosters: {tr.roster_src}.</p>
        ) : null}
      </main>
    </>
  );
}
