import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { WoprRow } from "@/lib/wopr";

const TAG_STYLES: Record<string, string> = {
  SELL_HIGH: "bg-crimson/10 text-crimson",
  FADE: "bg-crimson/10 text-crimson",
  BUY_LOW: "bg-pos-rb/10 text-pos-rb",
  UNDERPRICED: "bg-pos-rb/10 text-pos-rb",
  RISER: "bg-navy/10 text-navy",
  ROLE_JUMP: "bg-navy/10 text-navy",
};

function Tags({ tags }: { tags: string }) {
  if (!tags) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.split(",").filter(Boolean).map((t) => (
        <span
          key={t}
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${TAG_STYLES[t] ?? "bg-ink/5 text-muted"}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function WoprTable({ rows, showOwner = false }: { rows: WoprRow[]; showOwner?: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        Nothing flagged here right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={`${row.name}-${row.owner ?? ""}`} className="rounded-xl border border-line bg-card p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <PlayerAvatar player={row.name} size={28} />
              <PosBadge pos={row.pos} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{row.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <TeamLogo team={row.team_2026_nfl} size={14} />
                  {row.team_2026_nfl}
                  {showOwner && row.owner ? ` · ${row.owner}` : ""}
                  {row.board_posrank != null ? ` · board #${Math.round(row.board_posrank)}` : ""}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-bold leading-none text-ink">
                {row.wopr_anchored.toFixed(3)}
              </p>
              <p className="text-[11px] text-muted">WOPR</p>
            </div>
          </div>
          <Tags tags={row.tags} />
        </div>
      ))}
    </div>
  );
}
