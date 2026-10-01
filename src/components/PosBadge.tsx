const POS_COLOR: Record<string, string> = {
  QB: "var(--color-pos-qb)",
  RB: "var(--color-pos-rb)",
  WR: "var(--color-pos-wr)",
  TE: "var(--color-pos-te)",
  K: "var(--color-pos-k)",
  DEF: "var(--color-pos-def)",
  DST: "var(--color-pos-def)",
};

// White on the orange WR and green RB fills is 2.4:1 and 3.5:1 — too faint at 11px — so
// those two take a fixed dark ink (7.3:1 and 5.1:1) in both themes.
const DARK_TEXT = new Set(["WR", "RB"]);

export function PosBadge({ pos }: { pos: string }) {
  const color = POS_COLOR[pos] ?? "var(--color-muted)";
  return (
    <span
      className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: color, color: DARK_TEXT.has(pos) ? "#101828" : "#ffffff" }}
    >
      {pos}
    </span>
  );
}
