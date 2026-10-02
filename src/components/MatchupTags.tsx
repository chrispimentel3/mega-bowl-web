import { TapTip } from "./TapTip";
import { STEPS, defenseSentence, ptsShort, ptsSentence, step, vegasLineSentence } from "@/lib/matchupVerdict";

/** One line of short tags for a player's matchup; the full sentence is on hover or tap.
 *  The defense and Vegas tags only appear when they say something. */
export function MatchupTags({
  pct, pts, pos, opp, team, defRank, vegasPct, basis, props, propsEdge, extra, hideVerdict = false, className = "",
}: {
  pct: number | null | undefined;
  pts: number | null | undefined;
  pos: string;
  opp?: string | null;
  team?: string | null;
  defRank?: number | null;
  vegasPct?: number | null;
  basis?: string | null;
  /** Vegas player-prop projection, and how far it is from ours */
  props?: number | null;
  propsEdge?: number | null;
  extra?: React.ReactNode;
  /** the card already heads with the verdict */
  hideVerdict?: boolean;
  className?: string;
}) {
  const tag = "rounded-md px-2 py-0.5 text-xs font-semibold";
  const m = pct != null && !hideVerdict ? STEPS[step(pct)] : null;
  const easy = defRank != null && defRank <= 8, tough = defRank != null && defRank >= 25;
  const line = basis !== "defense_only" && vegasPct != null && Math.abs(vegasPct) >= 2 ? vegasPct : null;
  const up = propsEdge != null && propsEdge >= 0.5, down = propsEdge != null && propsEdge <= -0.5;

  if (!m && !easy && !tough && line == null && props == null && !extra) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {m ? (
        <TapTip className={`${tag} font-bold ${m.chip}`} tip={ptsSentence(pts)}>
          {m.label} matchup{ptsShort(pts) ? ` ${ptsShort(pts)}` : ""}
        </TapTip>
      ) : null}
      {easy || tough ? (
        <TapTip className={`${tag} bg-ink/5 ${easy ? "text-pos-rb-text" : "text-crimson"}`}
                tip={defenseSentence(opp, defRank, pos)}>
          {easy ? "Easy D" : "Tough D"}
        </TapTip>
      ) : null}
      {line != null ? (
        <TapTip className={`${tag} bg-ink/5 ${line > 0 ? "text-pos-rb-text" : "text-crimson"}`}
                tip={vegasLineSentence(team, line, basis)}>
          Vegas: team {line > 0 ? "+" : "−"}{Math.abs(line).toFixed(0)}%
        </TapTip>
      ) : null}
      {props != null ? (
        <TapTip className={`${tag} bg-ink/5 ${up ? "text-pos-rb-text" : down ? "text-crimson" : "text-muted"}`}
                tip={`Vegas player props project ${props.toFixed(1)} pts${propsEdge != null && (up || down)
                  ? `, ${Math.abs(propsEdge).toFixed(1)} ${up ? "more" : "less"} than our projection` : ", in line with our projection"}.`}>
          Props {props.toFixed(1)}{up ? " ▲" : down ? " ▼" : ""}
        </TapTip>
      ) : null}
      {extra}
    </div>
  );
}
