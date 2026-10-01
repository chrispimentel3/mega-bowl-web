"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
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

// One-click starting points: the pairs of stats that answer a question. A preset only applies
// where both stats exist for the positions it names, so a renamed stat just drops its button.
const PRESETS = [
  { label: "Targets vs routes", note: "Who gets thrown to relative to how often he runs a route.", pos: ["WR", "TE"], x: "tgt_share", y: "routes_pg" },
  { label: "Per-route efficiency", note: "Targets per route against yards per route: earns looks and does something with them.", pos: ["WR", "TE"], x: "tprr", y: "yprr" },
  { label: "Deep or short role", note: "How far downfield he's targeted against how often he catches it.", pos: ["WR", "TE"], x: "adot", y: "catch_rate" },
  { label: "Lucky or good", note: "Expected points per game against actual: above the diagonal is scoring beyond his volume.", pos: ["QB", "RB", "WR", "TE"], x: "xfp_pg", y: "pts_pg" },
  { label: "RB workload", note: "Carries against targets per game: the backs who do both are the ones with a floor.", pos: ["RB"], x: "car_pg", y: "tgt_pg" },
  { label: "QB efficiency", note: "Completion % over expected against EPA per dropback.", pos: ["QB"], x: "cpoe", y: "pass_epa_db" },
] as const;

type Pt = StatRow & { x: number; y: number; group: Group; label: boolean };

function Marker({ cx, cy, payload, fill }: { cx?: number; cy?: number; payload?: Pt; fill?: string }) {
  if (cx == null || cy == null || !payload) return null;
  const r = payload.label || payload.group === "mine" ? 6 : 5; // >= 10px marks
  const common = { fill, stroke: "var(--color-card)", strokeWidth: 2, style: { cursor: "pointer" } };
  let mark;
  switch (payload.pos) {
    case "QB":
      mark = <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy} ${cx},${cy + r + 1} ${cx - r - 1},${cy}`} {...common} />;
      break;
    case "RB":
      mark = <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy + r} ${cx - r - 1},${cy + r}`} {...common} />;
      break;
    case "TE":
      mark = <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} rx={1.5} {...common} />;
      break;
    default:
      mark = <circle cx={cx} cy={cy} r={r} {...common} />;
  }
  if (!payload.label) return mark;
  return (
    <g>
      {mark}
      <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)"
            stroke="var(--color-card)" strokeWidth={3} paintOrder="stroke" style={{ pointerEvents: "none" }}>
        {payload.name.split(" ").slice(-1)[0]}
      </text>
    </g>
  );
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

  const sp = useSearchParams();
  const startPos = (sp.get("pos") ?? "").split(",").filter((p) => (POSITIONS as readonly string[]).includes(p));
  const usableFor = (ps: string[]) => metrics.filter((m) => ps.every((p) => m.positions.includes(p)));
  const startPositions = startPos.length ? startPos : ["WR", "TE"];
  const okStart = usableFor(startPositions).map((m) => m.key);
  const startS = Number(sp.get("s"));

  const [season, setSeason] = useState(seasons.includes(startS) ? startS : seasons[0]);
  const [positions, setPositions] = useState<string[]>(startPositions);
  const [xKey, setX] = useState(okStart.includes(sp.get("x") ?? "") ? (sp.get("x") as string) : "tgt_share");
  const [yKey, setY] = useState(okStart.includes(sp.get("y") ?? "") ? (sp.get("y") as string) : "routes_pg");
  const [shown, setShown] = useState<Record<Group, boolean>>(() => {
    const hide = (sp.get("hide") ?? "").split(",");
    return { mine: !hide.includes("mine"), fa: !hide.includes("fa"), other: !hide.includes("other") };
  });
  const maxGames = useMemo(
    () => Math.max(1, ...all.filter((r) => r.season === season).map((r) => Number(r.games) || 0)),
    [all, season],
  );
  const [minGamesSet, setMinGames] = useState<number | null>(sp.get("min") ? Number(sp.get("min")) || null : null);
  // the cards' own qualifying line: at least half the games of the busiest player
  const minGames = minGamesSet ?? Math.ceil(maxGames / 2);
  const [asTable, setAsTable] = useState(sp.get("view") === "table");
  // players to name on the chart, beyond the yours/free-agent groups
  const [labeled, setLabeled] = useState<string[]>((sp.get("hl") ?? "").split(",").filter(Boolean));
  const [labelMine, setLabelMine] = useState(sp.get("lm") !== "0");
  const [find, setFind] = useState("");
  const [copied, setCopied] = useState(false);

  // the address always describes the chart on screen, so any view can be sent as a link
  useEffect(() => {
    const q = new URLSearchParams();
    q.set("x", xKey);
    q.set("y", yKey);
    q.set("pos", positions.join(","));
    if (season !== seasons[0]) q.set("s", String(season));
    if (minGamesSet != null) q.set("min", String(minGamesSet));
    const hide = GROUPS.filter((g) => !shown[g.key]).map((g) => g.key);
    if (hide.length) q.set("hide", hide.join(","));
    if (labeled.length) q.set("hl", labeled.join(","));
    if (!labelMine) q.set("lm", "0");
    if (asTable) q.set("view", "table");
    try {
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    } catch {
      /* the address bar is a convenience */
    }
  }, [xKey, yKey, positions, season, seasons, minGamesSet, shown, labeled, labelMine, asTable]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the link is in the address bar */
    }
  }

  // only stats that mean something for every position picked
  const usable = metrics.filter((m) => positions.every((p) => m.positions.includes(p)));
  const x = byKey[xKey], y = byKey[yKey];
  const valid = usable.some((m) => m.key === xKey) && usable.some((m) => m.key === yKey);

  const points: Pt[] = useMemo(() => {
    if (!valid) return [];
    return all
      .filter((r) => r.season === season && positions.includes(r.pos) && (Number(r.games) || 0) >= minGames)
      .filter((r) => typeof r[xKey] === "number" && typeof r[yKey] === "number")
      .map((r) => ({
        ...r, x: r[xKey] as number, y: r[yKey] as number, group: groupOf(r),
        label: labeled.includes(r.gsis_id) || (labelMine && r.mine),
      }));
  }, [all, season, positions, minGames, xKey, yKey, valid, labeled, labelMine]);
  const visible = points.filter((p) => shown[p.group]);
  const mx = median(points.map((p) => p.x)), my = median(points.map((p) => p.y));
  const r = pearson(points);
  // expected vs actual points sit on one scale, so the y = x line reads as "scoring what his
  // volume says"; above it he's beating his opportunity
  const onePointScale = new Set([xKey, yKey]).size === 2 && ["xfp_pg", "pts_pg"].every((k) => k === xKey || k === yKey);
  const diagonal = onePointScale && points.length
    ? [Math.min(...points.map((p) => Math.min(p.x, p.y))), Math.max(...points.map((p) => Math.max(p.x, p.y)))]
    : null;

  const togglePos = (p: string) => {
    const next = positions.includes(p) ? positions.filter((q) => q !== p) : [...positions, p];
    if (!next.length) return;
    setPositions(next);
    // keep the axes on stats the new mix can use
    const ok = metrics.filter((m) => next.every((q) => m.positions.includes(q)));
    if (!ok.some((m) => m.key === xKey)) setX(ok[0]?.key ?? "pts_pg");
    if (!ok.some((m) => m.key === yKey)) setY(ok.find((m) => m.key === "pts_pg")?.key ?? ok[1]?.key ?? "pts_pg");
  };

  const applyPreset = (pr: (typeof PRESETS)[number]) => {
    setPositions([...pr.pos]);
    setX(pr.x);
    setY(pr.y);
  };
  const presets = PRESETS.filter((pr) => {
    const ok = usableFor([...pr.pos]).map((m) => m.key);
    return ok.includes(pr.x) && ok.includes(pr.y);
  });
  const isPreset = (pr: (typeof PRESETS)[number]) =>
    pr.x === xKey && pr.y === yKey && pr.pos.length === positions.length && pr.pos.every((p) => positions.includes(p));
  const nameOf = (gsis: string) => all.find((r) => r.gsis_id === gsis)?.name ?? gsis;
  const addLabel = (name: string) => {
    const hit = points.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (!hit) return;
    setLabeled((prev) => (prev.includes(hit.gsis_id) ? prev : [...prev, hit.gsis_id]));
    setFind("");
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
      {/* starting points */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-1 text-muted">Start from</span>
        {presets.map((pr) => (
          <button key={pr.label} type="button" onClick={() => applyPreset(pr)} title={pr.note}
                  aria-pressed={isPreset(pr)}
                  className={`rounded-full px-2.5 py-1 font-semibold ${isPreset(pr) ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10"}`}>
            {pr.label}
          </button>
        ))}
      </div>

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
        <span className="ml-auto flex items-center gap-3">
          <button type="button" onClick={copyLink} className="font-semibold text-navy hover:underline dark:text-muted">
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button type="button" onClick={() => setAsTable(!asTable)} className="font-semibold text-navy hover:underline dark:text-muted">
            {asTable ? "Show chart" : "Show as table"}
          </button>
        </span>
      </div>

      {/* who gets a name on the chart */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 text-muted">
          <input type="checkbox" checked={labelMine} onChange={(e) => setLabelMine(e.target.checked)} />
          Name my players
        </label>
        {labeled.map((g) => (
          <button key={g} type="button" onClick={() => setLabeled(labeled.filter((x) => x !== g))}
                  aria-label={`Stop naming ${nameOf(g)}`}
                  className="rounded-full bg-navy px-2.5 py-1 font-medium text-white">
            {nameOf(g)} ×
          </button>
        ))}
        <input
          list="chart-find" value={find} placeholder="Name a player…" aria-label="Name a player on the chart"
          onChange={(e) => { setFind(e.target.value); if (points.some((p) => p.name === e.target.value)) addLabel(e.target.value); }}
          className="w-40 rounded-full border border-line bg-card px-3 py-1 text-ink placeholder:text-muted"
        />
        <datalist id="chart-find">
          {points.filter((p) => !labeled.includes(p.gsis_id)).map((p) => <option key={p.gsis_id} value={p.name} label={`${p.pos} · ${p.team}`} />)}
        </datalist>
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
              {diagonal != null ? (
                <ReferenceLine segment={[{ x: diagonal[0], y: diagonal[0] }, { x: diagonal[1], y: diagonal[1] }]}
                               stroke="var(--color-navy)" strokeOpacity={0.5} strokeWidth={1.5} ifOverflow="hidden" />
              ) : null}
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
                />
              ) : null)}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-xs text-muted">
        {points.length} {positions.join("/")}s with {minGames}+ games in {season}
        {r != null ? ` · correlation ${r.toFixed(2)}` : ""} · dashed lines are the medians, so
        the top-right box is above average at both.{diagonal ? " The solid line is y = x: above it, he is scoring more than his volume says." : ""}{" "}
        {x?.means ? <><b>{x.label}:</b> {x.means} </> : null}
        {y?.means ? <><b>{y.label}:</b> {y.means}</> : null}
      </p>
    </div>
  );
}
