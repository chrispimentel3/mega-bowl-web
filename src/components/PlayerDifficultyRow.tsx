import { PosBadge } from "./PosBadge";
import { VerdictBadge } from "./VerdictBadge";
import type { PlayerDifficultyRow as Row } from "@/lib/matchups";

export function PlayerDifficultyRow({ row }: { row: Row }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <PosBadge pos={row.pos} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{row.player}</p>
          <p className="text-xs text-muted">
            {row.matchup} · {row.pa_pg.toFixed(1)} pa/g
          </p>
        </div>
      </div>
      <VerdictBadge verdict={row.verdict} />
    </div>
  );
}
