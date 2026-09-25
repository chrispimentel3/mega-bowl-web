import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import type { RosterRow } from "@/lib/roster";

export function RosterPlayerRow({ row }: { row: RosterRow }) {
  const diff = row.xfp_diff;
  const diffColor = diff == null ? "" : diff >= 0 ? "text-crimson" : "text-pos-rb";

  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-8 shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted">
            {row.slot}
          </span>
          <PlayerAvatar player={row.player} size={28} />
          <PosBadge pos={row.pos} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {row.player}
              {row.report_status ? (
                <span className="ml-1.5 rounded-md bg-crimson/10 px-1.5 py-0.5 text-[10px] font-bold text-crimson">
                  {row.report_status}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted">
              {row.opp ? `${row.opp} · ` : ""}
              {row.tgt_pct != null ? `${(row.tgt_pct * 100).toFixed(0)}% tgt · ` : ""}
              {row.tm_rank != null ? `TM#${Math.round(row.tm_rank)}` : ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-bold leading-none text-ink">
            {row.roll_pg.toFixed(1)}
          </p>
          <p className="text-[11px] text-muted">pts/g</p>
        </div>
      </div>
      {diff != null ? (
        <span className={`mt-2 inline-block rounded-md bg-ink/5 px-1.5 py-0.5 text-[11px] font-bold ${diffColor}`}>
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)} xFP±
        </span>
      ) : null}
    </div>
  );
}
