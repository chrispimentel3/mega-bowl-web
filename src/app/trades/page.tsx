import { getTrades } from "@/lib/trades";
import { getTradeValueTrend } from "@/lib/trends";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TradeOfferCard } from "@/components/TradeOfferCard";
import { TradeSearchExplorer } from "@/components/TradeSearchExplorer";
import { TradeEvaluator } from "@/components/TradeEvaluator";
import { TradeThesisList } from "@/components/TradeThesisList";
import { PostureChip } from "@/components/PostureChip";
import { TrendChart } from "@/components/TrendChart";
import Link from "next/link";
import { PlayerCard } from "@/components/PlayerCard";

export const revalidate = 3600;

export default async function TradesPage() {
  const [tr, ab, valueTrend] = await Promise.all([getTrades(), getActionBoard(), getTradeValueTrend()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {tr.closed ? (
          <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
            <p className="font-display text-base font-bold text-ink">Trading is closed</p>
            <p className="mt-1 text-sm text-muted">
              The deadline was {fmtDeadline(tr.deadline)}. What&apos;s left is waivers and your{" "}
              <Link href="/playoffs" className="text-navy hover:underline">playoff plan</Link>.
            </p>
          </div>
        ) : (
          <>
        <DeadlineLine deadline={tr.deadline} />

        <SectionHeading title="Evaluate a trade" />
        <TradeEvaluator />

        <SectionHeading title="Trade around one player" />
        <TradeSearchExplorer />

        {tr.cards ? (
          <>
            <SectionHeading title="Offers that raise your title odds" />
            <div className="mb-3">
              <PostureChip posture={tr.meta?.posture} pPlayoffs={tr.meta?.p_playoffs} pTitle={tr.meta?.p_title} />
            </div>
            <details className="text-sm text-muted">
              <summary className="cursor-pointer font-medium text-ink">How offers are built</summary>
              <p className="mt-2">
              Every 1-for-1 and 2-for-1 the engine can build ({tr.meta?.evaluated?.toLocaleString() ?? "—"} this
              week), priced at what the other manager would accept on FantasyCalc, then the best{" "}
              {tr.meta?.simulated ?? 25} played through {tr.meta?.seasons?.toLocaleString() ?? "6,000"} simulated
              seasons for both teams. Only offers that raise your title odds beyond the simulation&apos;s own
              noise are shown. Each says why, what would prove it wrong, and what it does to them. The
              acceptance odds are estimates — Yahoo never shows the offers that get turned down, so
              there is nothing to fit them to yet. See{" "}
              <Link href="/logic#trade_theses" className="text-navy hover:underline">
                Logic → how offers are built
              </Link>
              .
            </p>
            </details>
            {tr.cards.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
                No offer the league would plausibly take raises your title odds right now. That&apos;s a real
                answer — standing pat is a move.
              </div>
            ) : (
              <TradeThesisList cards={tr.cards} />
            )}
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

        {ab.xfp_available && (ab.shop.length || ab.hold.length) ? (
          <>
            {ab.shop.length ? (
              <>
                <SectionHeading title="Shop these — points are ahead of the work" tone="sell" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {ab.shop.map((row) => (
                    <PlayerCard key={row.player} row={row} tone="sell" />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">
                  Their value to a leaguemate is at its peak. Sell the name, not the role.
                </p>
              </>
            ) : null}
            {ab.hold.length ? (
              <>
                <SectionHeading title="Hold these — the work is there, the points aren't yet" tone="buy" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {ab.hold.map((row) => (
                    <PlayerCard key={row.player} row={row} tone="buy" />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">
                  Don&apos;t sell into a cold streak — the usage says the points are coming.
                </p>
              </>
            ) : null}
          </>
        ) : null}

        {valueTrend.available ? (
          <>
            <SectionHeading title="Trade value, week by week" />
            <p className="mb-3 text-sm text-muted">
              What the market (FantasyCalc) will pay for each player, and who moved most since the last
              snapshot — a riser is a sell, a faller a buy, if you believe the role hasn&apos;t changed.
            </p>
            <TrendChart trend={valueTrend} unit="int" yLabel="Trade value" />
          </>
        ) : null}

        {tr.roster_src ? (
          <p className="mt-6 text-xs text-muted">Rosters: {tr.roster_src}.</p>
        ) : null}
          </>
        )}
      </main>
    </>
  );
}

function fmtDeadline(d?: string) {
  if (!d) return "the league's trade end date";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function DeadlineLine({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  // Eastern calendar days, same clock as Yahoo's
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const end = new Date(`${deadline}T23:59:59`);
  const days = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000) - 1);
  return (
    <p className={`mb-1 text-sm ${days <= 7 ? "font-semibold text-crimson" : "text-muted"}`}>
      Trade deadline {fmtDeadline(deadline)} ·{" "}
      {days === 0 ? "today is the last day" : `${days} day${days === 1 ? "" : "s"} left`}
    </p>
  );
}
