import { PosBadge } from "./PosBadge";
import type { WaiverWorthRow } from "@/lib/waivers";

export function WaiverWorthCard({ row }: { row: WaiverWorthRow }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PosBadge pos={row.pos} />
            <span className="truncate font-semibold text-ink">{row.player}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {row.nfl_team} · {row.ppg.toFixed(1)} pts/g
            {row.drop ? ` · drop ${row.drop}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-pos-rb">
            ${Math.round(row.bid)}
          </p>
          <p className="text-[11px] text-muted">max ${Math.round(row.max_bid)}</p>
        </div>
      </div>
      <span className="mt-3 inline-block rounded-md bg-pos-rb/10 px-2 py-0.5 text-xs font-bold text-pos-rb">
        +{row.gain.toFixed(2)} to your starting nine
      </span>
      <p className="mt-2 text-sm text-muted">{row.why}</p>
    </div>
  );
}
