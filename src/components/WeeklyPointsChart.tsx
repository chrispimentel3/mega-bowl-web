"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import type { WeeklyResultRow } from "@/lib/league";

const AVG = "League avg";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const signed = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}`;
const ordinal = (n: number) => {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
};

export function WeeklyPointsChart({ rows, myTeam }: { rows: WeeklyResultRow[]; myTeam: string }) {
  const teams = useMemo(() => Array.from(new Set(rows.map((r) => r.team))).sort(), [rows]);
  const [followed, setFollowed] = useState<string[]>(teams.includes(myTeam) ? [myTeam] : teams.slice(0, 1));

  const weeks = useMemo(() => Array.from(new Set(rows.map((r) => r.week))).sort((a, b) => a - b), [rows]);

  const weekAvg = useMemo(
    () => new Map(weeks.map((w) => [w, mean(rows.filter((r) => r.week === w).map((r) => r.points))])),
    [weeks, rows],
  );

  const chartData = useMemo(() => {
    return weeks.map((week) => {
      const row: Record<string, number | string | null> = { week, [AVG]: Math.round(weekAvg.get(week)! * 10) / 10 };
      for (const team of teams) {
        const match = rows.find((r) => r.team === team && r.week === week);
        row[team] = match ? match.points : null;
      }
      return row;
    });
  }, [weeks, teams, rows, weekAvg]);

  // Per team: season average vs the league's, measured against how spread out the team
  // averages are (z), plus rank and weeks it beat that week's mean.
  const vsMean = useMemo(() => {
    const leagueAvg = mean(rows.map((r) => r.points));
    const avgOf = new Map(teams.map((t) => [t, mean(rows.filter((r) => r.team === t).map((r) => r.points))]));
    const spread = Math.sqrt(mean([...avgOf.values()].map((a) => (a - leagueAvg) ** 2))) || 1;
    const ranked = [...teams].sort((a, b) => avgOf.get(b)! - avgOf.get(a)!);
    return {
      leagueAvg,
      spread,
      of: (team: string) => {
        const mine = rows.filter((r) => r.team === team);
        return {
          avg: avgOf.get(team)!,
          gap: avgOf.get(team)! - leagueAvg,
          z: (avgOf.get(team)! - leagueAvg) / spread,
          rank: ranked.indexOf(team) + 1,
          above: mine.filter((r) => r.points > weekAvg.get(r.week)!).length,
          played: mine.length,
        };
      },
    };
  }, [rows, teams, weekAvg]);

  function toggle(team: string) {
    setFollowed((prev) => (prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]));
  }

  return (
    <div>
      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        <MultiLineChart
          data={chartData}
          xKey="week"
          series={teams}
          highlighted={followed}
          yLabel="Points"
          average={AVG}
        />
      </div>
      {followed.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {followed.map((team) => {
            const s = vsMean.of(team);
            const side = s.gap > 0 ? "above" : "below";
            const verdict =
              Math.abs(s.z) < 0.5 ? "close to the mean" : Math.abs(s.z) < 1 ? `clearly ${side}` : `well ${side}`;
            return (
              <li key={team}>
                <span className="font-medium">{team}</span> averages {s.avg.toFixed(1)} vs the league&apos;s{" "}
                {vsMean.leagueAvg.toFixed(1)}:{" "}
                <span
                  className={`font-medium ${Math.abs(s.z) < 0.5 ? "text-muted" : s.gap > 0 ? "text-pos-rb-text" : "text-crimson"}`}
                >
                  {signed(s.gap)} a week, {verdict}
                </span>{" "}
                ({ordinal(s.rank)} of {teams.length}). Beat the weekly average in {s.above} of {s.played} weeks.
              </li>
            );
          })}
          <li className="text-xs text-muted">
            The dashed line is each week&apos;s league average. Teams usually sit about ±
            {vsMean.spread.toFixed(1)} from the mean: within ±{(vsMean.spread / 2).toFixed(1)} is close, beyond ±
            {vsMean.spread.toFixed(1)} is well clear of it.
          </li>
        </ul>
      ) : null}
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
