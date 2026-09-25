"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GameLogRow } from "@/lib/players";

export function ActualVsExpectedChart({ rows }: { rows: GameLogRow[] }) {
  const data = rows
    .filter((r) => r.half_ppr != null)
    .map((r) => ({ week: r.week, Actual: r.half_ppr, Expected: r.xfp }));

  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Expected" stroke="var(--color-muted)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="Actual" stroke="var(--color-navy)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
