import { PosBadge } from "./PosBadge";
import type { RouteTableRow as Row } from "@/lib/routes";

export function RouteTableRow({ row }: { row: Row }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PosBadge pos={row.pos} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{row.player}</p>
            <p className="text-xs text-muted">
              {row.team} · {row.routes_pg?.toFixed(1) ?? "—"} rte/g
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-right">
          <div>
            <p className="text-sm font-bold text-ink">
              {row.tprr != null ? `${(row.tprr * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="text-[10px] text-muted">TPRR</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">
              {row.fd_rr != null ? `${(row.fd_rr * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="text-[10px] text-muted">1D/RR</p>
          </div>
        </div>
      </div>
      {row.route_flag ? (
        <span className="mt-2 inline-block rounded-md bg-pos-rb/10 px-1.5 py-0.5 text-[11px] font-bold text-pos-rb">
          {row.route_flag}
        </span>
      ) : null}
    </div>
  );
}
