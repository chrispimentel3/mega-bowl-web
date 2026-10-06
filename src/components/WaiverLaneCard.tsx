import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { WaiverLaneRow } from "@/lib/waivers";
import { PlayerName } from "@/components/PlayerCardProvider";
import { ScheduleTag } from "@/components/ScheduleTag";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;

/** One free agent in a v1.3 lane: the lead number, the mechanism behind it, the paired
 *  drop and what the market thinks. Pass 5 redesigns the look; this pass only makes every
 *  number the handoff asks for visible. */
export function WaiverLaneCard({ row }: { row: WaiverLaneRow }) {
  const lead =
    row.lane === "bid_now"
      ? { value: fmt(row.next3), label: "pts/wk, next 3 weeks" }
      : row.lane === "early_signal"
        ? { value: `${Math.round((row.p_expand ?? 0) * 100)}%`, label: "chance his role grows" }
        : { value: fmt(row.fit_pts), label: "pts/wk, rest of season" };

  const chips: { text: string; on: boolean }[] = [
    { text: `START ${fmt(row.start)}`, on: Math.abs(row.start) >= 0.005 },
    { text: `COVER ${fmt(row.cover)}`, on: Math.abs(row.cover) >= 0.005 },
    { text: `INSURE ${fmt(row.insure)}`, on: row.insure >= 0.005 },
    { text: "HANDCUFF", on: Boolean(row.handcuff) },
  ].filter((c) => c.on);

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PlayerAvatar player={row.player} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PosBadge pos={row.pos} />
              <PlayerName name={row.player} pos={row.pos} className="truncate font-semibold text-ink" />
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <TeamLogo team={row.nfl_team} size={14} />
              {row.nfl_team} · {row.ppg?.toFixed(1) ?? "—"} pts/g
              {row.pct_ros != null ? ` · ${Math.round(row.pct_ros)}% rostered` : ""}
              <ScheduleTag name={row.player} className="ml-1" />
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-pos-rb-text">{lead.value}</p>
          <p className="text-[11px] text-muted">{lead.label}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span key={c.text} className="rounded-md bg-pos-rb/10 px-2 py-0.5 text-xs font-bold text-pos-rb-text">
            {c.text}
          </span>
        ))}
        {row.out_status && row.out_back != null ? (
          <span className="rounded-md bg-crimson/10 px-2 py-0.5 text-xs font-bold text-crimson">
            {row.out_back > 17 ? "Out for the season" : `${row.out_status === "IR" ? "On IR" : row.out_status} · back week ${row.out_back}`}
          </span>
        ) : null}
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
            row.market_on ? "bg-crimson/10 text-crimson" : "bg-navy/10 text-navy dark:text-muted"
          }`}
        >
          {row.market_on ? "market is on him" : "under the radar"}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted">{row.why}</p>
      {row.d_title != null ? (
        <p className="mt-1 text-xs text-muted">
          Title odds{" "}
          <span className="font-semibold text-ink">
            {row.title_noise
              ? "±0 (inside the simulation's noise)"
              : `${row.d_title >= 0 ? "+" : ""}${(row.d_title * 100).toFixed(1)}pp`}
          </span>
        </p>
      ) : null}

      {row.drop ? (
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          Drop <span className="font-semibold text-ink">{row.drop}</span>
          {" · "}costs {Math.max(0, row.drop_cost ?? 0).toFixed(2)} pts/wk
          {row.drop_flip ? ` · you'd lose ~${Math.round(row.drop_flip)} in trade value` : ""}
          {" · "}net <span className="font-semibold text-ink">{fmt(row.fit_pts)}</span>
          {row.bid ? (
            <>
              {" · "}bid <span className="font-semibold text-ink">${Math.round(row.bid)}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
