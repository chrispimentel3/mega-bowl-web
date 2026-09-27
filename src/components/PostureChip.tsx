/** HANDOFF v1.3 §5 risk posture — falls out of the title-odds simulation: over 70% playoff
 *  odds, protect the floor; 35–70% balanced; under 35%, swing for variance. */
const STYLE = {
  protect: "bg-pos-rb/10 text-pos-rb",
  balanced: "bg-navy/10 text-navy dark:text-muted",
  swing: "bg-crimson/10 text-crimson",
} as const;

const WHY = {
  protect: "you're in — take the safer floor",
  balanced: "on the bubble — points and odds both matter",
  swing: "behind — variance is your friend",
} as const;

export function PostureChip({
  posture,
  pPlayoffs,
  pTitle,
}: {
  posture?: "protect" | "balanced" | "swing" | null;
  pPlayoffs?: number | null;
  pTitle?: number | null;
}) {
  if (!posture) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STYLE[posture]}`}>
        {posture}
      </span>
      <span className="text-muted">
        {pPlayoffs != null ? `${Math.round(pPlayoffs * 100)}% playoffs` : ""}
        {pTitle != null ? ` · ${(pTitle * 100).toFixed(1)}% title` : ""} · {WHY[posture]}
      </span>
    </div>
  );
}
