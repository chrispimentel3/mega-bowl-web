import type { TeamEnvRow } from "@/lib/matchups";

export function TeamEnvironmentCard({ row }: { row: TeamEnvRow }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {row.team} <span className="font-normal text-muted">{row.matchup}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{row.players || "no rostered players"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-ink">
            {row.implied_pts != null ? row.implied_pts.toFixed(1) : "—"}
          </p>
          <p className="text-[11px] text-muted">implied</p>
        </div>
      </div>
      {row.total != null ? (
        <p className="mt-2 text-xs text-muted">
          O/U {row.total.toFixed(1)}
          {row.spread != null ? ` · ${row.spread >= 0 ? "+" : ""}${row.spread.toFixed(1)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
