import type { CardRow } from "@/lib/players";

export function SeasonDetailCard({ rows }: { rows: CardRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.stat} className="border-b border-line last:border-0 even:bg-ink/[0.02]">
              <td className="px-3 py-2 text-ink" title={r.means || undefined}>
                {r.stat}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-ink">{r.value_fmt}</td>
              <td className="px-3 py-2 text-right text-xs text-muted">{r.pos_rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
