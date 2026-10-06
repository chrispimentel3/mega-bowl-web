import { PosBadge } from "./PosBadge";
import { VerdictBadge } from "./VerdictBadge";
import type { PlayerDifficultyRow as Row } from "@/lib/matchups";
import { PlayerName } from "@/components/PlayerCardProvider";

export function PlayerDifficultyRow({ row }: { row: Row }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <PosBadge pos={row.pos} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink"><PlayerName name={row.player} pos={row.pos} /></p>
          <p className="text-xs text-muted">
            {row.matchup && row.pa_pg != null ? `${row.matchup} · ${row.pa_pg.toFixed(1)} pa/g` : "Bye week"}
          </p>
        </div>
      </div>
      <VerdictBadge verdict={row.verdict} />
    </div>
  );
}
