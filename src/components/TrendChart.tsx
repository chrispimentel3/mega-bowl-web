"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import type { Trend } from "@/lib/trends";

export function TrendChart({ trend, percent = false, yLabel }: { trend: Trend; percent?: boolean; yLabel?: string }) {
  const [selected, setSelected] = useState<string[]>(trend.players.slice(0, 5));

  const weeks = useMemo(
    () => Array.from(new Set(trend.rows.map((r) => r.week))).sort((a, b) => a - b),
    [trend.rows],
  );

  const chartData = useMemo(
    () =>
      weeks.map((week) => {
        const row: Record<string, number | string | null> = { week };
        for (const player of selected) {
          const match = trend.rows.find((r) => r.player === player && r.week === week);
          row[player] = match ? match.value : null;
        }
        return row;
      }),
    [weeks, selected, trend.rows],
  );

  function toggle(player: string) {
    setSelected((prev) => (prev.includes(player) ? prev.filter((p) => p !== player) : [...prev, player]));
  }

  if (!trend.available || trend.players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        No trend history yet.
      </div>
    );
  }

  return (
    <div>
      {weeks.length < 2 ? (
        <p className="mb-3 text-xs text-muted">
          History starts here — this snapshot began week {weeks[0]}. Check back after a few more
          weeks for an actual trend.
        </p>
      ) : null}
      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        {selected.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Pick at least one player below.</p>
        ) : (
          <MultiLineChart
            data={chartData}
            xKey="week"
            series={selected}
            highlighted={selected}
            percent={percent}
            yLabel={yLabel}
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {trend.players.map((p) => (
          <button
            key={p}
            onClick={() => toggle(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(p) ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
