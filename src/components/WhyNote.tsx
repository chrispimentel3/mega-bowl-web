/** Why the other manager would say yes or no — mega/trade_worth.py, written about them.
 *  The first few reasons only: the lineup line, the name line, then what moved it. */
export function WhyNote({ lines, className = "", max = 4 }: { lines?: string[] | null; className?: string; max?: number }) {
  if (!lines?.length) return null;
  return (
    <ul className={`list-disc space-y-0.5 pl-4 text-xs text-muted ${className}`}>
      {lines.slice(0, max).map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}
