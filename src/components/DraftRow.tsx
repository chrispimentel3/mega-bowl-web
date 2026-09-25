import { PosBadge } from "./PosBadge";
import type { DraftBoardRow } from "@/lib/draft";

export function DraftRow({ row }: { row: DraftBoardRow }) {
  const up = row.value_delta >= 0;
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PosBadge pos={row.pos} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{row.player}</p>
            <p className="text-xs text-muted">
              {row.drafted_by} · rd {row.round}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-lg font-bold leading-none ${up ? "text-pos-rb" : "text-crimson"}`}>
            {up ? "+" : ""}
            {row.value_delta.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted">value {row.value.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}
