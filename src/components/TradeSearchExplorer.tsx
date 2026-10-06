"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTradePool, searchTrades, searchTeam, ODDS_TOP, type TradePoolRow, type TradeSearchResult } from "@/lib/tradeSearch";
import { TradeSearchResultCard } from "@/components/TradeSearchResultCard";

/** What was searched: one player in the league, or every offer to one team. */
type Target = { kind: "player"; row: TradePoolRow } | { kind: "team"; team: string };

export function TradeSearchExplorer() {
  const [pool, setPool] = useState<TradePoolRow[] | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"player" | "team">("player");
  const [picked, setPicked] = useState<Target | null>(null);
  const [twoPlayer, setTwoPlayer] = useState(true);
  const [size, setSize] = useState<1 | 2 | 3>(3);          // team search: most players on a side
  const [shape, setShape] = useState<string | null>(null); // team search: only this shape
  const [order, setOrder] = useState<"accept" | "gain">("accept");
  const [result, setResult] = useState<TradeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(false);   // offers shown, odds still coming
  const [oddsFailed, setOddsFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);   // only the newest search may write its result

  const fetchPool = useCallback(() => {
    getTradePool()
      .then(setPool)
      .catch(() => setPoolError("Can't reach the trade search service right now."));
  }, []);
  useEffect(fetchPool, [fetchPool]);
  const retryPool = () => {
    setPoolError(null);
    fetchPool();
  };

  const results = useMemo(() => {
    if (!pool || !q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return pool.filter((r) => r.label.toLowerCase().includes(needle)).slice(0, 10);
  }, [pool, q]);

  // the other eleven teams, as the pool names them
  const teams = useMemo(
    () => (pool ? [...new Set(pool.filter((r) => !r.mine).map((r) => r.team))].sort() : []),
    [pool],
  );
  const search = (t: Target, o: "accept" | "gain", two: boolean, sz: 1 | 2 | 3, sh: string | null, odds: boolean) =>
    t.kind === "player"
      ? searchTrades(t.row.pid, t.row.mine, { order: o, twoPlayer: two, odds })
      : searchTeam(t.team, { order: o, size: sz, shape: sh, odds });

  async function run(
    row: Target,
    o: "accept" | "gain" = order,
    two: boolean = twoPlayer,
    sz: 1 | 2 | 3 = size,
    sh: string | null = null,
  ) {
    setPicked(row);
    setShape(sh);
    setQ("");
    setResult(null);
    const id = ++latest.current;
    setLoading(true);
    setPricing(false);
    setOddsFailed(false);
    setError(null);
    // offers first (a few seconds), then the same search again with playoff/title odds,
    // which the service answers from the search it just ran
    let offers: TradeSearchResult;
    try {
      offers = await search(row, o, two, sz, sh, false);
    } catch (e) {
      if (id === latest.current) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setLoading(false);
      }
      return;
    }
    if (id !== latest.current) return;
    setResult(offers);
    setLoading(false);
    if (!offers.odds_pending || offers.rows.length === 0) return;   // an older API priced them already
    setPricing(true);
    try {
      const full = await search(row, o, two, sz, sh, true);
      if (id === latest.current) setResult(full);
    } catch {
      if (id === latest.current) setOddsFailed(true);
    } finally {
      if (id === latest.current) setPricing(false);
    }
  }

  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-line bg-card p-0.5 text-sm">
        {(["player", "team"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              mode === m ? "bg-navy text-white" : "text-muted hover:text-ink"
            }`}
          >
            {m === "player" ? "A player" : "A team"}
          </button>
        ))}
      </div>
      {mode === "team" ? (
        <>
          <p className="mb-3 text-sm text-muted">
            Pick a team to see every offer that would work with them, and which of their players
            would help your lineup most. Tap a target to trade around just him.
          </p>
          {poolError ? (
            <p className="text-sm text-muted">
              {poolError}{" "}
              <button onClick={retryPool} className="font-semibold text-navy hover:underline">
                Try again
              </button>
            </p>
          ) : !pool ? (
            <p className="py-3 text-sm text-muted">Loading the teams — the search service may be waking up…</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {teams.map((t) => {
                const on = picked?.kind === "team" && picked.team === t;
                return (
                  <button
                    key={t}
                    onClick={() => run({ kind: "team", team: t })}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      on ? "border-navy bg-navy text-white" : "border-line bg-card text-ink hover:border-navy/40"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : null}
      {mode === "player" ? (
      <>
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
      {poolError ? (
        <p className="mt-2 text-sm text-muted">
          {poolError}{" "}
          <button onClick={retryPool} className="font-semibold text-navy hover:underline">
            Try again
          </button>
        </p>
      ) : !pool && q.trim() ? (
        <p className="mt-2 py-3 text-center text-sm text-muted">
          Loading the player list — the search service may be waking up, which can take up to a minute…
        </p>
      ) : q.trim() ? (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">No players match &quot;{q}&quot;.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.pid}
                onClick={() => run({ kind: "player", row: r })}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-card p-2.5 text-left text-sm shadow-sm transition-colors hover:border-navy/40"
              >
                <span className="font-medium text-ink">{r.label}</span>
                {r.ir ? <span className="shrink-0 text-xs text-muted">on IR</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
      </>
      ) : null}

      {picked ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">
              <span className="font-semibold text-ink">
                {picked.kind === "player" ? picked.row.player : picked.team}
              </span>{" "}
              <span className="text-muted">
                {picked.kind === "player"
                  ? `· ${picked.row.pos} · ${picked.row.mine ? "yours" : `on ${picked.row.team}`}`
                  : "· every offer to this team"}
                {result ? ` · ${result.evaluated.toLocaleString()} trades evaluated` : ""}
              </span>
            </p>
            <div className="ml-auto flex items-center gap-2 text-xs">
              {picked.kind === "player" ? (
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
              ) : (
                <select
                  value={size}
                  onChange={(e) => {
                    const v = Number(e.target.value) as 1 | 2 | 3;
                    setSize(v);
                    run(picked, order, twoPlayer, v);
                  }}
                  className="rounded-md border border-line bg-card px-1.5 py-1 text-muted"
                >
                  <option value={1}>1-for-1 only</option>
                  <option value={2}>Up to 2 players</option>
                  <option value={3}>Up to 3 players</option>
                </select>
              )}
              <select
                value={order}
                onChange={(e) => {
                  const v = e.target.value as "accept" | "gain";
                  setOrder(v);
                  run(picked, v, twoPlayer, size, shape);
                }}
                className="rounded-md border border-line bg-card px-1.5 py-1 text-muted"
              >
                <option value="accept">Most likely accepted</option>
                <option value="gain">Best for me</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-muted">
              Rebuilding both rosters for every trade… usually a few seconds, up to a minute if the service was asleep.
            </p>
          ) : null}
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
              <>
                {oddsFailed ? (
                  <p className="mt-3 text-xs text-muted">
                    Couldn&apos;t price these in playoff odds this time — the offers and lineup
                    changes above still stand. Search again to retry.
                  </p>
                ) : null}
                {picked.kind === "team" && result.profile ? (
                  <p className="mt-3 text-sm text-muted">
                    {result.profile.needs.length ? (
                      <>
                        <b className="text-ink">Needs</b>{" "}
                        {result.profile.needs.map((n) => `${n.pos} (${n.gap.toFixed(1)} pts/wk under the league average)`).join(", ")}
                        {" — lead with that. "}
                      </>
                    ) : (
                      "No clear hole — pitch on value, not need. "
                    )}
                    {result.profile.spare.length ? (
                      <>
                        <b className="text-ink">Spare</b>{" "}
                        {result.profile.spare.map((p) => `${p.name} (${p.pos})`).join(", ")} — bench players who&apos;d
                        start for the typical team.
                      </>
                    ) : null}
                  </p>
                ) : null}
                {picked.kind === "team" && result.shape_counts && Object.keys(result.shape_counts).length > 1 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {[null, ...["1-for-1", "2-for-1", "1-for-2", "2-for-2", "3-for-1", "3-for-2"].filter((x) => result.shape_counts?.[x])].map((sh) => (
                      <button
                        key={sh ?? "all"}
                        onClick={() => run(picked, order, twoPlayer, size, sh)}
                        className={`rounded-full border px-2.5 py-1 transition-colors ${
                          shape === sh ? "border-navy bg-navy text-white" : "border-line bg-card text-muted hover:text-ink"
                        }`}
                      >
                        {sh ?? "All shapes"}
                        {sh ? ` · ${result.shape_counts?.[sh]}` : ""}
                      </button>
                    ))}
                  </div>
                ) : null}
                {picked.kind === "team" && result.targets?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Best targets on {picked.team}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.targets.map((t) => {
                        const row = pool?.find((r) => !r.mine && r.player === t.name);
                        return (
                          <button
                            key={t.name}
                            disabled={!row}
                            onClick={() => row && run({ kind: "player", row })}
                            className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-left text-xs hover:border-navy/40 disabled:opacity-60"
                          >
                            <span className="font-medium text-ink">{t.name}</span>{" "}
                            <span className="text-muted">
                              {t.pos} · +{t.best_d_me.toFixed(1)} pts/wk · {t.offers} offers
                            </span>
                            {t.out ? (
                              <span className="ml-1 font-bold text-crimson">
                                · out{t.out.back != null ? ` til wk ${t.out.back}` : ""}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {result.rows.map((row, i) => (
                    <TradeSearchResultCard key={i} row={row} pricing={pricing && i < ODDS_TOP} hideNeeds={picked.kind === "team"} />
                  ))}
                </div>
              </>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
