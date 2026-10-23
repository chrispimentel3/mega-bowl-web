import type { Matchup } from "@/lib/trades";

const pct = (p?: number) => (p == null ? "—" : `${Math.round(p * 100)}%`);
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}`;

/** Each remaining week with the trade: your points as worst / base / best (10th / 50th / 90th
 *  percentile of the simulated weeks) and, in the regular season, your chance to win before →
 *  after. mega/title_odds.py Model.matchups. Collapsed by default. */
export function WeekByWeek({ rows }: { rows?: Matchup[] | null }) {
  if (!rows?.length) return null;
  return (
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer select-none font-semibold text-ink">
        Week by week · worst / base / best
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-normal">Wk</th>
              <th className="py-1 font-normal">Opponent</th>
              <th className="py-1 text-right font-normal">Win</th>
              <th className="py-1 text-right font-normal">Base</th>
              <th className="py-1 text-right font-normal">Worst – best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.week} className="border-t border-line">
                <td className="py-1 text-muted">{m.week}</td>
                <td className="max-w-[9rem] truncate py-1 text-ink">{m.opp ?? "Playoffs"}</td>
                <td className="whitespace-nowrap py-1 text-right text-ink">
                  {m.opp ? `${pct(m.win_before)} → ${pct(m.win_after)}` : "—"}
                </td>
                <td className="whitespace-nowrap py-1 text-right font-medium text-ink">
                  {m.after[1].toFixed(0)}{" "}
                  <span className="font-normal text-muted">({signed(m.after[1] - m.before[1])})</span>
                </td>
                <td className="whitespace-nowrap py-1 text-right text-muted">
                  {m.after[0].toFixed(0)}–{m.after[2].toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-muted">
        Points with the trade; base change in brackets. A season&apos;s worst case isn&apos;t every week&apos;s worst at once.
      </p>
    </details>
  );
}
