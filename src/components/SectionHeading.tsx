export function SectionHeading({ title, tone }: { title: string; tone?: "sell" | "buy" }) {
  const barColor =
    tone === "sell" ? "bg-crimson" : tone === "buy" ? "bg-pos-rb" : "bg-navy";
  return (
    <div className="mb-3 mt-8 flex items-center gap-2 first:mt-0">
      <span className={`h-4 w-1 rounded-full ${barColor}`} />
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
    </div>
  );
}
