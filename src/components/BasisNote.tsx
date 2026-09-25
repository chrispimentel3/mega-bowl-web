export function BasisNote({ basis }: { basis: { prior_season: number; season: number; weeks: number } | null }) {
  if (!basis) return null;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <p>
        <strong>Form numbers below are {basis.prior_season}, not {basis.season}.</strong>{" "}
        {basis.season} has {basis.weeks} week{basis.weeks === 1 ? "" : "s"} played and the rolling
        window needs 3 — a {basis.weeks}-week sample would read as a trend. This switches over on
        its own at week 3.
      </p>
    </div>
  );
}
