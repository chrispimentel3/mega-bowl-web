"use client";

import { useEffect, useRef, useState } from "react";
import { askQuestion, getAskMeta, rowsToCsv, type AskMeta, type AskResult } from "@/lib/ask";
import { AskResultTable } from "@/components/AskResultTable";

export function AskExplorer() {
  const [meta, setMeta] = useState<AskMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [seasons, setSeasons] = useState<number[]>([]);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getAskMeta()
      .then((m) => {
        setMeta(m);
        setSeasons([m.season]);
      })
      .catch(() => setMetaError("Can't reach the Ask API right now. Try again in a minute."));
  }, []);

  async function run(question: string) {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setSlow(false);
    slowTimer.current = setTimeout(() => setSlow(true), 5000);
    try {
      const res = await askQuestion(question, seasons.length ? seasons : meta ? [meta.season] : []);
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setSlow(false);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    }
  }

  function toggleSeason(y: number) {
    setSeasons((prev) => (prev.includes(y) ? prev.filter((s) => s !== y) : [...prev, y].sort((a, b) => b - a)));
  }

  function download() {
    if (!result) return;
    const csv = rowsToCsv(result.columns, result.rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "answer.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Ask for any list this data can produce — <b>&ldquo;list WRs by snap %&rdquo;</b>,
        &ldquo;top 10 RB by targets last 3 weeks&rdquo;, &ldquo;who leads the Rams in target
        share&rdquo;. It repeats the question back in plain English before answering, so you can
        see how it was read. This runs a live query rather than reading a precomputed file, so
        the first question after a quiet spell can take a little while to answer.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text);
        }}
        className="mb-3 flex gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="list WRs by snap %"
          className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="shrink-0 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Ask
        </button>
      </form>

      {meta ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">Seasons:</span>
          {meta.seasons_selectable.slice(0, 6).map((y) => (
            <button
              key={y}
              onClick={() => toggleSeason(y)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                seasons.includes(y)
                  ? "bg-navy text-white"
                  : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      ) : null}

      {meta ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {meta.examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setText(ex);
                run(ex);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-navy/40 hover:text-navy"
            >
              {ex}
            </button>
          ))}
        </div>
      ) : metaError ? (
        <p className="mb-4 text-sm text-muted">{metaError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">
          {slow ? "Waking up the query engine — first question after a quiet spell can take up to a minute…" : "Thinking…"}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">
          {error}
        </div>
      ) : null}

      {result && !loading ? (
        <div>
          <p className="mb-2 text-sm text-muted">
            <span className="font-semibold text-ink">Read as:</span> {result.restated}
          </p>
          {result.empty ? (
            <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
              No rows. {result.warnings.join(" ") || "Try widening the filters."}
            </div>
          ) : (
            <>
              <AskResultTable columns={result.columns} rows={result.rows} />
              <button
                onClick={download}
                className="mt-3 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-navy/40 hover:text-navy"
              >
                Download this answer (.csv)
              </button>
            </>
          )}
          {result.warnings.map((w) => (
            <p key={w} className="mt-2 text-xs text-muted">
              ⚠︎ {w}
            </p>
          ))}
          {result.note ? <p className="mt-2 text-xs text-muted">{result.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
