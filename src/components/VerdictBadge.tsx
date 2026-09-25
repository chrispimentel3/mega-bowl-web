const STYLES: Record<string, string> = {
  great: "bg-pos-rb/10 text-pos-rb",
  good: "bg-navy/10 text-navy",
  tough: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  avoid: "bg-crimson/10 text-crimson",
};

export function VerdictBadge({ verdict }: { verdict: string }) {
  const style = STYLES[verdict] ?? "bg-ink/5 text-muted";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold capitalize ${style}`}>
      {verdict}
    </span>
  );
}
