import type { ThisWeek } from "@/lib/players";

export function ThisWeekNote({ thisWeek, nextWeek }: { thisWeek: ThisWeek; nextWeek: number }) {
  if (thisWeek.bye) {
    return (
      <p className="text-sm text-muted">
        <strong>Week {nextWeek}:</strong> bye.
      </p>
    );
  }

  const bits = [`${thisWeek.home ? "vs" : "@"} ${thisWeek.opponent}`];
  if (thisWeek.ease_rank != null) bits.push(`matchup #${thisWeek.ease_rank} of 32 (1 = easiest)`);

  return (
    <p className="text-sm text-ink">
      <strong>Week {nextWeek}:</strong> {bits.join(" · ")}
      {thisWeek.out_reason ? (
        <>
          {" · "}
          <span className="font-bold text-crimson">{thisWeek.out_reason}</span>
        </>
      ) : thisWeek.projection != null ? (
        <>
          {" · "}projection {thisWeek.projection.toFixed(1)} ({thisWeek.proj_source})
        </>
      ) : null}
    </p>
  );
}
