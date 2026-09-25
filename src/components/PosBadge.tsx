const POS_COLOR: Record<string, string> = {
  QB: "var(--color-pos-qb)",
  RB: "var(--color-pos-rb)",
  WR: "var(--color-pos-wr)",
  TE: "var(--color-pos-te)",
  K: "var(--color-pos-k)",
  DEF: "var(--color-pos-def)",
  DST: "var(--color-pos-def)",
};

export function PosBadge({ pos }: { pos: string }) {
  const color = POS_COLOR[pos] ?? "var(--color-muted)";
  return (
    <span
      className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {pos}
    </span>
  );
}
