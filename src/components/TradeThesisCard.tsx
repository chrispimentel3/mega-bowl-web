import { PosBadge } from "./PosBadge";
import type { ThesisSide, TradeThesis } from "@/lib/trades";
import { PlayerName } from "@/components/PlayerCardProvider";
import { ScheduleTag } from "@/components/ScheduleTag";

const pts = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}`;
const pp = (s: ThesisSide) =>
  s.title_noise ? "±0 (noise)" : `${s.d_title >= 0 ? "+" : ""}${(s.d_title * 100).toFixed(1)}pp`;

const FLAG_STYLE: Record<TradeThesis["flag"], string> = {
  LIKELY: "bg-pos-rb/10 text-pos-rb",
  EXPLOIT: "bg-pos-wr/15 text-pos-wr",
  NEEDS_PITCH: "bg-navy/10 text-navy dark:text-muted",
  LONGSHOT: "bg-line text-muted",
};

const TAG_LABEL: Record<string, string> = {
  SELL_HIGH: "Sell high",
  BUY_LOW: "Buy low",
  TRAJECTORY: "Trajectory",
  ROLE_EXPIRY: "Role expiry",
  CONTINGENCY: "Contingency",
  PLAYOFF_SCHEDULE: "Playoff schedule",
  PORTFOLIO: "Portfolio",
  CONSOLIDATION: "Consolidation",
  LINEUP: "Lineup",
};

/** HANDOFF v1.3 §6.4: ΔTitle leads; thesis, numbers for BOTH teams (each labelled — the
 *  old card printed their lineup change next to our player's name), kill condition,
 *  pitch, P(accept) and FantasyCalc fairness, and our rank against consensus. */
export function TradeThesisCard({ card }: { card: TradeThesis }) {
  const names = (ps: { name: string; pos: string }[]) =>
    ps.map((p) => (
      <span key={p.name} className="mr-2 inline-flex items-center gap-1">
        <PosBadge pos={p.pos} />
        <PlayerName name={p.name} pos={p.pos} className="font-semibold text-ink" />
        <ScheduleTag name={p.name} />
      </span>
    ));

  return (
    <article className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.partner}</p>
          <div className="mt-1 flex flex-wrap items-center gap-y-1 text-sm">
            <span className="mr-2 text-xs text-muted">Give</span>
            {names(card.give)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-y-1 text-sm">
            <span className="mr-2 text-xs text-muted">Get</span>
            {names(card.get)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl font-bold leading-none text-pos-rb">{pp(card.us)}</p>
          <p className="text-[11px] text-muted">your title odds</p>
        </div>
      </header>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.tags.map((t) => (
          <span key={t} className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy dark:text-muted">
            {TAG_LABEL[t] ?? t}
          </span>
        ))}
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-bold ${FLAG_STYLE[card.flag]}`}
          title="Acceptance odds are an estimate: Yahoo only shows trades that went through, never the ones turned down, so there is nothing to fit them to yet."
        >
          {card.flag.replace("_", " ").toLowerCase()} · est. {Math.round(card.p_accept * 100)}% accept
        </span>
      </div>

      <p className="mt-2 text-sm text-ink">{card.thesis}</p>
      {card.second ? <p className="mt-1 text-sm text-muted">{card.second.thesis}</p> : null}

      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-muted">
            <th className="py-1 text-left font-normal"></th>
            <th className="py-1 text-right font-normal">This week</th>
            <th className="py-1 text-right font-normal">Rest of season</th>
            <th className="py-1 text-right font-normal">Title odds</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr className="border-t border-line">
            <td className="py-1 font-semibold text-ink">You</td>
            <td className="py-1 text-right">{pts(card.us.d_week)}</td>
            <td className="py-1 text-right">{pts(card.us.d_ros)}/wk</td>
            <td className="py-1 text-right font-semibold">{pp(card.us)}</td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-1 font-semibold text-ink">{card.partner}</td>
            <td className="py-1 text-right">{pts(card.them.d_week)}</td>
            <td className="py-1 text-right">{pts(card.them.d_ros)}/wk</td>
            <td className="py-1 text-right">{pp(card.them)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 rounded-lg bg-crimson/5 px-3 py-2 text-xs text-ink">
        <span className="font-semibold text-crimson">Kill condition · </span>
        {card.kill}
      </p>
      <p className="mt-2 text-xs text-muted">
        <span className="font-semibold text-ink">Pitch · </span>
        {card.pitch}
      </p>

      <p className="mt-2 border-t border-line pt-2 text-[11px] text-muted">
        {[...card.ranks.give, ...card.ranks.get]
          .map(
            (r) =>
              `${r.name}: ours ${r.pos}${r.our_rank ?? "—"} / ECR ${r.pos}${r.ecr_rank ?? "—"} (${r.view})`,
          )
          .join(" · ")}
        {" · "}FantasyCalc {Math.round(Math.min(card.fairness, 1 / card.fairness) * 100)}% even
        {card.netted_free_swap ? " · net of the free-agent pickup you could make anyway" : ""}
      </p>
    </article>
  );
}
