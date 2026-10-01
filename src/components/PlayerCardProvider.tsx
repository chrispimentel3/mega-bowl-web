"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  return pct <= 0.2 ? "text-pos-rb font-semibold" : pct >= 0.7 ? "text-crimson" : "text-muted";
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
        <button onClick={onClose} aria-label="Close" className="rounded-md px-2 text-xl leading-none text-muted hover:text-ink">×</button>
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
                <p className="text-[11px] text-muted">{k.label}</p>
                <p className="font-display text-xl font-bold text-ink">{k.value}</p>
                <p className="text-[11px] font-semibold text-navy">{k.sub}</p>
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
                <tr className="bg-ink/5 text-left text-[11px] uppercase tracking-wide text-muted">
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
                      {c.means ? <span className="ml-1 cursor-help text-[10px] text-muted">ⓘ</span> : null}
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
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Last {Math.min(5, s.game_log.length)} games</p>
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

      <p className="mt-3 text-[11px] text-muted">
        Ranks are among {p.pos}s with at least half the games of the busiest one; green is top
        fifth, red bottom third. Hover a stat for what it means.{" "}
        <Link href={`/players/${p.gsis_id}`} onClick={onClose} className="font-semibold text-navy hover:underline">
          Full player page →
        </Link>
      </p>
    </div>
  );
}

export function PlayerCardProvider({ children }: { children: React.ReactNode }) {
  const [want, setWant] = useState<Want | null>(null);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((w: Want) => {
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
  const close = useCallback(() => setWant(null), []);

  useEffect(() => {
    if (!want) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [want, close]);

  return (
    <Ctx.Provider value={open}>
      {children}
      {want ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${want.name} player card`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:max-w-lg sm:rounded-2xl"
          >
            {player ? (
              <Card key={player.gsis_id} p={player} onClose={close} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted">{error ?? `Loading ${want.name}…`}</p>
                <button onClick={close} aria-label="Close" className="px-2 text-xl leading-none text-muted hover:text-ink">×</button>
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
      className={`cursor-pointer text-left underline decoration-line decoration-dotted underline-offset-2 hover:text-navy hover:decoration-navy ${className}`}
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
