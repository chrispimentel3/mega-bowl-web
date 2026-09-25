import { PosBadge } from "./PosBadge";
import type { ShopHoldRow } from "@/lib/action-board";

export function PlayerCard({ row, tone }: { row: ShopHoldRow; tone: "sell" | "buy" }) {
  const diffColor = tone === "sell" ? "text-crimson" : "text-pos-rb";
  const diffBg = tone === "sell" ? "bg-crimson/10" : "bg-pos-rb/10";

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PosBadge pos={row.pos} />
            <span className="truncate font-semibold text-ink">{row.player}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {row.slot}
            {row.tgt_pct != null ? ` · ${(row.tgt_pct * 100).toFixed(0)}% tgt` : ""}
            {row.tm_rank != null ? ` · TM#${Math.round(row.tm_rank)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-ink">
            {row.half_ppr_pg.toFixed(1)}
          </p>
          <p className="text-[11px] text-muted">pts/g</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${diffColor} ${diffBg}`}>
          {row.per_g >= 0 ? "+" : ""}
          {row.per_g.toFixed(1)}/g vs opportunity
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">{row.why}</p>
    </div>
  );
}
