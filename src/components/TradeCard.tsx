import type { TradeRow } from "@/lib/action-board";

export function TradeCard({ row }: { row: TradeRow }) {
  const fairnessPct = Math.round(row.fairness * 100);
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{row.partner}</span>
        <span className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
          {fairnessPct}% fair
        </span>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted">You give</span>
          <span className="text-xs text-muted">value {row.give_val}</span>
        </div>
        <p className="font-medium text-ink">{row.give}</p>
        <div className="flex items-baseline justify-between gap-2 pt-1">
          <span className="text-[11px] uppercase tracking-wide text-muted">You get</span>
          <span className="text-xs text-muted">value {row.get_val}</span>
        </div>
        <p className="font-medium text-ink">{row.get}</p>
      </div>
      <span className="mt-3 inline-block rounded-md bg-crimson/10 px-2 py-0.5 text-xs font-bold text-crimson">
        addresses {row.addresses}
      </span>
    </div>
  );
}
