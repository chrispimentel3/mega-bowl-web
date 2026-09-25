"use client";

import { useMemo, useState } from "react";
import { SimpleTable } from "./SimpleTable";
import type { WeeklyResultRow } from "@/lib/league";

export function WeeklyResultsTable({ rows }: { rows: WeeklyResultRow[] }) {
  const weeks = useMemo(
    () => Array.from(new Set(rows.map((r) => r.week))).sort((a, b) => b - a),
    [rows],
  );
  const [week, setWeek] = useState(weeks[0]);

  const view = rows.filter((r) => r.week === week).sort((a, b) => b.points - a.points);
  const hasProj = view.some((r) => r.proj != null);

  return (
    <div>
      <select
        value={week}
        onChange={(e) => setWeek(Number(e.target.value))}
        className="mb-3 rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink"
      >
        {weeks.map((w) => (
          <option key={w} value={w}>
            Week {w}
          </option>
        ))}
      </select>
      <SimpleTable
        rowKey={(r) => `${r.team}-${r.week}`}
        rows={view}
        columns={[
          { key: "team", label: "Team" },
          { key: "opponent", label: "Opponent" },
          { key: "points", label: "Pts", align: "right", format: (v) => (v as number).toFixed(1) },
          { key: "opp_points", label: "Opp pts", align: "right", format: (v) => (v == null ? "—" : (v as number).toFixed(1)) },
          ...(hasProj
            ? [{ key: "proj" as const, label: "Proj", align: "right" as const, format: (v: unknown) => (v == null ? "—" : (v as number).toFixed(1)) }]
            : []),
        ]}
      />
    </div>
  );
}
