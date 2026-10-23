import type { CardRow } from "@/lib/players";

/** `compact`: the narrow compare column — smaller text and padding so the table fits 270px. */
export function SeasonDetailCard({ rows, compact = false }: { rows: CardRow[]; compact?: boolean }) {
  const cell = compact ? "px-2 py-1.5" : "px-3 py-2";
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className={`w-full ${compact ? "text-xs" : "text-sm"}`}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stat} className="border-b border-line last:border-0 even:bg-ink/[0.02]">
              <td className={`${cell} text-ink`} title={r.means || undefined}>
                {r.stat}
              </td>
              <td className={`${cell} text-right font-semibold text-ink`}>{r.value_fmt}</td>
              <td className={`${cell} whitespace-nowrap text-right text-xs text-muted`}>{r.pos_rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
