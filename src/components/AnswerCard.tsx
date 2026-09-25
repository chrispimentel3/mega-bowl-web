export function AnswerCard({ headline, subhead }: { headline: string; subhead: string }) {
  if (!headline) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy px-5 py-6 text-white shadow-sm">
      <div
        className="pointer-events-none absolute -right-10 -top-10 z-0 h-32 w-32 rounded-full bg-crimson/30 blur-2xl"
        aria-hidden
      />
      <p className="relative z-10 font-display text-xl font-bold leading-snug sm:text-2xl">{headline}</p>
      <p className="relative z-10 mt-1.5 text-sm text-white/70">{subhead}</p>
    </div>
  );
}
