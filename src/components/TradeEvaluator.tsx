"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTradePool, evaluateTrade, type TradePoolRow, type TradeSearchResult } from "@/lib/tradeSearch";
import { TradeSearchResultCard } from "@/components/TradeSearchResultCard";

const MAX_SIDE = 3;

function Side({
  label, pool, picked, setPicked, placeholder,
}: {
  label: string;
  pool: TradePoolRow[];
  picked: TradePoolRow[];
  setPicked: (rows: TradePoolRow[]) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return pool.filter((r) => !picked.some((p) => p.pid === r.pid) && r.label.toLowerCase().includes(needle)).slice(0, 8);
  }, [pool, picked, q]);

  return (
    <div className="min-w-0 flex-1">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {picked.map((p) => (
          <button
            key={p.pid}
            onClick={() => setPicked(picked.filter((x) => x.pid !== p.pid))}
            className="rounded-full border border-navy bg-navy px-2.5 py-1 text-xs text-white"
            aria-label={`Remove ${p.player}`}
          >
            {p.player} · {p.pos} ✕
          </button>
        ))}
      </div>
      {picked.length < MAX_SIDE ? (
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-navy"
        />
      ) : null}
      {matches.length ? (
        <div className="mt-1 space-y-1">
          {matches.map((r) => (
            <button
              key={r.pid}
              onClick={() => {
                setPicked([...picked, r]);
                setQ("");
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-left text-xs hover:border-navy/40"
            >
              <span className="text-ink">{r.label}</span>
              {r.ir ? <span className="shrink-0 text-muted">on IR</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Score one trade as entered — an offer you got, or one you're thinking of sending. */
export function TradeEvaluator() {
  const [pool, setPool] = useState<TradePoolRow[] | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [give, setGive] = useState<TradePoolRow[]>([]);
  const [get, setGet] = useState<TradePoolRow[]>([]);
  const [result, setResult] = useState<TradeSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const fetchPool = () => {
    getTradePool()
      .then(setPool)
      .catch(() => setPoolError("Can't reach the trade service right now."));
  };
  useEffect(fetchPool, []);
  const load = () => {
    setPoolError(null);
    fetchPool();
  };

  const mine = useMemo(() => (pool ?? []).filter((r) => r.mine), [pool]);
  // once one player is picked on their side, only his team's roster is offered
  const theirs = useMemo(
    () => (pool ?? []).filter((r) => !r.mine && (get.length === 0 || r.team === get[0].team)),
    [pool, get],
  );

  async function run() {
    const id = ++latest.current;
    setLoading(true);
    setPricing(false);
    setError(null);
    setResult(null);
    const g = give.map((r) => r.pid), t = get.map((r) => r.pid);
    try {
      const quick = await evaluateTrade(g, t, false);
      if (id !== latest.current) return;
      setResult(quick);
      setLoading(false);
      setPricing(true);
      const full = await evaluateTrade(g, t, true);
      if (id === latest.current) setResult(full);
    } catch (e) {
      if (id === latest.current) setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      if (id === latest.current) {
        setLoading(false);
        setPricing(false);
      }
    }
  }

  if (poolError) {
    return (
      <p className="text-sm text-muted">
        {poolError}{" "}
        <button onClick={load} className="font-semibold text-navy hover:underline">
          Try again
        </button>
      </p>
    );
  }
  if (!pool) {
    return <p className="py-3 text-sm text-muted">Loading the player list — the service may be waking up…</p>;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Got an offer, or thinking of sending one? Enter it exactly. Both rosters are rebuilt, then
        it&apos;s priced in points a week, the chance they&apos;d say yes and your title odds.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Side label="You give" pool={mine} picked={give} setPicked={setGive} placeholder="Your player…" />
        <Side
          label={get.length ? `You get · from ${get[0].team}` : "You get"}
          pool={theirs}
          picked={get}
          setPicked={setGet}
          placeholder="Their player…"
        />
      </div>
      <button
        onClick={run}
        disabled={!give.length || !get.length || loading}
        className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {loading ? "Evaluating…" : "Evaluate trade"}
      </button>

      {error ? (
        <div className="mt-3 rounded-xl border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">{error}</div>
      ) : null}
      {result?.rows[0] ? (
        <div className="mt-3 space-y-2">
          {result.verdict ? <p className="text-sm font-semibold text-ink">{result.verdict}</p> : null}
          <TradeSearchResultCard row={result.rows[0]} pricing={pricing} hideNeeds={false} />
        </div>
      ) : null}
    </div>
  );
}
