"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import type { Usage } from "@/lib/usage";

const METRICS = [
  { key: "snap_share", label: "Snap share", percent: true, caption: "How much of his offence's snaps he is on the field for. The floor under everything else — a player off the field cannot be targeted." },
  { key: "target_share", label: "Target share", percent: true, caption: "His cut of his team's targets. The stickiest week-to-week signal there is; points move around it, not the other way." },
  { key: "half_ppr", label: "Half-PPR points", percent: false, caption: "What he actually scored. Spiky is not the same as good." },
  { key: "targets", label: "Targets", percent: false, caption: "Raw looks per game, before any share maths." },
  { key: "carries", label: "Carries", percent: false, caption: "Raw carries per game." },
] as const;

export function UsageExplorer({ usage }: { usage: Usage }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("target_share");
  const [selected, setSelected] = useState<string[]>(usage.starters);

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  const weeks = useMemo(
    () => Array.from(new Set(usage.rows.map((r) => r.week))).sort((a, b) => a - b),
    [usage.rows],
  );

  const chartData = useMemo(() => {
    return weeks.map((week) => {
      const row: Record<string, number | string | null> = { week };
      for (const player of selected) {
        const match = usage.rows.find((r) => r.player === player && r.week === week);
        row[player] = match ? (match[metric] as number | null) : null;
      }
      return row;
    });
  }, [weeks, selected, metric, usage.rows]);

  function togglePlayer(player: string) {
    setSelected((prev) => (prev.includes(player) ? prev.filter((p) => p !== player) : [...prev, player]));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              metric === m.key ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-muted">{activeMetric.caption}</p>

      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        {selected.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Pick at least one player below.</p>
        ) : (
          <MultiLineChart
            data={chartData}
            xKey="week"
            series={selected}
            highlighted={selected}
            percent={activeMetric.percent}
          />
        )}
      </div>

      <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">Players</p>
      <div className="flex flex-wrap gap-2">
        {usage.players.map((player) => (
          <button
            key={player}
            onClick={() => togglePlayer(player)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(player)
                ? "border-navy bg-navy/10 text-navy"
                : "border-line text-muted hover:border-navy/40 hover:text-navy"
            }`}
          >
            {player}
          </button>
        ))}
      </div>
    </div>
  );
}
