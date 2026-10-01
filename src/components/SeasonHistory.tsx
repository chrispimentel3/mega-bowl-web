"use client";

import { useState } from "react";
import type { HistorySeason } from "@/lib/history";
import { PosBadge } from "./PosBadge";

const POS_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"];

/** One past season at a time: where everyone finished, and any team's final roster. */
export function SeasonHistory({ seasons, myTeam }: { seasons: HistorySeason[]; myTeam: string }) {
  const [year, setYear] = useState(seasons[0]?.year);
  const [open, setOpen] = useState<string | null>(null);
  const s = seasons.find((x) => x.year === year) ?? seasons[0];
  if (!s) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Season">
        {seasons.map((x) => (
          <button
            key={x.year}
            role="tab"
            aria-selected={x.year === s.year}
            onClick={() => { setYear(x.year); setOpen(null); }}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              x.year === s.year ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10"
            }`}
          >
            {x.year}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-muted">
        {s.league_name ?? "Mega Bowl"} · champion <b className="text-ink">{s.champion ?? "—"}</b>
      </p>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 text-right font-medium">Record</th>
              <th className="px-3 py-2 text-right font-medium">PF</th>
              <th className="px-3 py-2 text-right font-medium">PA</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {s.standings.map((r) => {
              const roster = s.rosters[r.team];
              const mine = r.team === myTeam;
              return (
                <tr key={r.team} className={`border-b border-line last:border-0 align-top ${mine ? "bg-navy/5" : ""}`}>
                  <td className="px-3 py-2 text-muted">{r.rank}</td>
                  <td className={`px-3 py-2 ${mine ? "font-semibold text-navy dark:text-ink" : "text-ink"}`}>
                    {r.team}
                    {r.rank === 1 ? <span title="Champion" aria-label="champion"> 🏆</span> : null}
                    {r.made_playoffs && r.rank !== 1 ? <span className="ml-1.5 text-[11px] text-muted">playoffs</span> : null}
                    {open === r.team && roster ? (
                      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                        {[...roster]
                          .sort((a, b) => POS_ORDER.indexOf(a.pos ?? "") - POS_ORDER.indexOf(b.pos ?? ""))
                          .map((p, i) => (
                            <li key={`${p.player}-${i}`} className="flex items-center gap-1.5 font-normal text-ink">
                              {p.pos ? <PosBadge pos={p.pos} /> : null}
                              <span className="truncate">{p.player}</span>
                              <span className="text-muted">{p.nfl_team}</span>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-ink">{r.record}</td>
                  <td className="px-3 py-2 text-right text-ink">{r.pf.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2 text-right text-muted">{r.pa.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2 text-right">
                    {roster ? (
                      <button
                        onClick={() => setOpen(open === r.team ? null : r.team)}
                        aria-expanded={open === r.team}
                        className="text-xs font-semibold text-navy hover:underline dark:text-muted"
                      >
                        {open === r.team ? "Hide roster" : "Final roster"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
