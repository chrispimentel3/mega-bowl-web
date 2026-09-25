"use client";

import { useMemo, useState } from "react";
import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "./TeamLogo";
import type { VegasPlayerRow } from "@/lib/matchups";

export function VegasPlayersTable({ rows, myTeam }: { rows: VegasPlayerRow[]; myTeam: string }) {
  const [myRosterOnly, setMyRosterOnly] = useState(false);
  const [minMarkets, setMinMarkets] = useState(1);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => r.vegas_parts >= minMarkets)
      .filter((r) => !myRosterOnly || r.owner === myTeam)
      .sort((a, b) => b.vegas - a.vegas)
      .slice(0, 200);
  }, [rows, myRosterOnly, minMarkets, myTeam]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={myRosterOnly}
            onChange={(e) => setMyRosterOnly(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-navy"
          />
          My roster only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          Minimum markets priced
          <input
            type="range"
            min={1}
            max={5}
            value={minMarkets}
            onChange={(e) => setMinMarkets(Number(e.target.value))}
            className="accent-navy"
          />
          <span className="w-4 text-center font-semibold">{minMarkets}</span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 text-right font-medium">Vegas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.gsis_id} className="border-b border-line last:border-0 even:bg-ink/[0.02]">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar player={r.player} size={24} />
                    <PosBadge pos={r.pos} />
                    <span className="font-medium text-ink">{r.player}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted">
                  <div className="flex items-center gap-1.5">
                    <TeamLogo team={r.team} size={16} />
                    {r.team}
                  </div>
                </td>
                <td className="px-3 py-2 text-muted">
                  {r.owner === myTeam ? <span className="font-semibold text-navy">you</span> : r.owner}
                </td>
                <td className="px-3 py-2 text-right font-display font-bold text-ink">
                  {r.vegas.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No players match these filters.</p>
        ) : null}
      </div>
    </div>
  );
}
