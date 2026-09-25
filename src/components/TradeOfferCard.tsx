import type { TradeOffer } from "@/lib/trades";

function deltaColor(delta: number): string {
  if (Math.abs(delta) < 0.5) return "text-muted";
  return delta > 0 ? "text-pos-rb" : "text-crimson";
}

/** `benches` includes the player traded away (he necessarily "stops starting" — he left
 * the roster, not a real bench decision), which would read as a false "he got beaten out"
 * if left in. Filtered out here so what's left is only genuine cascading bench moves. */
function ImpactLine({
  label, delta, starts, benches, tradedAway,
}: {
  label: string;
  delta: number;
  starts: string[];
  benches: string[];
  tradedAway: string;
}) {
  const bumped = benches.filter((n) => n !== tradedAway);
  let verdict: string;
  if (starts.length === 0) {
    verdict = "doesn't crack the starting lineup";
  } else if (bumped.length === 0) {
    verdict = `${starts.join(" & ")} starts — no one else bumped`;
  } else {
    verdict = `${starts.join(" & ")} starts, bumping ${bumped.join(" & ")}`;
  }
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

/** row.give/row.get carry a " (POS)" suffix (e.g. "Breece Hall (RB)") the impact lists
 * don't — stripped here so the traded-away-player filter in ImpactLine actually matches. */
function bareName(labeled: string): string {
  return labeled.replace(/\s*\([A-Z]+\)$/, "");
}

export function TradeOfferCard({ row }: { row: TradeOffer }) {
  const fairnessPct = Math.round(row.fairness * 100);
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-crimson/10 px-2 py-0.5 text-xs font-bold text-crimson">
          addresses {row.addresses}
        </span>
        <span className="rounded-md bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
          {fairnessPct}% fair
        </span>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted">You give</span>
          <span className="text-xs text-muted">value {row.give_val}</span>
        </div>
        <p className="font-medium text-ink">{row.give}</p>
        <div className="flex items-baseline justify-between gap-2 pt-1">
          <span className="text-[11px] uppercase tracking-wide text-muted">You get</span>
          <span className="text-xs text-muted">value {row.get_val}</span>
        </div>
        <p className="font-medium text-ink">{row.get}</p>
      </div>

      {row.impact ? (
        <div className="mt-3 space-y-1.5 border-t border-line pt-3">
          <ImpactLine
            label="Your lineup:"
            delta={row.impact.my_lineup_delta}
            starts={row.impact.i_would_start}
            benches={row.impact.i_would_bench}
            tradedAway={bareName(row.give)}
          />
          <ImpactLine
            label="Their lineup:"
            delta={row.impact.their_lineup_delta}
            starts={row.impact.they_would_start}
            benches={row.impact.they_would_bench}
            tradedAway={bareName(row.get)}
          />
        </div>
      ) : null}
    </div>
  );
}
