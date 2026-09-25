import { getTrades } from "@/lib/trades";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TradeOfferCard } from "@/components/TradeOfferCard";

export const revalidate = 3600;

export default async function TradesPage() {
  const [tr, ab] = await Promise.all([getTrades(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mt-4 text-sm text-muted">
          Built from your league&apos;s actual rosters — who has a surplus where you&apos;re thin,
          and what they&apos;re short of in return.
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

        <p className="mt-2 text-xs text-muted">
          &ldquo;Trade around one player&rdquo; — the interactive search for offers around a
          specific player — needs live computation per query and isn&apos;t available on this
          statically-generated page yet; use the Streamlit dashboard for that.
        </p>
      </main>
    </>
  );
}
