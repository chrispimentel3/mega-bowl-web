import { getWaivers } from "@/lib/waivers";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { KpiRow } from "@/components/KpiRow";
import { SectionHeading } from "@/components/SectionHeading";
import { WaiverWorthCard } from "@/components/WaiverWorthCard";
import { WaiverSpecCard } from "@/components/WaiverSpecCard";

export const revalidate = 3600;

export default async function WaiversPage() {
  const [wv, ab] = await Promise.all([getWaivers(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!wv.available ? (
          <EmptyNote text="League intel unavailable." />
        ) : !wv.need_aware ? (
          <RosterBlindBoard rows={wv.blind_board} />
        ) : (
          <>
            <AnswerCard headline={wv.headline} subhead={wv.subhead} />

            <div className="mt-4">
              <KpiRow
                items={[
                  {
                    label: "Your FAAB",
                    value: wv.faab?.known ? `$${wv.faab.mine}` : "—",
                    sub: wv.faab?.known ? `${wv.faab.richer} of ${(wv.faab.teams ?? 1) - 1} hold more` : "not cached",
                  },
                  {
                    label: "Worth bidding on",
                    value: String(wv.worth.length),
                    sub: "change your lineup",
                  },
                  {
                    label: "League has paid",
                    value: wv.market?.claims ? `$${wv.market.median.toFixed(0)}` : "—",
                    sub: wv.market?.claims ? `${wv.market.claims} settled claims` : "no claims yet",
                  },
                ]}
              />
            </div>

            <SectionHeading title="Worth bidding on" />
            {wv.worth.length === 0 ? (
              <EmptyNote text="Nothing available improves your starting lineup this week. That's a real answer, not a missing one — hold the budget for a week when it isn't true." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {wv.worth.map((row) => (
                  <WaiverWorthCard key={row.player} row={row} />
                ))}
              </div>
            )}

            <SectionHeading title="Speculative" />
            <p className="mb-3 text-sm text-muted">
              These add nothing to your lineup today, so they&apos;re ranked by who&apos;s
              trending instead. A dollar at most, and only for a bench spot you don&apos;t mind
              wasting.
            </p>
            <div className="space-y-2">
              {wv.speculative.map((row) => (
                <WaiverSpecCard key={row.player} row={row} />
              ))}
            </div>

            {wv.market?.unlisted_spend ? (
              <p className="mt-4 text-xs text-muted">
                Yahoo&apos;s FAB feed lists only claims that went to a waiver run, so $
                {wv.market.unlisted_spend.toFixed(0)} of the ${wv.market.league_spend.toFixed(0)}{" "}
                this league has actually spent never appears on it. The real market runs dearer
                than the ${wv.market.median.toFixed(0)} median suggests.
              </p>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}

function RosterBlindBoard({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <>
      <p className="mt-4 text-sm text-muted">
        Free agents ranked by whether their role actually changed, not just whether they had one
        good week. Rosters weren&apos;t available this run, so this board isn&apos;t priced
        against your actual lineup.
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-line bg-card p-3 shadow-sm">
            <p className="text-sm font-semibold text-ink">
              {String(row.player ?? "—")}{" "}
              <span className="font-normal text-muted">{String(row.pos ?? "")}</span>
            </p>
            {row.why ? <p className="mt-1 text-sm text-muted">{String(row.why)}</p> : null}
          </div>
        ))}
      </div>
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
