"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const HIGHLIGHT_COLORS = [
  "var(--color-navy)",
  "var(--color-crimson)",
  "var(--color-pos-rb)",
  "var(--color-pos-wr)",
  "var(--color-pos-te)",
  "var(--color-navy-dark)",
  "var(--color-pos-k)",
];

/**
 * Every series draws (as a faint grey backdrop); only `highlighted` ones get a color and a
 * legend entry. Mirrors the Streamlit dashboard's `ui.line_chart(highlight=...)` — the whole
 * league/roster is visible context, but only the picks you care about are named.
 */
export function MultiLineChart({
  data,
  xKey,
  series,
  highlighted,
  percent = false,
  yLabel,
}: {
  data: Record<string, number | string | null>[];
  xKey: string;
  series: string[];
  highlighted: string[];
  percent?: boolean;
  yLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => (percent ? `${Math.round(v * 100)}%` : String(v))}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          width={44}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-muted)" }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => (percent ? `${(Number(value) * 100).toFixed(1)}%` : Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series
          .filter((s) => !highlighted.includes(s))
          .map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke="var(--color-muted)"
              strokeOpacity={0.3}
              strokeWidth={1.5}
              dot={false}
              legendType="none"
              isAnimationActive={false}
              connectNulls
            />
          ))}
        {highlighted.map((s, i) => (
          <Line
            key={s}
            type="monotone"
            dataKey={s}
            stroke={HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
