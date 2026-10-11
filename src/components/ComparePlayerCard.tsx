import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import { RoleCard } from "./RoleCard";
import { MatchupScore } from "./MatchupScore";
import { SeasonDetailCard } from "./SeasonDetailCard";
import type { PlayerDetail } from "@/lib/players";

export function ComparePlayerCard({ player, nextWeek }: { player: PlayerDetail; nextWeek: number }) {
  const seasons = Object.keys(player.seasons).sort((a, b) => Number(b) - Number(a));
  const s = seasons.length > 0 ? player.seasons[seasons[0]] : null;

  return (
    // Five fixed rows (header, numbers, matchup, role, detail) on the page's grid via subgrid:
    // each row is as tall as the tallest card's, so the same section lines up across cards.
    <div className="row-span-5 grid grid-rows-subgrid gap-y-3 rounded-2xl border border-line bg-card p-3 shadow-sm">
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
        <p className="row-span-4 text-sm text-muted">No {seasons[0] ?? "current"} regular-season games.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Games" value={String(s.games)} />
            <Stat label="Pts/g" value={s.pts_pg != null ? s.pts_pg.toFixed(1) : "—"} />
            <Stat label={s.usage_label} value={s.usage_fmt || "—"} />
          </div>

          {/* always one child per row, even when empty, so the rows stay in step */}
          <div>{s.this_week ? <MatchupScore tw={s.this_week} pos={player.pos} week={nextWeek} /> : null}</div>
          <div>{s.role ? <RoleCard role={s.role} compact /> : null}</div>
          <div>{s.card.length > 0 ? <SeasonDetailCard rows={s.card} /> : null}</div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink/[0.03] p-2 text-center">
      <p className="font-display text-sm font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </div>
  );
}
