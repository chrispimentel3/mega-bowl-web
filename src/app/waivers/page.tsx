import { getWaivers, type PropMover } from "@/lib/waivers";
import { PosBadge } from "@/components/PosBadge";
import { PlayerName } from "@/components/PlayerCardProvider";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { AnswerCard } from "@/components/AnswerCard";
import { KpiRow } from "@/components/KpiRow";
import { WaiverLanes } from "@/components/WaiverLanes";
import { PostureChip } from "@/components/PostureChip";
import { StreamerBoard } from "@/components/StreamerBoard";

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
            <div className="mt-3">
              <PostureChip
                posture={wv.meta.title?.posture}
                pPlayoffs={wv.meta.title?.p_playoffs}
                pTitle={wv.meta.title?.p_title}
              />
            </div>

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

            <details className="mt-4 text-sm text-muted">
              <summary className="cursor-pointer font-medium text-ink">How players are valued</summary>
              <p className="mt-2">
                Every free agent is valued against your roster for the rest of the season — byes,
                injuries and IR returns included — and split by why he helps: he <b>starts</b>, he{" "}
                <b>covers</b> a bye or injury, or he <b>insures</b> a starter who might miss time. A
                player with none of the three sits in no lane, however many managers are adding him.
              </p>
            </details>

            {wv.roster_notes.length ? (
              <ul className="mt-3 space-y-1 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink">
                {wv.roster_notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}

            <WaiverLanes lanes={wv.lanes} tau={wv.meta.tau_bid ?? 1} />

            <StreamerBoard streamers={wv.streamers} />

            {wv.prop_movers?.length ? <PropMovers movers={wv.prop_movers} /> : null}

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

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
      {text}
    </div>
  );
}

function PropMovers({ movers }: { movers: PropMover[] }) {
  return (
    <>
      <SectionHeading title="The books moved these" />
      <p className="mb-2 text-sm text-muted">
        Sportsbooks re-price a player&apos;s workload when his role changes — usually days before the rankings do.
        A bigger line, or his first one, on catches or yards.
      </p>
      <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
        {movers.map((m) => (
          <li key={m.gsis_id} className="py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-ink">
                <PosBadge pos={m.pos} />
                <PlayerName name={m.player} pos={m.pos} className="font-semibold text-ink" />
                <span className="text-muted">{m.team}</span>
              </span>
              <span className={`shrink-0 whitespace-nowrap text-xs font-semibold ${m.owner === "FA" ? "text-pos-rb-text" : "text-muted"}`}>
                {m.owner === "FA" ? "free agent" : "yours"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">{m.why.join(" · ")}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        There&apos;s no prop history from past seasons to test this on, so the Scorecard grades each week&apos;s
        movers against what they score.
      </p>
    </>
  );
}
