export function KpiRow({ items }: { items: { label: string; value: string; sub: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-card p-3 text-center shadow-sm">
          <p className="font-display text-lg font-bold leading-none text-ink">{item.value}</p>
          <p className="mt-1 text-[11px] font-medium text-muted">{item.label}</p>
          <p className="mt-0.5 text-[10px] text-muted/70">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
