/** "X wouldn't start for them (they start Y)…" — mega/trade_league.py sits_text. */
export function SitsNote({ lines, className = "" }: { lines?: string[] | null; className?: string }) {
  if (!lines?.length) return null;
  return (
    <>
      {lines.map((l) => (
        <p key={l} className={`text-[11px] text-muted ${className}`}>
          {l}.
        </p>
      ))}
    </>
  );
}
