import type { TradeSearchRow } from "@/lib/tradeSearch";

const FLAG_STYLE: Record<string, string> = {
  LIKELY: "bg-pos-rb/10 text-pos-rb",
  EXPLOIT: "bg-navy/10 text-navy",
  NEEDS_PITCH: "bg-ink/5 text-muted",
  LONGSHOT: "bg-crimson/10 text-crimson",
};
const FLAG_LABEL: Record<string, string> = {
  LIKELY: "likely accepted",
  EXPLOIT: "exploit",
  NEEDS_PITCH: "needs a pitch",
  LONGSHOT: "longshot",
};

function deltaColor(delta: number): string {
  if (Math.abs(delta) < 0.5) return "text-muted";
  return delta > 0 ? "text-pos-rb" : "text-crimson";
}

function pctColor(delta: number | null): string {
  if (delta == null || Math.abs(delta) < 0.01) return "text-muted";
  return delta > 0 ? "text-pos-rb" : "text-crimson";
}

function LineupVerdict({
  label, delta, starts, benches, excluding,
}: {
  label: string;
  delta: number;
  starts: string[];
  benches: string[];
  excluding: string[];
}) {
  const bumped = benches.filter((n) => !excluding.includes(n));
  let verdict: string;
  if (starts.length === 0) verdict = "doesn't crack the starting lineup";
  else if (bumped.length === 0) verdict = `${starts.join(" & ")} starts — no one else bumped`;
  else verdict = `${starts.join(" & ")} starts, bumping ${bumped.join(" & ")}`;

  return (
    <p className="text-xs text-muted">
      <span className="font-semibold text-ink">{label}</span>{" "}
      <span className={`font-bold ${deltaColor(delta)}`}>
        {delta >= 0 ? "+" : ""}
        {delta.toFixed(1)} pts/wk
      </span>{" "}
      · {verdict}
    </p>
  );
}

export function TradeSearchResultCard({ row }: { row: TradeSearchRow }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          {row.partner} <span className="font-normal text-muted">· {row.shape}</span>
        </p>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${FLAG_STYLE[row.flag] ?? ""}`}>
          {FLAG_LABEL[row.flag] ?? row.flag}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        <div>
          <span className="text-[11px] uppercase tracking-wide text-muted">You give</span>
          <p className="font-medium text-ink">{row.give.join(" + ")}</p>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wide text-muted">You get</span>
          <p className="font-medium text-ink">{row.get.join(" + ")}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-line pt-3">
        <LineupVerdict label="Your lineup:" delta={row.d_me} starts={row.i_would_start}
                      benches={row.i_would_bench} excluding={row.give} />
        <LineupVerdict label="Their lineup:" delta={row.d_them} starts={row.they_would_start}
                      benches={row.they_would_bench} excluding={row.get} />
      </div>

      {row.odds != null ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs">
          <span>
            <span className="text-muted">Your playoff odds </span>
            <span className={`font-bold ${pctColor(row.odds)}`}>
              {row.odds >= 0 ? "+" : ""}
              {(row.odds * 100).toFixed(1)}pt
            </span>
          </span>
          <span>
            <span className="text-muted">Their playoff odds </span>
            <span className={`font-bold ${pctColor(row.their_odds)}`}>
              {row.their_odds != null && row.their_odds >= 0 ? "+" : ""}
              {row.their_odds != null ? (row.their_odds * 100).toFixed(1) : "—"}pt
            </span>
          </span>
          {row.watch === "arms a rival" ? (
            <span className="rounded-md bg-crimson/10 px-1.5 py-0.5 font-bold text-crimson">
              arms a rival
            </span>
          ) : row.watch ? (
            <span className="text-muted">{row.watch.toLowerCase()}</span>
          ) : null}
        </div>
      ) : null}

      <p className="mt-2 text-[11px] text-muted">market ratio {row.mkt_ratio.toFixed(2)}</p>
    </div>
  );
}
