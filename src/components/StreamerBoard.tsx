import { PosBadge } from "./PosBadge";
import { TeamLogo } from "./TeamLogo";
import type { Streamers, StreamWeek } from "@/lib/waivers";

function Weeks({ weeks }: { weeks: StreamWeek[] }) {
  return (
    <span className="flex flex-wrap gap-x-2 text-xs text-muted">
      {weeks.map((w) => (
        <span key={w.week}>
          wk {w.week} {w.opp ? `v ${w.opp}` : "bye"}{" "}
          <span className="font-semibold text-ink">{w.proj.toFixed(1)}</span>
        </span>
      ))}
    </span>
  );
}

/** Free-agent defenses and kickers against the one you'd start — mega/kdef.py streamers. */
export function StreamerBoard({ streamers }: { streamers?: Streamers | null }) {
  if (!streamers?.available) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-ink">Defense &amp; kicker streamers</h2>
      <p className="mt-1 text-sm text-muted">
        Projected Yahoo points for the next {streamers.weeks.length} weeks against the one you&apos;d
        start. Each rival is assumed to chase only the streamer that helps him most.
      </p>
      {(["DEF", "K"] as const).map((pos) => {
        const s = streamers[pos];
        if (!s) return null;
        return (
          <div key={pos} className="mt-4">
            <div className="flex items-center gap-2 text-sm">
              <PosBadge pos={pos} />
              <span className="text-muted">Yours:</span>
              {s.mine.map((m) => (
                <span key={m.player} className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{m.player}</span>
                  <Weeks weeks={m.weeks} />
                </span>
              ))}
            </div>
            {s.rows.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No free agent beats yours over these weeks.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {s.rows.map((r) => (
                  <div key={r.player} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                          <TeamLogo team={r.team} size={16} />
                          {r.player}
                        </p>
                        <Weeks weeks={r.weeks} />
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-lg font-bold leading-none text-pos-rb-text">
                          +{r.gain_avg.toFixed(1)}
                        </p>
                        <p className="text-[11px] text-muted">pts/wk over yours</p>
                      </div>
                    </div>
                    <p className={`mt-1.5 text-xs ${r.bid ? "text-muted" : "font-semibold text-crimson"}`}>
                      {r.bid ? `$${r.bid}: ` : "Pass: "}
                      {r.bid_note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
