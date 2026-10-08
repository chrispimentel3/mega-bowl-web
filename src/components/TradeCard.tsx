import type { TradeRow } from "@/lib/action-board";
import { PlayerList } from "@/components/PlayerCardProvider";
import { SitsNote } from "@/components/SitsNote";

export function TradeCard({ row }: { row: TradeRow }) {
  const fairnessPct = Math.round(row.fairness * 100);
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{row.partner}</span>
        {row.p_accept != null ? (
          <span className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
            ~{Math.round(row.p_accept * 100)}% they say yes
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <span className="text-[11px] uppercase tracking-wide text-muted">You give</span>
        <p className="font-medium text-ink"><PlayerList text={row.give} /></p>
        <span className="block pt-1 text-[11px] uppercase tracking-wide text-muted">You get</span>
        <p className="font-medium text-ink"><PlayerList text={row.get} /></p>
      </div>
      <p className="mt-3 text-xs text-muted">
        {row.d_me != null ? (
          <>
            <span className={`font-bold ${row.d_me >= 0 ? "text-pos-rb-text" : "text-crimson"}`}>
              {row.d_me >= 0 ? "+" : ""}{row.d_me.toFixed(1)} pts/wk
            </span>{" "}
            to your lineup ·{" "}
          </>
        ) : null}
        they get {fairnessPct}% of the market value they give up · addresses {row.addresses}
      </p>
      <SitsNote lines={row.sits_for_them} className="mt-1" />
    </div>
  );
}
