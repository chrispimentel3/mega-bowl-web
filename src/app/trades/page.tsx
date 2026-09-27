import { getTrades } from "@/lib/trades";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TradeOfferCard } from "@/components/TradeOfferCard";
import { TradeSearchExplorer } from "@/components/TradeSearchExplorer";
import { TradeThesisCard } from "@/components/TradeThesisCard";
import { PostureChip } from "@/components/PostureChip";
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

        {tr.cards ? (
          <>
            <SectionHeading title="Offers that raise your title odds" />
            <div className="mb-3">
              <PostureChip posture={tr.meta?.posture} pPlayoffs={tr.meta?.p_playoffs} pTitle={tr.meta?.p_title} />
            </div>
            <p className="text-sm text-muted">
              Every 1-for-1 and 2-for-1 the engine can build ({tr.meta?.evaluated?.toLocaleString() ?? "—"} this
              week), priced at what the other manager would accept on FantasyCalc, then the best{" "}
              {tr.meta?.simulated ?? 25} played through {tr.meta?.seasons?.toLocaleString() ?? "6,000"} simulated
              seasons for both teams. Only offers that raise your title odds beyond the simulation&apos;s own
              noise are shown. Each says why, what would prove it wrong, and what it does to them. See{" "}
              <Link href="/logic#trade_theses" className="text-navy hover:underline">
                Logic → how offers are built
              </Link>
              .
            </p>
            {tr.cards.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
                No offer the league would plausibly take raises your title odds right now. That&apos;s a real
                answer — standing pat is a move.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {tr.cards.map((c, i) => (
                  <TradeThesisCard key={i} card={c} />
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted">
              Acceptance odds use {tr.meta?.priors ?? "estimated"} priors — the league has{" "}
              {tr.meta?.league_trades ?? 0} trade{tr.meta?.league_trades === 1 ? "" : "s"} on record, and they
              refit from its own trades once there are {tr.meta?.refit_at ?? 5}.
            </p>
          </>
        ) : !tr.available ? (
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
