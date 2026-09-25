"use client";

import { useEffect, useMemo, useState } from "react";
import { getTradePool, searchTrades, type TradePoolRow, type TradeSearchResult } from "@/lib/tradeSearch";
import { TradeSearchResultCard } from "@/components/TradeSearchResultCard";

export function TradeSearchExplorer() {
  const [pool, setPool] = useState<TradePoolRow[] | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<TradePoolRow | null>(null);
  const [twoPlayer, setTwoPlayer] = useState(true);
  const [order, setOrder] = useState<"accept" | "gain">("accept");
  const [result, setResult] = useState<TradeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTradePool()
      .then(setPool)
      .catch(() => setPoolError("Can't reach the trade search API right now. Try again in a minute."));
  }, []);

  const results = useMemo(() => {
    if (!pool || !q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return pool.filter((r) => r.label.toLowerCase().includes(needle)).slice(0, 10);
  }, [pool, q]);

  async function run(row: TradePoolRow, o: "accept" | "gain" = order, two: boolean = twoPlayer) {
    setPicked(row);
    setQ("");
    setLoading(true);
    setError(null);
    try {
      const res = await searchTrades(row.pid, row.mine, { order: o, twoPlayer: two });
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Pick anyone in the league. If he&apos;s <b>yours</b>, this is what could come back for
        him. If he&apos;s <b>someone else&apos;s</b>, it&apos;s what it would take to get him —
        both rosters rebuilt and re-optimized for every candidate, priced in playoff odds for
        the best few. This runs a live search rather than reading a precomputed file, so the
        first search after a quiet spell can take a little while.
      </p>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search — e.g. Kelce, Bijan, Nabers…"
        className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-navy"
      />
      {q.trim() ? (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">No players match &quot;{q}&quot;.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.pid}
                onClick={() => run(r)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-card p-2.5 text-left text-sm shadow-sm transition-colors hover:border-navy/40"
              >
                <span className="font-medium text-ink">{r.label}</span>
              </button>
            ))
          )}
        </div>
      ) : poolError ? (
        <p className="mt-3 text-sm text-muted">{poolError}</p>
      ) : null}

      {picked ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">
              <span className="font-semibold text-ink">{picked.player}</span>{" "}
              <span className="text-muted">
                · {picked.pos} · {picked.mine ? "yours" : `on ${picked.team}`}
                {result ? ` · ${result.evaluated.toLocaleString()} trades evaluated` : ""}
              </span>
            </p>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-muted">
                <input
                  type="checkbox"
                  checked={twoPlayer}
                  onChange={(e) => {
                    setTwoPlayer(e.target.checked);
                    run(picked, order, e.target.checked);
                  }}
                />
                2-player packages
              </label>
              <select
                value={order}
                onChange={(e) => {
                  const v = e.target.value as "accept" | "gain";
                  setOrder(v);
                  run(picked, v, twoPlayer);
                }}
                className="rounded-md border border-line bg-card px-1.5 py-1 text-muted"
              >
                <option value="accept">Most likely accepted</option>
                <option value="gain">Best for me</option>
              </select>
            </div>
          </div>

          {loading ? <p className="mt-3 text-sm text-muted">Rebuilding both rosters for every trade…</p> : null}
          {error ? (
            <div className="mt-3 rounded-xl border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">
              {error}
            </div>
          ) : null}

          {result && !loading ? (
            result.rows.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
                Nothing clears the filters. Every offer has to leave your lineup better off —
                try allowing two-player packages.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.rows.map((row, i) => (
                  <TradeSearchResultCard key={i} row={row} />
                ))}
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
