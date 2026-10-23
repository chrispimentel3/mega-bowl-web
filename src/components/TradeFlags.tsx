import type { TradeFlag } from "@/lib/trades";

const DOT: Record<TradeFlag["kind"], string> = {
  role_risk: "bg-crimson",
  rebound: "bg-pos-wr",
  injury: "bg-crimson",
  need: "bg-navy",
};

/** What to check before sending it, from your side (mega/trade_theses.py our_flags). */
export function TradeFlags({ flags, className = "" }: { flags?: TradeFlag[] | null; className?: string }) {
  if (!flags?.length) return null;
  return (
    <ul className={`space-y-1 text-xs text-ink ${className}`}>
      {flags.map((f) => (
        <li key={f.text} className="flex gap-2">
          <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[f.kind] ?? "bg-muted"}`} />
          <span>{f.text}</span>
        </li>
      ))}
    </ul>
  );
}
