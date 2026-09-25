import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { ArchMineRow } from "@/lib/archetypes";

export function ArchMineCard({ row }: { row: ArchMineRow }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PlayerAvatar player={row.player} size={32} />
          <PosBadge pos={row.pos} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{row.player}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <TeamLogo team={row.team} size={14} />
              {row.team}
              {row.age != null ? ` · age ${row.age.toFixed(0)}` : ""}
              {row.exp_yrs != null ? ` · yr ${row.exp_yrs.toFixed(0)}` : ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-ink">
            {row.arch_fit.toFixed(0)}
          </p>
          <p className="text-[11px] text-muted">fit</p>
        </div>
      </div>
      <div className="mt-2 min-h-[22px]">
        {row.tags ? (
          <span className="inline-block rounded-md bg-navy/10 px-1.5 py-0.5 text-[11px] font-bold text-navy">
            {row.tags}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted">{row.why}</p>
    </div>
  );
}
