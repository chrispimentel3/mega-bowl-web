import { PosBadge } from "./PosBadge";
import type { WaiverSpecRow } from "@/lib/waivers";

export function WaiverSpecCard({ row }: { row: WaiverSpecRow }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PosBadge pos={row.pos} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{row.player}</p>
            <p className="text-xs text-muted">
              {row.nfl_team} · {row.ppg.toFixed(1)} pts/g
            </p>
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted">{row.upside}</p>
      </div>
    </div>
  );
}
