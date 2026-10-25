import type { Metadata } from "next";
import { getLeafs } from "@/lib/leafs";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { KpiRow } from "@/components/KpiRow";
import { SectionHeading } from "@/components/SectionHeading";
import { LeafsSkaters, LeafsTrends } from "@/components/LeafsDashboard";

export const revalidate = 1800;
export const metadata: Metadata = { title: "Leafs · Mega Bowl" };

const RESULT_TONE = { W: "text-pos-rb-text", L: "text-crimson", OTL: "text-muted" } as const;

export default async function LeafsPage() {
  const [leafs, ab] = await Promise.all([getLeafs(), getActionBoard()]);
  const { standing: s, games } = leafs;
  const recent = games.slice(-10).reverse();

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <SectionHeading title={`Maple Leafs ${leafs.season}`} />
        {s ? (
          <div className="space-y-2">
            <KpiRow
              items={[
                { label: "Record", value: `${s.w}-${s.l}-${s.otl}`, sub: `${s.pts} pts in ${s.gp} GP` },
                { label: "Points %", value: s.pointPctg.toFixed(3), sub: `${Math.round(s.pointPctg * 164)}-pt pace` },
                { label: "Atlantic", value: `#${s.divisionRank}`, sub: `#${s.leagueRank} in NHL` },
              ]}
            />
            <KpiRow
              items={[
                { label: "Goal diff", value: `${s.gf - s.ga > 0 ? "+" : ""}${s.gf - s.ga}`, sub: `${s.gf} GF · ${s.ga} GA` },
                { label: "Last 10", value: s.l10, sub: "W-L-OTL" },
                { label: "Streak", value: s.streak, sub: "current" },
              ]}
            />
          </div>
        ) : null}

        <SectionHeading title="Rolling form" />
        {games.length ? <LeafsTrends games={games} /> : <p className="text-sm text-muted">No regular-season games yet.</p>}

        <SectionHeading title="Last 10 games" />
        <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-2 py-2 text-left font-medium">Opp</th>
                <th className="px-2 py-2 text-left font-medium">Result</th>
                <th className="px-2 py-2 text-right font-medium" title="5v5 expected goals for–against (MoneyPuck)">5v5 xG</th>
                <th className="px-3 py-2 text-right font-medium" title="5v5 expected goals share">xGF%</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((g) => (
                <tr key={g.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-1.5 text-muted">{g.date.slice(5)}</td>
                  <td className="px-2 py-1.5 text-ink">{g.home ? "vs" : "@"} {g.opp}</td>
                  <td className={`px-2 py-1.5 font-semibold ${RESULT_TONE[g.result]}`}>
                    {g.result} {g.gf}-{g.ga}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted">
                    {g.xgf == null ? "—" : `${g.xgf.toFixed(1)}-${g.xga!.toFixed(1)}`}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-ink">{g.xgPct == null ? "—" : `${(g.xgPct * 100).toFixed(0)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leafs.upcoming.length ? (
          <p className="mt-2 text-xs text-muted">
            Next: {leafs.upcoming.map((g) => `${g.date.slice(5)} ${g.home ? "vs" : "@"} ${g.opp}`).join(" · ")}
          </p>
        ) : null}

        <SectionHeading title="Skaters" />
        <LeafsSkaters skaters={leafs.skaters} />

        <SectionHeading title="Goalies" />
        <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="px-3 py-2 text-left font-medium">Goalie</th>
                <th className="px-2 py-2 text-right font-medium">GP</th>
                <th className="px-2 py-2 text-right font-medium">W-L-OTL</th>
                <th className="px-2 py-2 text-right font-medium">SV%</th>
                <th className="px-2 py-2 text-right font-medium">GAA</th>
                <th className="px-3 py-2 text-right font-medium" title="Goals saved above expected, all situations (MoneyPuck)">GSAx</th>
              </tr>
            </thead>
            <tbody>
              {leafs.goalies.map((g) => (
                <tr key={g.id} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-1.5 font-medium text-ink">{g.name}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted">{g.gp}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted">{g.w}-{g.l}-{g.otl}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-ink">{g.svPct.toFixed(3).slice(1)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted">{g.gaa.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-ink">
                    {g.gsax == null ? "—" : `${g.gsax > 0 ? "+" : ""}${g.gsax.toFixed(1)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-muted">
          Results and box-score stats: NHL API. Expected goals, shot share, game score, GSAx:{" "}
          <a href="https://moneypuck.com" className="underline">MoneyPuck</a>. Refreshes every 30 minutes.
        </p>
      </main>
    </>
  );
}
