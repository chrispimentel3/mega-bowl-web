"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import { PosBadge } from "./PosBadge";
import type { Trend, TrendMover } from "@/lib/trends";

const MAX_LINES = 7;

type Fmt = (v: number) => string;

function formatters(percent: boolean, unit: "int" | "num"): { value: Fmt; delta: Fmt } {
  const sign = (n: number) => (n >= 0 ? "+" : "−");
  if (percent) {
    return {
      value: (v) => `${(v * 100).toFixed(1)}%`,
      delta: (d) => `${sign(d)}${Math.abs(d * 100).toFixed(1)} pts`,
    };
  }
  if (unit === "int") {
    return {
      value: (v) => Math.round(v).toLocaleString(),
      delta: (d) => `${sign(d)}${Math.abs(Math.round(d)).toLocaleString()}`,
    };
  }
  return { value: (v) => v.toFixed(1), delta: (d) => `${sign(d)}${Math.abs(d).toFixed(1)}` };
}

function MoverList({
  title, rows, selected, onToggle, fmt, tone,
}: {
  title: string;
  rows: TrendMover[];
  selected: string[];
  onToggle: (p: string) => void;
  fmt: { value: Fmt; delta: Fmt };
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nobody.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.player}>
              <button
                onClick={() => onToggle(r.player)}
                aria-pressed={selected.includes(r.player)}
                title="Show on the chart"
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                  selected.includes(r.player) ? "bg-navy/10" : "hover:bg-ink/5"
                }`}
              >
                <PosBadge pos={r.pos} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{r.player}</span>
                {r.mine ? <span title="On your roster" aria-label="on your roster" className="shrink-0 text-xs text-navy dark:text-muted">★</span> : null}
                <span className="shrink-0 text-xs text-muted">
                  {fmt.value(r.prev)} → {fmt.value(r.last)}
                </span>
                <span className={`w-16 shrink-0 text-right text-xs font-bold ${tone}`}>{fmt.delta(r.delta)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One weekly snapshot series for the whole league: who moved most since the last snapshot,
 *  and a line chart that opens on your roster and can add anyone. */
export function TrendChart({
  trend, percent = false, unit = "num", yLabel,
}: {
  trend: Trend;
  percent?: boolean;
  unit?: "int" | "num";
  yLabel?: string;
}) {
  const info = trend.info;
  const initial = useMemo(() => {
    const mine = info ? trend.players.filter((p) => info[p]?.mine) : [];
    return (mine.length ? mine : trend.players).slice(0, 5);
  }, [trend.players, info]);
  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");

  const fmt = formatters(percent, unit);
  const weeks = useMemo(
    () => Array.from(new Set(trend.rows.map((r) => r.week))).sort((a, b) => a - b),
    [trend.rows],
  );
  const byKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of trend.rows) m.set(`${r.player}|${r.week}`, r.value);
    return m;
  }, [trend.rows]);

  const chartData = useMemo(
    () =>
      weeks.map((week) => {
        const row: Record<string, number | string | null> = { week };
        for (const player of selected) row[player] = byKey.get(`${player}|${week}`) ?? null;
        return row;
      }),
    [weeks, selected, byKey],
  );

  function toggle(player: string) {
    setSelected((prev) =>
      prev.includes(player) ? prev.filter((p) => p !== player) : [...prev, player].slice(-MAX_LINES),
    );
  }

  function add(name: string) {
    const hit = trend.players.find((p) => p.toLowerCase() === name.trim().toLowerCase());
    if (!hit) return;
    setSelected((prev) => (prev.includes(hit) ? prev : [...prev, hit].slice(-MAX_LINES)));
    setQuery("");
  }

  if (!trend.available || trend.players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        No trend history yet.
      </div>
    );
  }

  const m = trend.movers;
  const hasMovers = !!m && m.weeks.length === 2 && (m.up.length > 0 || m.down.length > 0);

  return (
    <div>
      {hasMovers ? (
        <>
          <p className="mb-2 text-xs text-muted">
            Biggest changes from week {m.weeks[0]} to week {m.weeks[1]} — tap a player to chart him.
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <MoverList title="Rising" rows={m.up} selected={selected} onToggle={toggle} fmt={fmt} tone="text-pos-rb" />
            <MoverList title="Falling" rows={m.down} selected={selected} onToggle={toggle} fmt={fmt} tone="text-crimson" />
          </div>
        </>
      ) : weeks.length < 2 ? (
        <p className="mb-3 text-xs text-muted">
          History starts here — this snapshot began week {weeks[0]}. Check back after another
          week for an actual trend.
        </p>
      ) : null}

      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        {selected.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Pick at least one player.</p>
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {selected.map((p) => (
          <button
            key={p}
            onClick={() => toggle(p)}
            aria-label={`Remove ${p}`}
            className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
          >
            {p} ×
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(query);
          }}
          className="flex items-center gap-1"
        >
          <input
            list={`trend-players-${yLabel ?? "x"}`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (trend.players.includes(e.target.value)) add(e.target.value);
            }}
            placeholder="Add any player…"
            aria-label="Add a player to the chart"
            className="w-44 rounded-full border border-line bg-card px-3 py-1 text-xs text-ink placeholder:text-muted"
          />
          <datalist id={`trend-players-${yLabel ?? "x"}`}>
            {trend.players
              .filter((p) => !selected.includes(p))
              .map((p) => (
                <option key={p} value={p} label={info?.[p]?.pos} />
              ))}
          </datalist>
        </form>
      </div>
    </div>
  );
}
