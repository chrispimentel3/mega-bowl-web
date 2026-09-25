"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BarCompareChart({
  rows,
}: {
  rows: { player: string; expected: number; actual: number }[];
}) {
  const height = Math.max(240, rows.length * 32);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="player"
          width={130}
          tick={{ fontSize: 11, fill: "var(--color-ink)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => Number(value).toFixed(1)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="expected" name="Expected" fill="var(--color-muted)" radius={[0, 4, 4, 0]} barSize={10} />
        <Bar dataKey="actual" name="Actual" fill="var(--color-navy)" radius={[0, 4, 4, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
