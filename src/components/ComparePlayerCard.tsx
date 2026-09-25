import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import { RoleCard } from "./RoleCard";
import { ThisWeekNote } from "./ThisWeekNote";
import { SeasonDetailCard } from "./SeasonDetailCard";
import type { PlayerDetail } from "@/lib/players";

export function ComparePlayerCard({ player, nextWeek }: { player: PlayerDetail; nextWeek: number }) {
  const seasons = Object.keys(player.seasons).sort((a, b) => Number(b) - Number(a));
  const s = seasons.length > 0 ? player.seasons[seasons[0]] : null;

  return (
    <div className="rounded-2xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <PlayerAvatar player={player.name} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <PosBadge pos={player.pos} />
            <p className="truncate text-sm font-bold text-ink">{player.name}</p>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted">
            <TeamLogo team={player.team || player.last_team} size={14} />
            {player.team || "no team"}
          </p>
        </div>
      </div>

      {!s ? (
        <p className="mt-3 text-sm text-muted">No {seasons[0] ?? "current"} regular-season games.</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Stat label="Games" value={String(s.games)} />
            <Stat label="Pts/g" value={s.pts_pg != null ? s.pts_pg.toFixed(1) : "—"} />
            <Stat label={s.usage_label} value={s.usage_fmt || "—"} />
          </div>

          {s.this_week ? (
            <div className="mt-3 rounded-lg bg-ink/[0.03] p-2">
              <ThisWeekNote thisWeek={s.this_week} nextWeek={nextWeek} />
            </div>
          ) : null}

          {s.role ? (
            <div className="mt-3">
              <RoleCard role={s.role} />
            </div>
          ) : null}

          {s.card.length > 0 ? (
            <div className="mt-3">
              <SeasonDetailCard rows={s.card} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink/[0.03] p-2 text-center">
      <p className="font-display text-sm font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[10px] font-medium text-muted">{label}</p>
    </div>
  );
}
