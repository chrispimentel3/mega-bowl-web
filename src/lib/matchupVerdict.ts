/** Plain-language matchup wording, shared by the player card (MatchupScore) and the
 *  lineup rows so one player reads the same everywhere. */

// The fitted model only sorts matchups reliably outside about ±3% (see Logic).
export const NEUTRAL_BAND = 3;

export const STEPS = [
  { label: "Very tough", tone: "text-crimson", chip: "bg-crimson/10 text-crimson", dot: "bg-crimson" },
  { label: "Tough", tone: "text-crimson", chip: "bg-crimson/10 text-crimson", dot: "bg-crimson" },
  { label: "Neutral", tone: "text-ink", chip: "bg-ink/5 text-muted", dot: "bg-muted" },
  { label: "Good", tone: "text-pos-rb", chip: "bg-pos-rb/10 text-pos-rb", dot: "bg-pos-rb" },
  { label: "Great", tone: "text-pos-rb", chip: "bg-pos-rb/10 text-pos-rb", dot: "bg-pos-rb" },
] as const;

export function step(pct: number): number {
  if (pct <= -8) return 0;
  if (pct <= -NEUTRAL_BAND) return 1;
  if (pct < NEUTRAL_BAND) return 2;
  if (pct < 8) return 3;
  return 4;
}

/** "+1.1 pts" / "−0.8 pts"; nothing when it's under half a point */
export function ptsShort(delta: number | null | undefined): string | null {
  if (delta == null || Math.abs(delta) < 0.5) return null;
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} pts`;
}

/** "About 1.1 pts less than a normal week for him." */
export function ptsSentence(delta: number | null | undefined): string | null {
  if (delta == null) return null;
  if (Math.abs(delta) < 0.5) return "About the same as a normal week for him.";
  return `About ${Math.abs(delta).toFixed(1)} pts ${delta > 0 ? "more" : "less"} than a normal week for him.`;
}

/** "DET is one of the easiest defenses for QBs." — rank 1 is the easiest. */
export function defenseSentence(opp: string | null | undefined, defRank: number | null | undefined, pos: string): string | null {
  if (!opp || defRank == null) return null;
  if (defRank <= 8) return `${opp} is one of the easiest defenses for ${pos}s.`;
  if (defRank >= 25) return `${opp} is one of the toughest defenses for ${pos}s.`;
  return `${opp} is an average defense for ${pos}s.`;
}

/** What the betting line says about his team's scoring this week. */
export function vegasLineSentence(team: string | null | undefined, vegasPct: number | null | undefined,
                                  basis: string | null | undefined): string | null {
  if (basis === "defense_only") return "No betting line for this game yet.";
  if (vegasPct == null) return null;
  const who = team ?? "his team";
  if (Math.abs(vegasPct) < 2) return `Vegas expects ${who} to score about as usual.`;
  return `Vegas expects ${who} to score ${Math.abs(vegasPct).toFixed(0)}% ${vegasPct > 0 ? "more" : "less"} than usual.`;
}
