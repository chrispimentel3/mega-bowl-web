import Link from "next/link";
import { getActionBoard } from "@/lib/action-board";
import { getDigest } from "@/lib/digest";
import { getStartSit } from "@/lib/start-sit";
import { getPlayoffs } from "@/lib/playoffs";
import { getTrades } from "@/lib/trades";
import { Masthead } from "@/components/Masthead";
import { BasisNote } from "@/components/BasisNote";
import { RefreshButton } from "@/components/RefreshButton";

export const revalidate = 3600;

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** One decision, answered in a line, with the page that has the rest. */
function Answer({ label, href, line, sub }: { label: string; href: string; line: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-line bg-card px-4 py-3 shadow-sm transition-colors hover:border-navy/40"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
        <span className="shrink-0 text-xs text-navy group-hover:underline">More →</span>
      </div>
      <p className="mt-1 text-sm font-medium text-ink">{line}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </Link>
  );
}

export default async function Home() {
  const [ab, d, ss, pp, tr] = await Promise.all([getActionBoard(), getDigest(), getStartSit(), getPlayoffs(), getTrades()]);
  const r = d.available ? d.my_result : null;
  const claim = ab.waivers.find((w) => w.bid != null) ?? null;
  const trade = ab.trades[0] ?? null;
  const mine = pp.rooting?.mine ?? null;
  const root = (pp.rooting?.games ?? []).filter((g) => !g.noise);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
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

        <h1 className="font-display text-xl font-bold text-ink">Week {ab.next_week}</h1>
        <div className="mt-3 grid gap-3">
          <RefreshButton />
          <Answer
            label="Lineup"
            href="/start-sit"
            line={ss.available ? ss.headline : "Projections aren't available right now."}
            sub={ss.available ? ss.subhead : undefined}
          />
          <Answer
            label="Waivers"
            href="/waivers"
            line={
              claim
                ? <>Claim <b>{claim.player}</b> ({claim.pos}) for ${claim.bid}{claim.drop ? `, drop ${claim.drop}` : ""}</>
                : "Nothing on the wire improves your lineup. Keep the budget."
            }
            sub={claim?.why}
          />
          <Answer
            label="Trades"
            href="/trades"
            line={
              tr.closed
                ? "The trade deadline has passed."
                : trade
                  ? <>Offer {trade.give} to <b>{trade.partner}</b> for {trade.get}</>
                  : "No offer the league would take raises your title odds right now."
            }
            sub={
              !tr.closed && trade && trade.p_accept != null
                ? `${pct(trade.p_accept)} likely to be accepted${trade.d_me != null ? ` · +${trade.d_me.toFixed(1)} pts a week` : ""}`
                : undefined
            }
          />
          {mine ? (
            <Answer
              label="Playoffs"
              href="/playoffs"
              line={
                <>
                  vs {mine.opp}: <b>{pct(mine.playoffs_if_win)}</b> playoff odds with a win, {pct(mine.playoffs_if_lose)} with
                  a loss
                </>
              }
              sub={
                root.length
                  ? `Also root for ${root.slice(0, 2).map((g) => g.root_for).join(" and ")}.`
                  : `${pct(mine.p_win)} to win.`
              }
            />
          ) : null}
        </div>

        {ab.basis ? (
          <div className="mt-4">
            <BasisNote basis={ab.basis} />
          </div>
        ) : null}
      </main>
    </>
  );
}
