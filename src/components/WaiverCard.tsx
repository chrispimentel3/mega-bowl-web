import { PosBadge } from "./PosBadge";
import type { WaiverRow } from "@/lib/action-board";

export function WaiverCard({ row }: { row: WaiverRow }) {
  const hasBid = row.bid != null;

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PosBadge pos={row.pos} />
            <span className="truncate font-semibold text-ink">{row.player}</span>
          </div>
          {row.drop ? <p className="mt-0.5 text-xs text-muted">drop {row.drop}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          {hasBid ? (
            <>
              <p className="font-display text-xl font-bold leading-none text-pos-rb">
                ${Math.round(row.bid ?? 0)}
              </p>
              <p className="text-[11px] text-muted">
                max ${Math.round(row.max_bid ?? 0)}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold leading-none text-ink">
                {(row.pg_recent ?? 0).toFixed(1)}
              </p>
              <p className="text-[11px] text-muted">pts/g</p>
            </>
          )}
        </div>
      </div>
      {hasBid && row.gain != null ? (
        <span className="mt-3 inline-block rounded-md bg-pos-rb/10 px-2 py-0.5 text-xs font-bold text-pos-rb">
          +{row.gain.toFixed(2)} to your starting nine
        </span>
      ) : null}
      <p className="mt-2 text-sm text-muted">{row.why}</p>
    </div>
  );
}
