import Link from "next/link";
import type { ThisWeek } from "@/lib/players";

// The fitted model only sorts matchups reliably outside about ±3% (see Logic), so that
// whole band reads "Neutral".
const NEUTRAL_BAND = 3;

const STEPS = [
  { label: "Very tough", tone: "text-crimson", dot: "bg-crimson" },
  { label: "Tough", tone: "text-crimson", dot: "bg-crimson" },
  { label: "Neutral", tone: "text-ink", dot: "bg-muted" },
  { label: "Good", tone: "text-pos-rb", dot: "bg-pos-rb" },
  { label: "Great", tone: "text-pos-rb", dot: "bg-pos-rb" },
];

function step(pct: number): number {
  if (pct <= -8) return 0;
  if (pct <= -NEUTRAL_BAND) return 1;
  if (pct < NEUTRAL_BAND) return 2;
  if (pct < 8) return 3;
  return 4;
}

/** "about 1.1 pts less than a normal week" */
function impact(delta: number | null | undefined): string | null {
  if (delta == null) return null;
  if (Math.abs(delta) < 0.5) return "About the same as a normal week for him.";
  return `About ${Math.abs(delta).toFixed(1)} pts ${delta > 0 ? "more" : "less"} than a normal week for him.`;
}

/** Why, in one sentence: the defense, and the betting line when it says much. */
function why(tw: ThisWeek, pos: string): string | null {
  const parts: string[] = [];
  const r = tw.matchup_def_rank;
  if (r != null && tw.opponent) {
    if (r <= 8) parts.push(`${tw.opponent} is one of the easiest defenses for ${pos}s`);
    else if (r >= 25) parts.push(`${tw.opponent} is one of the toughest defenses for ${pos}s`);
    else parts.push(`${tw.opponent} is an average defense for ${pos}s`);
  }
  const v = tw.matchup_vegas_pct;
  if (tw.matchup_basis === "defense+vegas" && v != null && Math.abs(v) >= 5) {
    parts.push(`Vegas expects his team to score ${v > 0 ? "more" : "less"} than usual`);
  }
  return parts.length ? `${parts.join(", and ")}.` : null;
}

/** This week's matchup in plain words: a verdict, what it's worth, and why. */
export function MatchupScore({ tw, pos, week }: { tw: ThisWeek; pos: string; week?: number }) {
  const where = tw.opponent ? `${tw.home ? "vs" : "@"} ${tw.opponent}` : "";
  const head = `${week ? `Week ${week}` : "This week"}${where ? ` ${where}` : ""}`;

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
  if (tw.matchup_pct == null) {
    return (
      <p className="text-sm text-muted">
        <b className="text-ink">{head}</b>
        {tw.projection != null ? ` · projected ${tw.projection.toFixed(1)}` : ""} · no matchup read for this game yet
      </p>
    );
  }

  const i = step(tw.matchup_pct);
  const s = STEPS[i];
  const reason = why(tw, pos);
  const pts = impact(tw.delta_pts);

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-base font-bold ${s.tone}`}>{s.label} matchup</p>
        <p className="text-xs text-muted">
          {head}
          {tw.projection != null ? <> · projected <b className="text-ink">{tw.projection.toFixed(1)}</b></> : null}
        </p>
      </div>

      {/* where it sits on the five steps, labelled at the ends */}
      <div className="mt-2 flex items-center gap-1.5" role="img" aria-label={`${s.label} matchup`}>
        <span className="text-[10px] text-muted">Tough</span>
        {STEPS.map((x, k) => (
          <span key={x.label}
                className={`h-2 flex-1 rounded-full ${k === i ? s.dot : "bg-ink/10"}`} />
        ))}
        <span className="text-[10px] text-muted">Great</span>
      </div>

      {pts || reason ? (
        <p className="mt-2 text-sm text-ink">
          {pts} {reason ? <span className="text-muted">{reason}</span> : null}{" "}
          <Link href="/logic#matchup_model" className="whitespace-nowrap text-xs text-navy hover:underline">how?</Link>
        </p>
      ) : null}
    </div>
  );
}
