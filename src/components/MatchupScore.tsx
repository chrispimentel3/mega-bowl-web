import type { ThisWeek } from "@/lib/players";

import { STEPS, ptsShort, ptsSentence, step } from "@/lib/matchupVerdict";
import { MatchupTags } from "./MatchupTags";

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
  const pts = ptsShort(tw.delta_pts);

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-base font-bold ${s.tone}`} title={ptsSentence(tw.delta_pts) ?? undefined}>
          {s.label} matchup{pts ? <span className="ml-1.5 text-sm font-semibold">{pts}</span> : null}
        </p>
        <p className="text-xs text-muted">
          {head}
          {tw.projection != null ? <> · proj <b className="text-ink">{tw.projection.toFixed(1)}</b></> : null}
        </p>
      </div>

      {/* where it sits on the five steps */}
      <div className="mt-2 flex items-center gap-1.5" role="img" aria-label={`${s.label} matchup`}>
        <span className="text-[10px] text-muted">Tough</span>
        {STEPS.map((x, k) => (
          <span key={x.label} className={`h-2 flex-1 rounded-full ${k === i ? s.dot : "bg-ink/10"}`} />
        ))}
        <span className="text-[10px] text-muted">Great</span>
      </div>

      <MatchupTags
        className="mt-2"
        hideVerdict pct={tw.matchup_pct} pts={tw.delta_pts} pos={pos} opp={tw.opponent}
        defRank={tw.matchup_def_rank} vegasPct={tw.matchup_vegas_pct} basis={tw.matchup_basis}
      />
    </div>
  );
}
