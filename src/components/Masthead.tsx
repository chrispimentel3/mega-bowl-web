export function Masthead({
  season,
  week,
  nextWeek,
  rosterSrc,
}: {
  season: number;
  week: number;
  nextWeek: number;
  rosterSrc: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-baseline justify-between px-4 py-3 sm:max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <span className="text-navy">Mega</span> <span className="text-crimson">Bowl</span>
        </h1>
        <p className="text-right text-xs text-muted">
          {season} · through wk {week}
          <br />
          matchup wk {nextWeek}
          {rosterSrc ? <> · {rosterSrc}</> : null}
        </p>
      </div>
    </header>
  );
}
