"use client";

import { useState } from "react";
import { MultiLineChart } from "./MultiLineChart";
import type { LeafsGame, LeafsSkater } from "@/lib/leafs";

const WINDOWS = [5, 10, 20];

/** Trailing mean over the last `n` values (shorter at the start of the season); nulls are skipped. */
function rolling(values: (number | null)[], n: number): (number | null)[] {
  return values.map((_, i) => {
    const w = values.slice(Math.max(0, i - n + 1), i + 1).filter((v): v is number => v != null);
    return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
  });
}

const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
const num = (v: number | null, d = 1) => (v == null ? "—" : v.toFixed(d));
const toi = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Toggle({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rolling window">
      {WINDOWS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`rounded-full px-3 py-1 text-xs font-medium ${value === n ? "bg-navy text-white" : "text-muted hover:bg-navy/10"}`}
        >
          {n} games
        </button>
      ))}
    </div>
  );
}

/** Rolling team form: 5v5 shot/chance share and goals vs expected goals, per game. */
export function LeafsTrends({ games }: { games: LeafsGame[] }) {
  const [n, setN] = useState(10);
  const xg = rolling(games.map((g) => g.xgPct), n);
  const cf = rolling(games.map((g) => g.cfPct), n);
  const gf = rolling(games.map((g) => g.gf), n);
  const ga = rolling(games.map((g) => g.ga), n);
  const xgf = rolling(games.map((g) => g.xgf), n);
  const xga = rolling(games.map((g) => g.xga), n);

  const share = games.map((g, i) => ({ game: `${i + 1} ${g.opp}`, "xGF%": xg[i], "CF%": cf[i], "50%": 0.5 }));
  const goals = games.map((g, i) => ({
    game: `${i + 1} ${g.opp}`,
    "Goals for": gf[i] == null ? null : +gf[i]!.toFixed(2),
    "Goals against": ga[i] == null ? null : +ga[i]!.toFixed(2),
    "xGF (5v5)": xgf[i] == null ? null : +xgf[i]!.toFixed(2),
    "xGA (5v5)": xga[i] == null ? null : +xga[i]!.toFixed(2),
  }));

  return (
    <div className="space-y-4">
      <Toggle value={n} onChange={setN} />
      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-ink">5v5 share of expected goals and shot attempts</p>
        <p className="mb-2 text-xs text-muted">Rolling {n}-game average. Above 50% means the Leafs are driving play.</p>
        <MultiLineChart data={share} xKey="game" series={["xGF%", "CF%"]} highlighted={["xGF%", "CF%"]} average="50%" percent domain={[0.3, 0.7]} />
      </div>
      <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-ink">Goals vs expected goals per game</p>
        <p className="mb-2 text-xs text-muted">
          Rolling {n}-game average. Goals are all situations; xG is 5v5 only (MoneyPuck), so read the gap as a trend, not a total.
        </p>
        <MultiLineChart
          data={goals}
          xKey="game"
          series={["Goals for", "Goals against", "xGF (5v5)", "xGA (5v5)"]}
          highlighted={["Goals for", "Goals against", "xGF (5v5)", "xGA (5v5)"]}
        />
      </div>
    </div>
  );
}

const COLS: { key: keyof LeafsSkater; label: string; fmt: (s: LeafsSkater) => string; title?: string }[] = [
  { key: "gp", label: "GP", fmt: (s) => String(s.gp) },
  { key: "g", label: "G", fmt: (s) => String(s.g) },
  { key: "a", label: "A", fmt: (s) => String(s.a) },
  { key: "pts", label: "P", fmt: (s) => String(s.pts) },
  { key: "plusMinus", label: "+/-", fmt: (s) => (s.plusMinus > 0 ? `+${s.plusMinus}` : String(s.plusMinus)) },
  { key: "shots", label: "SOG", fmt: (s) => String(s.shots) },
  { key: "toi", label: "TOI", fmt: (s) => toi(s.toi), title: "Average time on ice per game" },
  { key: "ixg", label: "ixG", fmt: (s) => num(s.ixg), title: "Individual expected goals, all situations (MoneyPuck)" },
  { key: "gameScore", label: "GS/GP", fmt: (s) => num(s.gameScore, 2), title: "MoneyPuck game score per game" },
  { key: "xgPct", label: "xGF%", fmt: (s) => pct(s.xgPct), title: "On-ice 5v5 expected goals share (MoneyPuck)" },
  { key: "cfPct", label: "CF%", fmt: (s) => pct(s.cfPct), title: "On-ice 5v5 shot attempt share (MoneyPuck)" },
];

/** Skater table; click a column header to sort by it. */
export function LeafsSkaters({ skaters }: { skaters: LeafsSkater[] }) {
  const [sort, setSort] = useState<keyof LeafsSkater>("pts");
  const rows = [...skaters].sort((a, b) => Number(b[sort] ?? -Infinity) - Number(a[sort] ?? -Infinity));

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium">Player</th>
            {COLS.map((c) => (
              <th key={c.key} className="px-2 py-2 text-right font-medium" title={c.title} aria-sort={sort === c.key ? "descending" : undefined}>
                <button onClick={() => setSort(c.key)} className={sort === c.key ? "font-bold text-navy" : "hover:text-ink"}>
                  {c.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-line/60 last:border-0">
              <td className="sticky left-0 whitespace-nowrap bg-card px-3 py-1.5 font-medium text-ink">
                {s.name} <span className="text-xs text-muted">{s.pos}</span>
              </td>
              {COLS.map((c) => (
                <td key={c.key} className={`px-2 py-1.5 text-right tabular-nums ${sort === c.key ? "font-semibold text-ink" : "text-muted"}`}>
                  {c.fmt(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
