"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { RankingRow } from "@/lib/rankings";

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;
const NEUTRAL_BAND = 3; // matches ThisWeekNote.tsx — the matchup model's own noise floor
// nflverse_estimate() covers every player who has ever played, third-stringers included —
// cap at roughly this league's real fantasy-relevant depth (12 teams, half-PPR) rather than
// scrolling into backups nobody would ever start.
const DISPLAY_CAP: Record<(typeof POSITIONS)[number], number> = { QB: 32, RB: 60, WR: 72, TE: 30 };

function pctColor(pct: number): string {
  if (Math.abs(pct) < NEUTRAL_BAND) return "text-muted";
  return pct > 0 ? "text-pos-rb" : "text-crimson";
}

export function RankingsBoard({ rows }: { rows: RankingRow[] }) {
  const [pos, setPos] = useState<(typeof POSITIONS)[number]>("QB");
  const [mineOnly, setMineOnly] = useState(false);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => r.pos === pos && (!mineOnly || r.mine))
        .slice(0, mineOnly ? undefined : DISPLAY_CAP[pos]),
    [rows, pos, mineOnly],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {POSITIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              pos === p ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {p}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          My roster only
        </label>
      </div>

      <div className="space-y-1.5">
        {filtered.map((row) => (
          <Link
            key={row.gsis_id}
            href={`/players/${row.gsis_id}`}
            className="flex items-center gap-3 rounded-xl border border-line bg-card p-2.5 shadow-sm transition-colors hover:border-navy/30"
          >
            <span className="w-6 shrink-0 text-right text-sm font-bold text-muted">{row.rank}</span>
            <PlayerAvatar player={row.player} size={28} />
            <PosBadge pos={row.pos} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {row.player}
                {row.mine ? (
                  <span className="ml-1.5 rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold text-navy">
                    mine
                  </span>
                ) : null}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted">
                {row.team ? <TeamLogo team={row.team} size={14} /> : null}
                {row.team ?? "FA"}
                {row.opponent ? ` vs ${row.opponent}` : " · bye"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-bold leading-none text-ink">{row.proj.toFixed(1)}</p>
              {row.matchup_pct != null ? (
                <p className={`mt-1 text-[11px] font-semibold ${pctColor(row.matchup_pct)}`}>
                  {row.matchup_pct >= 0 ? "+" : ""}
                  {row.matchup_pct.toFixed(0)}%
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-muted">—</p>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No {pos}s{mineOnly ? " on your roster" : ""} yet.</p>
        ) : null}
      </div>
    </div>
  );
}
