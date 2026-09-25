"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import type { WeeklyResultRow } from "@/lib/league";

export function WeeklyPointsChart({ rows, myTeam }: { rows: WeeklyResultRow[]; myTeam: string }) {
  const teams = useMemo(() => Array.from(new Set(rows.map((r) => r.team))).sort(), [rows]);
  const [followed, setFollowed] = useState<string[]>(teams.includes(myTeam) ? [myTeam] : teams.slice(0, 1));

  const weeks = useMemo(() => Array.from(new Set(rows.map((r) => r.week))).sort((a, b) => a - b), [rows]);

  const chartData = useMemo(() => {
    return weeks.map((week) => {
      const row: Record<string, number | string | null> = { week };
      for (const team of teams) {
        const match = rows.find((r) => r.team === team && r.week === week);
        row[team] = match ? match.points : null;
      }
      return row;
    });
  }, [weeks, teams, rows]);

  function toggle(team: string) {
    setFollowed((prev) => (prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]));
  }

  return (
    <div>
      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        <MultiLineChart data={chartData} xKey="week" series={teams} highlighted={followed} yLabel="Points" />
      </div>
      <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-muted">Follow</p>
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <button
            key={team}
            onClick={() => toggle(team)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              followed.includes(team)
                ? "border-navy bg-navy/10 text-navy"
                : "border-line text-muted hover:border-navy/40 hover:text-navy"
            }`}
          >
            {team}
          </button>
        ))}
      </div>
    </div>
  );
}
