import { getWopr } from "@/lib/wopr";
import { getWoprTrend } from "@/lib/trends";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { WoprTable } from "@/components/WoprTable";
import { TrendChart } from "@/components/TrendChart";

export const revalidate = 3600;

export default async function WoprPage() {
  const [w, trend, ab] = await Promise.all([getWopr(), getWoprTrend(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mt-4 text-sm text-muted">
          <strong>Weighted Opportunity Rating</strong> — how much receiving opportunity each
          WR/TE earns (target share + air-yards share), split by who owns them. Blends last
          season with this one on a 3-game prior; a tag flags points running ahead of or behind
          the underlying role.
        </p>

        {!w.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Receiving opportunity data isn&apos;t available right now.
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted">
              Ownership: {w.meta.ownership_source} · baseline {w.meta.base_season} · value axis =
              board VOR (preseason).
            </p>

            <SectionHeading title="Your WR/TE — sell / hold" />
            <p className="mb-3 text-sm text-muted">
              SELL_HIGH / FADE = points ran ahead of opportunity, shop them. BUY_LOW = hold,
              don&apos;t sell low.
            </p>
            <WoprTable rows={w.mine} />

            <SectionHeading title="Trade targets on other rosters" />
            <p className="mb-3 text-sm text-muted">
              Players whose opportunity outstrips their price or is trending up.
            </p>
            <WoprTable rows={w.opp} showOwner />

            <SectionHeading title="Waiver adds (free agents)" />
            <p className="mb-3 text-sm text-muted">
              Unrostered WR/TE clearing a startable opportunity bar or jumping in role.
            </p>
            <WoprTable rows={w.fa} />

            <SectionHeading title="Opportunity over time" />
            <p className="mb-3 text-sm text-muted">
              Your WR/TE&apos;s weighted opportunity rating, week by week.
            </p>
            <TrendChart trend={trend} percent yLabel="WOPR" />
          </>
        )}
      </main>
    </>
  );
}
