"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { RouteScatterPoint } from "@/lib/routes";

export function RouteScatterChart({
  points,
  threshold,
}: {
  points: RouteScatterPoint[];
  threshold: number;
}) {
  const mine = points.filter((p) => p.mine);
  const others = points.filter((p) => !p.mine);

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          type="number"
          dataKey="tprr"
          name="Targets/route"
          domain={[0, "auto"]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Targets per route run", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--color-muted)" }}
        />
        <YAxis
          type="number"
          dataKey="fd_rr"
          name="1st downs/route"
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          label={{ value: "1st downs per route", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--color-muted)" }}
        />
        <ZAxis type="number" dataKey="routes" range={[40, 200]} name="routes" />
        <ReferenceLine y={threshold} stroke="var(--color-crimson)" strokeDasharray="4 4" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 12,
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as RouteScatterPoint;
            return (
              <div className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs shadow-sm">
                <p className="font-semibold text-ink">{p.player}</p>
                <p className="text-muted">
                  {p.pos} · {p.team} · {Math.round(p.tprr * 100)}% tprr · {Math.round(p.fd_rr * 100)}% 1D/RR
                </p>
              </div>
            );
          }}
        />
        <Scatter name="Others" data={others} fill="var(--color-muted)" fillOpacity={0.5} />
        <Scatter name="Yours" data={mine} fill="var(--color-navy)" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
