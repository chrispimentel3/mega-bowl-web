import Link from "next/link";
import type { ThisWeek } from "@/lib/players";

const NEUTRAL_BAND = 3; // Logic page: the fitted model only sorts reliably outside ~±3%

function pctColor(pct: number): string {
  if (Math.abs(pct) < NEUTRAL_BAND) return "text-muted";
  return pct > 0 ? "text-pos-rb" : "text-crimson";
}

function signed(v: number, digits = 0): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;
}

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

  const pct = thisWeek.matchup_pct;
  const hasMatchup = pct != null;

  return (
    <div>
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

      {hasMatchup && !thisWeek.out_reason ? (
        <div className="mt-2 rounded-lg bg-ink/[0.03] p-2.5">
          <p className="text-sm">
            Matchup impact:{" "}
            <span className={`font-bold ${pctColor(pct!)}`}>{signed(pct!)}%</span>{" "}
            <span className="text-muted">on his usual week</span>
            {thisWeek.expected_pts != null && thisWeek.matchup_baseline != null ? (
              <>
                {" — "}
                <span className="text-muted">{thisWeek.matchup_baseline.toFixed(1)} baseline</span>
                {" → "}
                <span className="font-semibold text-ink">{thisWeek.expected_pts.toFixed(1)} expected</span>
                {thisWeek.delta_pts != null ? (
                  <span className={`ml-1 ${pctColor(pct!)}`}>({signed(thisWeek.delta_pts, 1)} pts)</span>
                ) : null}
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">
            {thisWeek.matchup_def_rank != null ? (
              <>defense #{thisWeek.matchup_def_rank} of 32 vs his position ({signed(thisWeek.matchup_def_pct ?? 0)}%)</>
            ) : null}
            {thisWeek.matchup_basis === "defense+vegas" && thisWeek.matchup_vegas_pct != null ? (
              <> · Vegas line {signed(thisWeek.matchup_vegas_pct)}% vs his team&apos;s norm</>
            ) : thisWeek.matchup_basis === "defense_only" ? (
              <> · no Vegas line yet, defense only</>
            ) : null}
            {" · "}
            <Link href="/logic#matchup_model" className="text-navy hover:underline">
              how this is calculated
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
