/** One player's week by our matchup model (ff-dashboard mega/ml_matchup.py): the call, how far
 *  this week's situation moves him against his usual one, and the reasons in points. */
export type ModelWhy = { label: string; pts: number };
export type ModelRead = {
  proj: number;
  /** this week's situation against its average over his own games this season, in points */
  week: number;
  call: "good" | "normal" | "bad";
  /** his scoring average going in */
  avg?: number | null;
  why: ModelWhy[];
};

const signed = (v: number) => `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;
const CALL = {
  good: { label: "Good week", chip: "bg-pos-rb/10 text-pos-rb-text" },
  bad: { label: "Bad week", chip: "bg-crimson/10 text-crimson" },
  normal: { label: "Normal week", chip: "bg-ink/5 text-muted" },
} as const;

export function ModelCall({ m, className = "" }: { m: ModelRead; className?: string }) {
  const c = CALL[m.call];
  const tag = "rounded-md px-2 py-0.5 text-xs font-semibold";
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className={`${tag} font-bold ${c.chip}`}>
        {c.label}
        {m.call !== "normal" ? ` ${signed(m.week)} pts` : ""}
      </span>
      {m.why.map((w) => (
        <span key={w.label} className={`${tag} bg-ink/5 ${w.pts > 0 ? "text-pos-rb-text" : "text-crimson"}`}>
          {/* a negative here means a teammate who was out in his earlier games is back */}
          {w.label === "Teammates out" && w.pts < 0 ? "Teammates back" : w.label} {signed(w.pts)}
        </span>
      ))}
      <span className="text-xs text-muted">
        model {m.proj.toFixed(1)} pts{m.avg != null ? ` · averages ${m.avg.toFixed(1)}` : ""}
      </span>
    </div>
  );
}
