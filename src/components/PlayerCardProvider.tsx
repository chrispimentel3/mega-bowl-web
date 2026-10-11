"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { PlayerDetail } from "@/lib/players";
import { OwnershipBadge } from "./OwnershipBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { MatchupScore } from "./MatchupScore";
import { ScheduleTag } from "@/components/ScheduleTag";

/** Click any player's name, anywhere on the site, and his card opens over the page —
 *  the season stats his position is judged on, each with where he ranks at it. The full
 *  page (/players/[id]) is one link away. */

type Want = { name: string; gsis?: string; pos?: string; team?: string };
const Ctx = createContext<(w: Want) => void>(() => {});
export const useOpenPlayer = () => useContext(Ctx);

// skill positions only — kickers and defenses have no card
const CARDLESS = new Set(["K", "DEF", "DST"]);
export const hasCard = (pos?: string | null) => !pos || !CARDLESS.has(pos);

/** "#14 of 150" -> 14 */
const rankNum = (r?: string | null) => {
  const m = /#(\d+)/.exec(r ?? "");
  return m ? parseInt(m[1], 10) : null;
};

function rankTone(r: string) {
  const m = /#(\d+) of (\d+)/.exec(r);
  if (!m) return "text-muted";
  const pct = parseInt(m[1], 10) / parseInt(m[2], 10);
  return pct <= 0.2 ? "text-pos-rb-text font-semibold" : pct >= 0.7 ? "text-crimson" : "text-muted";
}

const LOG: Record<string, { key: string; label: string; fmt?: "pct" | "1" }[]> = {
  QB: [{ key: "half_ppr", label: "Pts", fmt: "1" }, { key: "passing_yards", label: "Pass yds" },
       { key: "passing_tds", label: "TD" }, { key: "rushing_yards", label: "Rush yds" }],
  RB: [{ key: "half_ppr", label: "Pts", fmt: "1" }, { key: "snap_pct", label: "Snaps", fmt: "pct" },
       { key: "carries", label: "Car" }, { key: "rushing_yards", label: "Yds" }, { key: "targets", label: "Tgt" }],
  WR: [{ key: "half_ppr", label: "Pts", fmt: "1" }, { key: "routes", label: "Routes" },
       { key: "targets", label: "Tgt" }, { key: "tgt_pct", label: "Tgt %", fmt: "pct" }, { key: "receiving_yards", label: "Yds" }],
};
LOG.TE = LOG.WR;

function fmtCell(v: unknown, fmt?: "pct" | "1") {
  if (v == null || v === "") return "—";
  if (typeof v !== "number") return String(v);
  if (fmt === "pct") return `${Math.round(v * 100)}%`;
  if (fmt === "1") return v.toFixed(1);
  return Number.isInteger(v) ? String(v) : v.toFixed(0);
}

function Card({ p, onClose }: { p: PlayerDetail; onClose: () => void }) {
  const seasons = Object.keys(p.seasons).sort().reverse();
  const [season, setSeason] = useState(seasons[0]);
  const s = p.seasons[season];
  const tw = seasons[0] === season ? s?.this_week : null;
  const ptsRank = rankNum(s?.ranks?.pts_pg);
  const xRank = rankNum(s?.ranks?.xfp_pg);
  const log = LOG[p.pos] ?? [];

  return (
    <div>
      <div className="flex items-start gap-3">
        <PlayerAvatar player={p.name} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-bold text-ink">{p.name}</h2>
          <p className="text-xs text-muted">
            {p.pos} · {p.team ?? p.last_team ?? "—"}
            {p.bio?.age ? ` · ${Math.floor(p.bio.age)} yrs` : ""} · <OwnershipBadge ownership={p.ownership} />
          </p>
          {p.out_reason ? <p className="mt-0.5 text-xs font-semibold text-crimson">{p.out_reason}</p> : null}
        </div>
        <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-muted hover:bg-ink/5 hover:text-ink">×</button>
      </div>

      {seasons.length > 1 ? (
        <div className="mt-3 flex gap-1 text-xs">
          {seasons.map((y) => (
            <button key={y} onClick={() => setSeason(y)}
                    className={`rounded-full px-2.5 py-1 font-medium ${y === season ? "bg-navy text-white" : "text-muted hover:bg-navy/10"}`}>
              {y}
            </button>
          ))}
        </div>
      ) : null}

      {!s ? (
        <p className="mt-4 text-sm text-muted">No regular-season games in {season}.</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Pts/game", value: s.pts_pg?.toFixed(1) ?? "—", sub: ptsRank ? `${p.pos}${ptsRank}` : "" },
              { label: "Expected/game", value: s.xfp_pg?.toFixed(1) ?? "—", sub: xRank ? `${p.pos}${xRank}` : "" },
              {
                label: "vs expected", sub: `${s.games} game${s.games === 1 ? "" : "s"}`,
                value: s.vs_exp_pg == null ? "—" : `${s.vs_exp_pg >= 0 ? "+" : ""}${s.vs_exp_pg.toFixed(1)}`,
              },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-ink/5 px-3 py-2">
                <p className="text-xs text-muted">{k.label}</p>
                <p className="font-display text-xl font-bold text-ink">{k.value}</p>
                <p className="text-xs font-semibold text-navy">{k.sub}</p>
              </div>
            ))}
          </div>

          {tw ? (
            <div className="mt-3">
              <MatchupScore tw={tw} pos={p.pos} />
            </div>
          ) : null}

          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-1.5 font-medium">Stat</th>
                  <th className="px-3 py-1.5 text-right font-medium">Value</th>
                  <th className="px-3 py-1.5 text-right font-medium">{p.pos} rank</th>
                </tr>
              </thead>
              <tbody>
                {s.card.slice(2).map((c) => (
                  <tr key={c.stat} className="border-t border-line/60" title={c.means || undefined}>
                    <td className="px-3 py-1.5 text-ink">
                      {c.stat}
                      {c.means ? <span className="ml-1 cursor-help text-xs text-muted">ⓘ</span> : null}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-ink">{c.value_fmt}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${rankTone(c.pos_rank)}`}>{c.pos_rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {s.game_log?.length && log.length ? (
            <div className="mt-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">Last {Math.min(5, s.game_log.length)} games</p>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink/5 text-left text-muted">
                      <th className="px-2 py-1 font-medium">Wk</th>
                      <th className="px-2 py-1 font-medium">Game</th>
                      {log.map((c) => <th key={c.key} className="px-2 py-1 text-right font-medium">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.game_log.slice(-5).reverse().map((g) => (
                      <tr key={String(g.week)} className="border-t border-line/60">
                        <td className="px-2 py-1 tabular-nums">{g.week}</td>
                        <td className="px-2 py-1">{g.game}</td>
                        {log.map((c) => <td key={c.key} className="px-2 py-1 text-right tabular-nums">{fmtCell(g[c.key], c.fmt)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}

      <p className="mt-3 text-xs text-muted">
        Ranks are among {p.pos}s with at least half the games of the busiest one; green is top
        fifth, red bottom third. Hover a stat for what it means.{" "}
        <Link href={`/players/${p.gsis_id}`} onClick={onClose} className="font-semibold text-navy hover:underline">
          Full player page →
        </Link>
      </p>
    </div>
  );
}

const SHEET_MS = 420;   // .sheet-surface transition in globals.css
const CURVE_START = 0.72 / 0.32;   // initial slope of that cubic-bezier(0.32, 0.72, 0, 1)
const HANDOFF_MS = [160, 650];     // a thrown sheet's duration range (slow drags take the cap)

/** iOS-style rubber band: the further past the edge, the less it follows. */
const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
/** Where a flick at `v` px/s would come to rest (Apple's scroll-deceleration projection). */
const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d);

/** Drag the sheet by its handle: 1:1 down, rubber-banded up; on release it dismisses if the
 *  flick would carry it past a third of its height, else springs back. */
function useSheetDrag(onDismiss: (ms?: number) => void) {
  const surface = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const st = useRef<{ y0: number; h: number; trail: { y: number; t: number }[] } | null>(null);
  const set = (dy: number | null) => {
    const el = surface.current, sc = scrim.current;
    if (!el || !sc) return;
    el.classList.toggle("dragging", dy != null);
    sc.classList.toggle("dragging", dy != null);
    el.style.transform = dy == null ? "" : `translateY(${dy}px)`;
    sc.style.opacity = dy == null ? "" : String(Math.max(0, 1 - Math.max(dy, 0) / (st.current?.h || 1)));
  };
  const handle = {
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      st.current = { y0: e.clientY, h: surface.current?.offsetHeight || 1, trail: [{ y: e.clientY, t: e.timeStamp }] };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = st.current;
      if (!s) return;
      const dy = e.clientY - s.y0;
      s.trail = [...s.trail.slice(-4), { y: e.clientY, t: e.timeStamp }];
      set(dy >= 0 ? dy : rubberband(dy, s.h));
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = st.current;
      st.current = null;
      if (!s) return;
      // velocity over the last 100ms only: a finger that stopped before lifting isn't a flick
      const recent = [...s.trail, { y: e.clientY, t: e.timeStamp }].filter((p) => p.t >= e.timeStamp - 100);
      const a = recent[0], b = recent[recent.length - 1];
      const v = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0;   // px/s
      const dy = e.clientY - s.y0;
      const at = dy >= 0 ? dy : rubberband(dy, s.h);   // where the sheet is on screen now
      const dismiss = dy + project(v) > s.h / 3;
      const el = surface.current;
      // Velocity handoff: the sheet curve starts at CURVE_START x its average speed, so the
      // duration that makes its first frames match the finger is CURVE_START * distance / v.
      const dist = dismiss ? s.h - at : Math.abs(at);
      const speed = dismiss ? v : at > 0 ? -v : v;     // px/s in the direction it's about to go
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let ms: number | undefined;
      if (el && !reduce && speed > 0 && dist > 0) {
        ms = Math.round(Math.min(HANDOFF_MS[1], Math.max(HANDOFF_MS[0], (CURVE_START * dist * 1000) / speed)));
        el.style.transition = `transform ${ms}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        setTimeout(() => { el.style.transition = ""; }, ms);
      }
      if (dismiss) {
        set(at);                                       // keep its place, then send it home
        el?.classList.remove("dragging");
        scrim.current?.classList.remove("dragging");
        if (scrim.current) scrim.current.style.opacity = "";
        if (el) {
          el.style.transform = "translateY(100%)";
          setTimeout(() => { el.style.transform = ""; }, ms ?? SHEET_MS);
        }
        onDismiss(ms);
      } else {
        set(null);                     // back to the open state, from where it is now
      }
    },
    onPointerCancel: () => {
      st.current = null;
      set(null);
    },
  };
  return { surface, scrim, handle };
}

export function PlayerCardProvider({ children }: { children: React.ReactNode }) {
  const [want, setWant] = useState<Want | null>(null);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((w: Want) => {
    if (w.pos === "K" || w.pos === "DEF" || w.gsis?.startsWith("DEF-")) return; // no card for these
    setWant(w);
    setPlayer(null);
    setError(null);
    const q = w.gsis
      ? `gsis=${encodeURIComponent(w.gsis)}`
      : `name=${encodeURIComponent(w.name)}${w.pos ? `&pos=${w.pos}` : ""}${w.team ? `&team=${w.team}` : ""}`;
    fetch(`/api/player?${q}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "No card for this player.");
        setPlayer(body);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the card."));
  }, []);
  // `shown` drives the enter/exit motion; `want` keeps the sheet mounted until it has left
  const [shown, setShown] = useState(false);
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback((ms: number = SHEET_MS) => {
    setShown(false);
    leaving.current = setTimeout(() => setWant(null), ms);
  }, []);
  useEffect(() => {
    if (!want) return;
    if (leaving.current) clearTimeout(leaving.current);   // reopened mid-exit: turn back
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [want]);
  const { surface, scrim, handle: drag } = useSheetDrag(close);

  useEffect(() => {
    if (!want) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus moves into the sheet so keyboard and VoiceOver land on it, and goes back to the
    // name that opened it when it closes
    const opener = document.activeElement as HTMLElement | null;
    surface.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus({ preventScroll: true });
    };
  }, [want, close, surface]);

  return (
    <Ctx.Provider value={open}>
      {children}
      {want ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={() => close()}>
          <div ref={scrim} data-state={shown ? "open" : "closed"} className="sheet-scrim absolute inset-0 bg-black/50" aria-hidden />
          <div
            ref={surface}
            role="dialog"
            aria-modal="true"
            aria-label={`${want.name} player card`}
            tabIndex={-1}
            data-state={shown ? "open" : "closed"}
            onClick={(e) => e.stopPropagation()}
            className="sheet-surface relative max-h-[90vh] outline-none w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-card px-4 pb-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:pt-4"
          >
            {/* grab handle (phones): drag down to dismiss */}
            <div {...drag} className="-mx-4 flex h-6 cursor-grab touch-none items-center justify-center sm:hidden" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-ink/20" />
            </div>
            {player ? (
              <Card key={player.gsis_id} p={player} onClose={() => close()} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted">{error ?? `Loading ${want.name}…`}</p>
                <button onClick={() => close()} aria-label="Close" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-muted hover:bg-ink/5 hover:text-ink">×</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

/** A player's name that opens his card. Kickers and defenses (no card) render as text. */
export function PlayerName({
  name, pos, team, gsis, className = "",
}: { name: string; pos?: string | null; team?: string | null; gsis?: string; className?: string }) {
  const open = useOpenPlayer();
  if (!name || !hasCard(pos)) return <span className={className}>{name}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open({ name, gsis, pos: pos ?? undefined, team: team ?? undefined });
      }}
      className={`hit cursor-pointer text-left underline decoration-muted/50 decoration-dotted underline-offset-[3px] hover:text-navy hover:decoration-navy ${className}`}
    >
      {name}
    </button>
  );
}

/** A trade package — either names, or the "George Kittle (TE) + Malik Nabers (WR)" string
 *  the trade exports carry — with each name opening its card. */
export function PlayerList({ names, text, className = "", schedule = false }: { names?: string[]; text?: string; className?: string; schedule?: boolean }) {
  const parts = names
    ? names.map((n) => ({ name: n, pos: undefined as string | undefined }))
    : (text ?? "").split(" + ").map((t) => {
        const m = /^(.*?)\s*\((QB|RB|WR|TE|K|DEF)\)$/.exec(t.trim());
        return m ? { name: m[1], pos: m[2] } : { name: t.trim(), pos: undefined };
      });
  return (
    <span className={className}>
      {parts.map((p, i) => (
        <span key={`${p.name}-${i}`}>
          {i ? " + " : ""}
          <PlayerName name={p.name} pos={p.pos} />
          {p.pos ? <span className="text-muted"> ({p.pos})</span> : null}
          {schedule ? <ScheduleTag name={p.name} className="ml-1.5 align-middle" /> : null}
        </span>
      ))}
    </span>
  );
}
