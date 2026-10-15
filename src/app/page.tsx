import { getActionBoard } from "@/lib/action-board";
import { getDigest } from "@/lib/digest";
import { Masthead } from "@/components/Masthead";
import { AnswerCard } from "@/components/AnswerCard";
import { BasisNote } from "@/components/BasisNote";
import { SectionHeading } from "@/components/SectionHeading";
import { PlayerCard } from "@/components/PlayerCard";
import { WaiverCard } from "@/components/WaiverCard";
import { TradeCard } from "@/components/TradeCard";

export const revalidate = 3600;

export default async function Home() {
  const [ab, d] = await Promise.all([getActionBoard(), getDigest()]);
  const r = d.available ? d.my_result : null;

  return (
    <>
      <Masthead
        season={ab.season}
        week={ab.week}
        nextWeek={ab.next_week}
        rosterSrc={ab.roster_src}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {r ? (
          <details className="group mb-4 rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">
                Week {d.week}:{" "}
                <b className={r.won ? "text-pos-rb-text" : "text-crimson"}>
                  {r.won ? "W" : "L"} {r.points.toFixed(1)}–{r.opp_points.toFixed(1)}
                </b>{" "}
                vs {r.opponent}
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                {r.record} · all-play {r.allplay}{" "}
                <span className="inline-block transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
              {d.headlines.map((l) => (
                <li key={l.kind} className="flex gap-2 text-sm text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                  <span>{l.text}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <AnswerCard headline={ab.headline} subhead={ab.subhead} />

        <div className="mt-4">
          <BasisNote basis={ab.basis} />
        </div>

        {ab.xfp_available ? (
          <>
            <SectionHeading title="Shop these — points are ahead of the work" tone="sell" />
            {ab.shop.length === 0 ? (
              <EmptyNote text="Nobody on your roster is meaningfully outscoring his opportunity right now." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {ab.shop.map((row) => (
                  <PlayerCard key={row.player} row={row} tone="sell" />
                ))}
              </div>
            )}
            {ab.shop.length > 0 ? (
              <p className="mt-2 text-sm text-muted">
                Their value to a leaguemate is at its peak. Sell the name, not the role.
              </p>
            ) : null}

            <SectionHeading title="Hold these — the work is there, the points aren't yet" tone="buy" />
            {ab.hold.length === 0 ? (
              <EmptyNote text="Nobody is notably underperforming his opportunity." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {ab.hold.map((row) => (
                  <PlayerCard key={row.player} row={row} tone="buy" />
                ))}
              </div>
            )}
            {ab.hold.length > 0 ? (
              <p className="mt-2 text-sm text-muted">
                Don&apos;t sell into a cold streak — the usage says the points are coming.
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-8">
            <EmptyNote text="Expected-points data isn't available yet this season, so sell/hold flags are off." />
          </div>
        )}

        <SectionHeading title="Best waiver claims" />
        {ab.waivers.length === 0 ? (
          <EmptyNote text="Nothing on the wire improves your starting lineup this week. Your budget keeps." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ab.waivers.map((row) => (
              <WaiverCard key={row.player} row={row} />
            ))}
          </div>
        )}

        <SectionHeading title="Best trades to offer" />
        {ab.trades.length === 0 ? (
          <EmptyNote text="Nothing clears the fairness filter right now." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ab.trades.map((row, i) => (
              <TradeCard key={`${row.partner}-${i}`} row={row} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Full lists live under Waivers &amp; Trades.
      </footer>
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
      {text}
    </div>
  );
}
