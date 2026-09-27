import { getWaivers, type WaiverLaneRow } from "@/lib/waivers";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { KpiRow } from "@/components/KpiRow";
import { SectionHeading } from "@/components/SectionHeading";
import { WaiverLaneCard } from "@/components/WaiverLaneCard";

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
                    label: "Bid now",
                    value: String(wv.lanes.bid_now.length),
                    sub: "help in the next 3 weeks",
                  },
                  {
                    label: "League has spent",
                    value: wv.market?.league_spend ? `$${wv.market.league_spend.toFixed(0)}` : "—",
                    sub: "total FAAB, incl. unlisted",
                  },
                ]}
              />
            </div>

            <p className="mt-4 text-sm text-muted">
              Every free agent is valued against your roster for the rest of the season — byes,
              injuries and IR returns included — and split by why he helps: he <b>starts</b>, he{" "}
              <b>covers</b> a bye or injury, or he <b>insures</b> a starter who might miss time. A
              player with none of the three sits in no lane, however many managers are adding him.
            </p>

            {wv.roster_notes.length ? (
              <ul className="mt-3 space-y-1 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink">
                {wv.roster_notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}

            <Lane
              title="Bid now"
              rows={wv.lanes.bid_now}
              blurb={`Adds more than ${wv.meta.tau_bid ?? 1} pts/wk to your lineup over the next three weeks.`}
              empty="Nothing available improves your lineup over the next three weeks. That's a real answer, not a missing one — hold the budget for a week when it isn't true."
            />
            <Lane
              title="Early signal"
              rows={wv.lanes.early_signal}
              blurb="Usage is rising before the points have. Ranked by the chance his role grows (fitted on 2021–25) times what it's worth to you if it does."
            />
            <Lane
              title="Stash"
              rows={wv.lanes.stash}
              blurb="Worth a bench spot for what he insures or covers, not for what he scores this week."
            />

            {wv.trade_chips.length ? (
              <p className="mt-6 text-sm text-muted">
                <b>Trade chips</b> — no fit on your roster, but two or more teams would start them:{" "}
                {wv.trade_chips.map((c) => c.player).join(", ")}.
              </p>
            ) : null}

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

function Lane({
  title,
  rows,
  blurb,
  empty,
}: {
  title: string;
  rows: WaiverLaneRow[];
  blurb: string;
  empty?: string;
}) {
  if (!rows.length && !empty) return null;
  return (
    <>
      <SectionHeading title={title} />
      <p className="mb-3 text-sm text-muted">{blurb}</p>
      {rows.length === 0 ? (
        <EmptyNote text={empty ?? ""} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <WaiverLaneCard key={row.player} row={row} />
          ))}
        </div>
      )}
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
