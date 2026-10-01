import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { LineupRow as LineupRowType } from "@/lib/start-sit";
import { PlayerName } from "@/components/PlayerCardProvider";
import { STEPS, defenseSentence, ptsShort, step, vegasLineSentence } from "@/lib/matchupVerdict";

export function LineupRow({ row }: { row: LineupRowType }) {
  const edge = row.vegas_edge;
  const m = row.matchup_pct != null ? STEPS[step(row.matchup_pct)] : null;
  const defense = defenseSentence(row.opp, row.matchup_def_rank, row.pos);
  const teamLine = vegasLineSentence(row.nfl_team, row.matchup_vegas_pct, row.matchup_basis);

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-11 shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted">
              {row.lineup}
            </span>
            <PlayerAvatar player={row.player} size={28} />
            <PosBadge pos={row.pos} />
            <PlayerName name={row.player} pos={row.pos} className="truncate font-semibold text-ink" />
            <TeamLogo team={row.nfl_team} size={16} />
            {row.report_status ? (
              <span className="rounded-md bg-crimson/10 px-1.5 py-0.5 text-[11px] font-bold text-crimson">
                {row.report_status}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {row.nfl_team}
            {row.opp ? ` · ${row.opp}` : ""}
            {row.tgt_pct != null ? ` · ${(row.tgt_pct * 100).toFixed(0)}% tgt` : ""}
            {row.tm_rank != null ? ` · TM#${Math.round(row.tm_rank)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-ink">
            {row.proj_adj?.toFixed(1) ?? "—"}
          </p>
          <p className="text-[11px] text-muted">proj</p>
        </div>
      </div>

      {m || row.close_call ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m ? (
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${m.chip}`}>
              {m.label} matchup{ptsShort(row.matchup_pts) ? ` · ${ptsShort(row.matchup_pts)}` : ""}
            </span>
          ) : null}
          {row.close_call ? (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              close call {row.close_call}
            </span>
          ) : null}
        </div>
      ) : null}

      {defense || teamLine || row.vegas != null ? (
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {defense ? <li>{defense}</li> : null}
          {teamLine ? <li>{teamLine}</li> : null}
          {row.vegas != null ? (
            <li>
              Vegas player props project <b className="text-ink">{row.vegas.toFixed(1)}</b> pts
              {edge != null && Math.abs(edge) >= 0.5 ? (
                <> — <span className={edge > 0 ? "text-pos-rb" : "text-crimson"}>
                  {Math.abs(edge).toFixed(1)} {edge > 0 ? "more" : "less"}
                </span> than our projection</>
              ) : <>, in line with our projection</>}.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
