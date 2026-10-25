"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefSkater, Skater } from "@/lib/leafs";
import { clamp, day, mmss, ord, pct, resultText, resultTone, signed } from "./fmt";

/** NHL logo (light/dark variant); the team code in a circle if NHL.com's CDN doesn't answer */
export function NhlLogo({ team, size = 28 }: { team: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // the image can fail before React attaches onError (server-rendered), so check once on mount too
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed)
    return <span className="logo logo-txt" style={{ width: size, height: size }}>{team}</span>;
  const src = (v: string) => `https://assets.nhle.com/logos/nhl/svg/${team}_${v}.svg`;
  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={src("dark")} />
      <img ref={img} className="logo" src={src("light")} width={size} height={size} alt={team} onError={() => setFailed(true)} />
    </picture>
  );
}

type ChartGame = { id: number; opp: string; home: boolean; date: string; gf: number; ga: number; result: string; ot: string };
type Series = (number | null)[];
type Metric = {
  label: string; lede: string; lines: { name: string; vals: Series; color: string }[];
  ref: number | null; refLbl: string; lo: number; hi: number; f: (v: number) => string;
};

export function TrendChart({ games, trend, hasMoneyPuck, lgGpg, roll }: {
  games: ChartGame[];
  trend: { goals: Series; xg: Series; cf: Series; gf: Series; ga: Series };
  hasMoneyPuck: boolean;
  lgGpg: number | null;
  roll: number;
}) {
  const two = (v: number) => v.toFixed(2);
  const metrics: Record<string, Metric> = {
    goals: { label: "Goals %", lede: "Share of all goals scored in Leafs games.", lines: [{ name: "Goals %", vals: trend.goals, color: "var(--leafs)" }],
      ref: 0.5, refLbl: "NHL avg 50%", lo: 0.25, hi: 0.75, f: pct },
    ...(hasMoneyPuck ? {
      xg: { label: "xG %", lede: "Share of 5-on-5 expected goals (shot quality), the best single predictor of future results.",
        lines: [{ name: "xGoals % (5v5)", vals: trend.xg, color: "var(--leafs)" }], ref: 0.5, refLbl: "NHL avg 50%", lo: 0.35, hi: 0.65, f: pct },
      cf: { label: "Corsi %", lede: "Share of 5-on-5 shot attempts, a measure of who has the puck.",
        lines: [{ name: "Corsi % (5v5)", vals: trend.cf, color: "var(--leafs)" }], ref: 0.5, refLbl: "NHL avg 50%", lo: 0.38, hi: 0.62, f: pct },
    } : {}),
    gfga: { label: "GF / GA", lede: "Goals for and against per game, against the NHL average team.",
      lines: [{ name: "Goals for / game", vals: trend.gf, color: "var(--leafs)" }, { name: "Goals against / game", vals: trend.ga, color: "var(--s2)" }],
      ref: lgGpg, refLbl: lgGpg == null ? "" : `NHL avg ${two(lgGpg)}`, lo: 1, hi: 5, f: two },
  };
  const [key, setKey] = useState(hasMoneyPuck ? "xg" : "goals");
  const m = metrics[key];

  // the chart draws at its real pixel width so text never stretches
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // segmented-control thumb slides under the pressed button
  const seg = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const b = seg.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (b) setThumb({ x: b.offsetLeft, w: b.offsetWidth });
  }, [key, w]);

  const [hover, setHover] = useState<number | null>(null);
  const H = 280, pad = { l: 44, r: 12, t: 10, b: 24 }, iw = w - pad.l - pad.r, ih = H - pad.t - pad.b, n = games.length;
  const x = (i: number) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + (1 - (clamp(v, m.lo, m.hi) - m.lo) / (m.hi - m.lo)) * ih;
  // gaps (games MoneyPuck hasn't posted yet) break the line instead of bridging it
  const path = (vals: Series) => vals.map((v, i) => (v == null ? "" : `${i && vals[i - 1] != null ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)).join("");
  const ticks = [0, 1, 2, 3, 4].map((i) => m.lo + (i / 4) * (m.hi - m.lo));
  const first = m.lines[0].vals, yr = m.ref == null ? null : y(m.ref);
  const pts = first.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
  const firstI = first.findIndex((v) => v != null), lastI = first.length - 1 - [...first].reverse().findIndex((v) => v != null);
  const area = yr != null && m.lines.length === 1 && pts.length > 1 ? `M${pts.join("L")}L${x(lastI)},${yr}L${x(firstI)},${yr}Z` : null;

  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    setHover(clamp(Math.round(((e.clientX - r.left - pad.l) / iw) * (n - 1)), 0, n - 1));
  };
  const g = hover == null ? null : games[hover];
  const tipLeft = hover == null ? 0 : x(hover) + 12 + 190 > w ? x(hover) - 190 - 12 : x(hover) + 12;

  return (
    <div className="card chart-card">
      <div className="seg" ref={seg} role="group" aria-label="Metric">
        <span className="thumb" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }} />
        {Object.entries(metrics).map(([k, mm]) => (
          // respond on press, not release
          <button key={k} aria-pressed={k === key} onPointerDown={() => setKey(k)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setKey(k)}>
            {mm.label}
          </button>
        ))}
      </div>
      <p className="lede" style={{ marginBottom: 8 }}>
        {m.lede} Each point averages the previous {roll} games.{m.ref != null ? " The dashed line is the league average; green shading is better than average, red is worse." : ""}
      </p>
      <div className="chart" ref={box} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
        {w > 0 ? (
          <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${m.label}, rolling ${roll}-game average by game`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{m.f(t).replace(".0%", "%")}</text>
              </g>
            ))}
            {games.map((_, i) => (i % 10 === 0 ? <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--muted)">G{i + 1}</text> : null))}
            {area && yr != null ? (
              <>
                <clipPath id="lf-above"><rect x="0" y="0" width={w} height={yr} /></clipPath>
                <clipPath id="lf-below"><rect x="0" y={yr} width={w} height={H} /></clipPath>
                <path d={area} fill="var(--good)" opacity=".14" clipPath="url(#lf-above)" />
                <path d={area} fill="var(--bad)" opacity=".14" clipPath="url(#lf-below)" />
              </>
            ) : null}
            {yr != null ? (
              <>
                <line x1={pad.l} x2={w - pad.r} y1={yr} y2={yr} stroke="var(--muted)" strokeDasharray="5 4" strokeWidth="1.5" />
                <text x={pad.l + 6} y={yr + 15} textAnchor="start" fontSize="11" fontWeight="600" fill="var(--muted)">{m.refLbl}</text>
              </>
            ) : null}
            {m.lines.map((l) => (
              <path key={l.name} d={path(l.vals)} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {hover != null ? (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" />
                {m.lines.map((l) => (l.vals[hover] == null ? null : (
                  <circle key={l.name} cx={x(hover)} cy={y(l.vals[hover]!)} r="4.5" fill={l.color} stroke="var(--card)" strokeWidth="2" />
                )))}
              </g>
            ) : null}
          </svg>
        ) : null}
        {g && hover != null ? (
          <div className="tip" style={{ left: tipLeft }}>
            <div className="t"><NhlLogo team={g.opp} size={18} /> G{hover + 1} {g.home ? "vs" : "@"} {g.opp} <span className={`chip ${resultTone(g.result)}`}>{resultText(g.result, g.ot)}</span></div>
            <div className="num" style={{ color: "var(--muted)" }}>{day(g.date)} · {g.gf}–{g.ga}</div>
            {m.lines.map((l) => {
              const v = l.vals[hover];
              if (v == null) return <div key={l.name}>{l.name}: not posted yet</div>;
              const d = m.ref == null ? null : m.f === pct ? signed((v - m.ref) * 100, 1) : signed(v - m.ref, 2);
              return (
                <div key={l.name} className="num">
                  {l.name}: <b>{m.f(v)}</b>{d ? <span style={{ color: "var(--muted)" }}> ({d} vs avg)</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="legend">
        {m.lines.map((l) => <span key={l.name}><i style={{ background: l.color }} />{l.name} (rolling {roll})</span>)}
        {m.ref != null ? <span><i className="dash" />{m.refLbl}</span> : null}
      </div>
      <div className="strip" aria-label="Result of each game">
        {games.map((gm, i) => (
          <i key={gm.id} title={`G${i + 1} ${resultText(gm.result, gm.ot)} ${gm.gf}-${gm.ga} vs ${gm.opp}`} style={{ background: `var(--${resultTone(gm.result)})` }} />
        ))}
      </div>
    </div>
  );
}

type Col = { k: keyof Skater; label: string };
const COLS: Col[] = [
  { k: "name", label: "Player" }, { k: "gp", label: "GP" }, { k: "g", label: "G" }, { k: "a", label: "A" }, { k: "p", label: "P" },
  { k: "pm", label: "+/-" }, { k: "ppg", label: "PPG" }, { k: "shots", label: "SOG" }, { k: "toi", label: "TOI" }, { k: "rank", label: "NHL rank" },
];
const sortVal = (s: Skater, k: keyof Skater) => (k === "rank" ? s.rank?.rank ?? Infinity : s[k]);

export function SkaterTable({ skaters, refs }: { skaters: Skater[]; refs: RefSkater[] }) {
  const [sort, setSort] = useState<{ k: keyof Skater; dir: "asc" | "desc" }>({ k: "p", dir: "desc" });
  const rows = [...skaters].sort((a, b) => {
    const [va, vb] = [sortVal(a, sort.k), sortVal(b, sort.k)];
    const d = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sort.dir === "asc" ? d : -d;
  });
  const click = (k: keyof Skater) =>
    setSort((s) => ({ k, dir: s.k === k ? (s.dir === "desc" ? "asc" : "desc") : k === "name" || k === "rank" ? "asc" : "desc" }));
  const posGroup = (pos: string) => (pos === "D" ? "D" : "F");

  return (
    <div className="card tbl-wrap">
      <table>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.k} aria-sort={sort.k === c.k ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                <button onClick={() => click(c.k)} data-dir={sort.k === c.k ? sort.dir : undefined}>{c.label}</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="num">
          {rows.map((s) => (
            <tr key={s.id}>
              <td><span className="pname">{s.name}</span><span className="pos">{s.pos}</span></td>
              <td>{s.gp}</td><td>{s.g}</td><td>{s.a}</td><td><b>{s.p}</b></td><td>{signed(s.pm)}</td>
              <td>{s.ppg}</td><td>{s.shots}</td><td>{mmss(s.toi)}</td>
              <td>
                {s.rank ? (
                  <>
                    {ord(s.rank.rank)}<span className="pos">of {s.rank.of} {posGroup(s.pos)}</span>
                    <span className="bar"><i style={{ width: `${(1 - (s.rank.rank - 1) / s.rank.of) * 100}%` }} /></span>
                  </>
                ) : "—"}
              </td>
            </tr>
          ))}
          {refs.map((r) => (
            <tr key={r.name} className="ref">
              <td>{r.name}</td><td>{Math.round(r.gp)}</td><td>{r.g.toFixed(1)}</td><td>{r.a.toFixed(1)}</td><td>{r.p.toFixed(1)}</td>
              <td>{signed(r.pm, 1)}</td><td>—</td><td>—</td><td>{mmss(r.toi)}</td><td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
