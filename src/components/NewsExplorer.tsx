"use client";

import { useMemo, useState } from "react";
import type { NewsItem } from "@/lib/news";

const SCOPES = ["My roster", "Watchlist + roster", "All NFL"] as const;

function formatDate(ms: number | null): string {
  if (ms == null) return "";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NewsExplorer({ items }: { items: NewsItem[] }) {
  const [scope, setScope] = useState<(typeof SCOPES)[number]>("My roster");
  const [watch, setWatch] = useState("");

  const filtered = useMemo(() => {
    if (scope === "All NFL") return items;
    if (scope === "My roster") return items.filter((i) => i.mentions_mine);
    const terms = watch
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return items.filter(
      (i) => i.mentions_mine || terms.some((t) => i.title.toLowerCase().includes(t)),
    );
  }, [items, scope, watch]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === s ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {scope === "Watchlist + roster" ? (
        <input
          type="text"
          value={watch}
          onChange={(e) => setWatch(e.target.value)}
          placeholder="Watchlist (comma-separated) — e.g. Nabers, Kelce"
          className="mb-4 w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-navy"
        />
      ) : null}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nothing matches this scope right now.</p>
        ) : (
          filtered.map((item) => (
            <a
              key={item.link}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-line bg-card p-3 shadow-sm transition-colors hover:border-navy/40"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-muted">{item.source}</span>
                <span className="text-[11px] text-muted">{formatDate(item.published)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">{item.title}</p>
              {item.summary ? <p className="mt-1 text-xs text-muted">{item.summary}</p> : null}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
