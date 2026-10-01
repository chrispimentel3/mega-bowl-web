import Link from "next/link";
import type { ThisWeek } from "@/lib/players";

// The fitted model only sorts matchups reliably outside about ±3% (see Logic), so inside
// that band the verdict is "neutral" whatever the rank says.
const NEUTRAL_BAND = 3;

function verdict(pct: number): { label: string; tone: string; bar: string } {
  if (pct >= 8) return { label: "Great matchup", tone: "text-pos-rb", bar: "bg-pos-rb" };
  if (pct >= NEUTRAL_BAND) return { label: "Good matchup", tone: "text-pos-rb", bar: "bg-pos-rb" };
  if (pct <= -8) return { label: "Very tough matchup", tone: "text-crimson", bar: "bg-crimson" };
  if (pct <= -NEUTRAL_BAND) return { label: "Tough matchup", tone: "text-crimson", bar: "bg-crimson" };
  return { label: "Neutral matchup", tone: "text-muted", bar: "bg-muted" };
}

const signed = (v: number, d = 0) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)}`;

/** This week's matchup as a 1-10 score with what it's worth in points. */
export function MatchupScore({ tw, pos, week }: { tw: ThisWeek; pos: string; week?: number }) {
  const where = tw.opponent ? `${tw.home ? "vs" : "@"} ${tw.opponent}` : "";
  const head = `${week ? `Week ${week}` : "This week"}${where ? ` · ${where}` : ""}`;

  if (tw.bye) {
    return <p className="text-sm text-muted"><b className="text-ink">{week ? `Week ${week}` : "This week"}:</b> bye.</p>;
  }
  if (tw.out_reason) {
    return (
      <p className="text-sm text-muted">
        <b className="text-ink">{head}:</b> <span className="font-bold text-crimson">{tw.out_reason}</span>
      </p>
    );
  }
  const pct = tw.matchup_pct;
  if (pct == null || tw.matchup_score == null) {
    return (
      <p className="text-sm text-muted">
        <b className="text-ink">{head}</b>
        {tw.projection != null ? ` · projected ${tw.projection.toFixed(1)}` : ""} · no matchup model for this game yet
      </p>
    );
  }

  const v = verdict(pct);
  const filled = Math.round(tw.matchup_score);
  const better = tw.matchup_n && tw.matchup_rank
    ? Math.round(((tw.matchup_n - tw.matchup_rank) / (tw.matchup_n - 1)) * 100) : null;

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Matchup · {head}</p>
          <p className="mt-0.5">
            <span className="font-display text-2xl font-bold text-ink">{tw.matchup_score.toFixed(1)}</span>
            <span className="text-sm text-muted">/10</span>{" "}
            <span className={`ml-1 text-sm font-semibold ${v.tone}`}>{v.label}</span>
          </p>
        </div>
        {tw.delta_pts != null ? (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Impact</p>
            <p className={`font-display text-2xl font-bold ${v.tone === "text-muted" ? "text-ink" : v.tone}`}>
              {signed(tw.delta_pts, 1)}
              <span className="text-sm font-normal text-muted"> pts</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex gap-0.5" role="img" aria-label={`Matchup score ${tw.matchup_score} out of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? v.bar : "bg-ink/10"}`} />
        ))}
      </div>

      <p className="mt-2 text-xs text-muted">
        {better != null ? <>Better than {better}% of {pos} matchups this week (#{tw.matchup_rank} of {tw.matchup_n}). </> : null}
        <span className={v.tone === "text-muted" ? "" : v.tone}>{signed(pct, 1)}%</span> on his usual week
        {tw.matchup_baseline != null && tw.expected_pts != null
          ? <>: {tw.matchup_baseline.toFixed(1)} → <b className="text-ink">{tw.expected_pts.toFixed(1)}</b> expected</>
          : null}
        {tw.projection != null ? <> · projection {tw.projection.toFixed(1)}</> : null}.
      </p>
      <p className="mt-1 text-xs text-muted">
        {tw.matchup_def_rank != null ? <>Defense #{tw.matchup_def_rank} of 32 vs {pos}s ({signed(tw.matchup_def_pct ?? 0)}%)</> : null}
        {tw.matchup_basis === "defense+vegas" && tw.matchup_vegas_pct != null
          ? <> · Vegas {signed(tw.matchup_vegas_pct)}% vs his team&apos;s norm</>
          : tw.matchup_basis === "defense_only" ? <> · no Vegas line yet</> : null}
        {Math.abs(pct) < NEUTRAL_BAND ? <> · inside ±{NEUTRAL_BAND}% the model can&apos;t separate matchups</> : null}
        {" · "}
        <Link href="/logic#matchup_model" className="text-navy hover:underline">how it&apos;s scored</Link>
      </p>
    </div>
  );
}
