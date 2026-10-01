"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatMetric, toRows, type Metric, type StatRow, type StatsTable } from "@/lib/statsTable";
import { PlayerName, useOpenPlayer } from "./PlayerCardProvider";

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

// Ownership is the color (validated with the dataviz checks, light and dark); position is
// the marker shape, so the two never compete for the same channel.
const GROUPS = [
  { key: "other", label: "Other teams", varName: "--chart-other" },
  { key: "fa", label: "Free agents", varName: "--chart-fa" },
  { key: "mine", label: "Yours", varName: "--chart-mine" },
] as const;
type Group = (typeof GROUPS)[number]["key"];
const groupOf = (r: StatRow): Group => (r.mine ? "mine" : r.owner === "FA" ? "fa" : "other");

const SHAPE_LABEL: Record<string, string> = { QB: "◆ QB", RB: "▲ RB", WR: "● WR", TE: "■ TE" };

type Pt = StatRow & { x: number; y: number; group: Group };

function Marker({ cx, cy, payload, fill }: { cx?: number; cy?: number; payload?: Pt; fill?: string }) {
  if (cx == null || cy == null || !payload) return null;
  const r = payload.group === "mine" ? 6 : 5; // >= 10px marks
  const common = { fill, stroke: "var(--color-card)", strokeWidth: 2, style: { cursor: "pointer" } };
  switch (payload.pos) {
    case "QB":
      return <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy} ${cx},${cy + r + 1} ${cx - r - 1},${cy}`} {...common} />;
    case "RB":
      return <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy + r} ${cx - r - 1},${cy + r}`} {...common} />;
    case "TE":
      return <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} rx={1.5} {...common} />;
    default:
      return <circle cx={cx} cy={cy} r={r} {...common} />;
  }
}

const median = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function pearson(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

function MetricSelect({ label, value, metrics, onChange }: {
  label: string; value: string; metrics: Metric[]; onChange: (k: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-card px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-ink"
      >
        {metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
      </select>
    </label>
  );
}

export function ChartBuilder({ table }: { table: StatsTable }) {
  const all = useMemo(() => toRows(table), [table]);
  const metrics = table.metrics;
  const byKey = useMemo(() => Object.fromEntries(metrics.map((m) => [m.key, m])), [metrics]);
  const seasons = useMemo(() => [...new Set(all.map((r) => r.season))].sort((a, b) => b - a), [all]);
  const openPlayer = useOpenPlayer();

  const [season, setSeason] = useState(seasons[0]);
  const [positions, setPositions] = useState<string[]>(["WR", "TE"]);
  const [xKey, setX] = useState("tgt_share");
  const [yKey, setY] = useState("routes_pg");
  const [shown, setShown] = useState<Record<Group, boolean>>({ mine: true, fa: true, other: true });
  const maxGames = useMemo(
    () => Math.max(1, ...all.filter((r) => r.season === season).map((r) => Number(r.games) || 0)),
    [all, season],
  );
  const [minGamesSet, setMinGames] = useState<number | null>(null);
  // the cards' own qualifying line: at least half the games of the busiest player
  const minGames = minGamesSet ?? Math.ceil(maxGames / 2);
  const [asTable, setAsTable] = useState(false);

  // only stats that mean something for every position picked
  const usable = metrics.filter((m) => positions.every((p) => m.positions.includes(p)));
  const x = byKey[xKey], y = byKey[yKey];
  const valid = usable.some((m) => m.key === xKey) && usable.some((m) => m.key === yKey);

  const points: Pt[] = useMemo(() => {
    if (!valid) return [];
    return all
      .filter((r) => r.season === season && positions.includes(r.pos) && (Number(r.games) || 0) >= minGames)
      .filter((r) => typeof r[xKey] === "number" && typeof r[yKey] === "number")
      .map((r) => ({ ...r, x: r[xKey] as number, y: r[yKey] as number, group: groupOf(r) }));
  }, [all, season, positions, minGames, xKey, yKey, valid]);
  const visible = points.filter((p) => shown[p.group]);
  const mx = median(points.map((p) => p.x)), my = median(points.map((p) => p.y));
  const r = pearson(points);

  const togglePos = (p: string) => {
    const next = positions.includes(p) ? positions.filter((q) => q !== p) : [...positions, p];
    if (!next.length) return;
    setPositions(next);
    // keep the axes on stats the new mix can use
    const ok = metrics.filter((m) => next.every((q) => m.positions.includes(q)));
    if (!ok.some((m) => m.key === xKey)) setX(ok[0]?.key ?? "pts_pg");
    if (!ok.some((m) => m.key === yKey)) setY(ok.find((m) => m.key === "pts_pg")?.key ?? ok[1]?.key ?? "pts_pg");
  };

  const fmtX = (v: number) => formatMetric(v, x?.kind ?? "num");
  const fmtY = (v: number) => formatMetric(v, y?.kind ?? "num");
  const tick = (kind: Metric["kind"]) => (v: number) =>
    kind === "pct" ? `${Math.round(v * 100)}%` : Math.abs(v) < 2 && v !== 0 ? v.toFixed(2) : String(Math.round(v * 10) / 10);

  if (!table.available) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">No stats published yet.</p>;
  }

  return (
    <div
      style={{
        // light defaults; dark steps live in globals.css under the same names
        ["--chart-mine" as string]: "var(--chart-mine-c, #2a78d6)",
        ["--chart-fa" as string]: "var(--chart-fa-c, #eb6834)",
        ["--chart-other" as string]: "var(--chart-other-c, #98a2b3)",
      }}
    >
      {/* controls, one block above the chart */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <MetricSelect label="X axis (across)" value={valid ? xKey : usable[0]?.key ?? ""} metrics={usable} onChange={setX} />
        <button
          type="button"
          onClick={() => { setX(yKey); setY(xKey); }}
          className="order-last col-span-2 self-end rounded-lg border border-line px-2 py-1.5 text-xs text-muted hover:text-navy sm:order-none sm:col-span-1"
          aria-label="Swap axes"
        >
          ⇄ swap
        </button>
        <MetricSelect label="Y axis (up)" value={valid ? yKey : usable[1]?.key ?? ""} metrics={usable} onChange={setY} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex gap-1">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePos(p)}
              aria-pressed={positions.includes(p)}
              className={`rounded-full px-2.5 py-1 font-semibold ${positions.includes(p) ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10"}`}
            >
              {p}
            </button>
          ))}
        </div>
        {seasons.length > 1 ? (
          <select value={season} onChange={(e) => { setSeason(Number(e.target.value)); setMinGames(null); }}
                  className="rounded-md border border-line bg-card px-1.5 py-1 text-muted">
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : null}
        <label className="flex items-center gap-1 text-muted">
          min games
          <input type="number" min={1} max={maxGames} value={minGames}
                 onChange={(e) => setMinGames(Math.max(1, Math.min(maxGames, Number(e.target.value) || 1)))}
                 className="w-12 rounded-md border border-line bg-card px-1.5 py-0.5 text-ink" />
        </label>
        <button type="button" onClick={() => setAsTable(!asTable)} className="ml-auto font-semibold text-navy hover:underline">
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {/* legend: toggles too; identity is color + label, position is shape */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {GROUPS.slice().reverse().map((g) => (
          <button key={g.key} type="button" onClick={() => setShown({ ...shown, [g.key]: !shown[g.key] })}
                  aria-pressed={shown[g.key]}
                  className={`flex items-center gap-1.5 ${shown[g.key] ? "text-ink" : "line-through opacity-50"}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${g.varName})` }} />
            {g.label} ({points.filter((p) => p.group === g.key).length})
          </button>
        ))}
        <span className="ml-auto">{positions.map((p) => SHAPE_LABEL[p]).join("  ")}</span>
      </div>

      {!valid ? (
        <p className="mt-6 text-sm text-muted">Pick two stats.</p>
      ) : asTable ? (
        <div className="mt-3 max-h-[480px] overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 text-right font-medium">{x?.label}</th>
                <th className="px-3 py-2 text-right font-medium">{y?.label}</th>
                <th className="px-3 py-2 font-medium">Rostered by</th>
              </tr>
            </thead>
            <tbody>
              {[...visible].sort((a, b) => b.y - a.y).map((p) => (
                <tr key={p.gsis_id} className={`border-b border-line/60 last:border-0 ${p.mine ? "bg-navy/5" : ""}`}>
                  <td className="px-3 py-1.5"><PlayerName name={p.name} pos={p.pos} gsis={p.gsis_id} className="font-medium text-ink" /> <span className="text-xs text-muted">{p.pos}</span></td>
                  <td className="px-3 py-1.5 text-muted">{p.team}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtX(p.x)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtY(p.y)}</td>
                  <td className="px-3 py-1.5 text-xs text-muted">{p.mine ? "you" : p.owner ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-line bg-card p-2">
          <ResponsiveContainer width="100%" height={460}>
            <ScatterChart margin={{ top: 12, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="x" name={x?.label} domain={["auto", "auto"]}
                     tickFormatter={tick(x?.kind ?? "num")} tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                     axisLine={false} tickLine={false}
                     label={{ value: x?.label, position: "insideBottom", offset: -14, fontSize: 12, fill: "var(--color-muted)" }} />
              <YAxis type="number" dataKey="y" name={y?.label} domain={["auto", "auto"]} width={52}
                     tickFormatter={tick(y?.kind ?? "num")} tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                     axisLine={false} tickLine={false}
                     label={{ value: y?.label, angle: -90, position: "insideLeft", offset: 4, fontSize: 12, fill: "var(--color-muted)" }} />
              {mx != null ? <ReferenceLine x={mx} stroke="var(--color-muted)" strokeDasharray="4 4" strokeOpacity={0.6} /> : null}
              {my != null ? <ReferenceLine y={my} stroke="var(--color-muted)" strokeDasharray="4 4" strokeOpacity={0.6} /> : null}
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload as Pt | undefined;
                  if (!p) return null;
                  return (
                    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-ink">{p.name} <span className="font-normal text-muted">· {p.pos} · {p.team}</span></p>
                      <p className="text-muted">{x?.label}: <b className="text-ink">{fmtX(p.x)}</b></p>
                      <p className="text-muted">{y?.label}: <b className="text-ink">{fmtY(p.y)}</b></p>
                      <p className="text-muted">{p.games} games · {p.mine ? "yours" : p.owner ?? "unrostered"}</p>
                      <p className="mt-0.5 text-[10px] text-muted">click for his card</p>
                    </div>
                  );
                }}
              />
              {GROUPS.map((g) => shown[g.key] ? (
                <Scatter
                  key={g.key}
                  data={visible.filter((p) => p.group === g.key)}
                  fill={`var(${g.varName})`}
                  fillOpacity={g.key === "other" ? 0.7 : 1}
                  shape={(props: unknown) => <Marker {...(props as { cx: number; cy: number; payload: Pt })} fill={`var(${g.varName})`} />}
                  onClick={(d: unknown) => {
                    const p = (d as { payload?: Pt }).payload;
                    if (p) openPlayer({ name: p.name, gsis: p.gsis_id, pos: p.pos });
                  }}
                  isAnimationActive={false}
                >
                  {g.key === "mine" ? (
                    <LabelList dataKey="name" position="top" offset={9}
                               formatter={(v: unknown) => String(v ?? "").split(" ").slice(-1)[0]}
                               style={{ fontSize: 11, fill: "var(--color-ink)", fontWeight: 600 }} />
                  ) : null}
                </Scatter>
              ) : null)}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-xs text-muted">
        {points.length} {positions.join("/")}s with {minGames}+ games in {season}
        {r != null ? ` · correlation ${r.toFixed(2)}` : ""} · dashed lines are the medians, so
        the top-right box is above average at both.{" "}
        {x?.means ? <><b>{x.label}:</b> {x.means} </> : null}
        {y?.means ? <><b>{y.label}:</b> {y.means}</> : null}
      </p>
    </div>
  );
}
