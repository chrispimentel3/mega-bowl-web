"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PlayerIndexRow } from "@/lib/players";

export function PlayerSearch({ index }: { index: PlayerIndexRow[] }) {
  const [q, setQ] = useState("");

  const mine = useMemo(() => index.filter((r) => r.mine), [index]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return index.filter((r) => r.label.toLowerCase().includes(needle)).slice(0, 25);
  }, [q, index]);

  return (
    <div>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search — e.g. Puka, Bijan, Kelce…"
        className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-navy"
      />

      {q.trim() ? (
        <div className="mt-3 space-y-2">
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No players match &quot;{q}&quot;.</p>
          ) : (
            results.map((r) => <ResultRow key={r.gsis_id} row={r} />)
          )}
        </div>
      ) : (
        <>
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Or pick one of yours
          </p>
          <div className="space-y-2">
            {mine.map((r) => (
              <ResultRow key={r.gsis_id} row={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResultRow({ row }: { row: PlayerIndexRow }) {
  return (
    <Link
      href={`/players/${row.gsis_id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3 shadow-sm transition-colors hover:border-navy/40"
    >
      <div className="flex items-center gap-2">
        <PlayerAvatar player={row.name} size={32} />
        <PosBadge pos={row.pos} />
        <span className="text-sm font-semibold text-ink">{row.name}</span>
      </div>
      <span className="text-xs text-muted">
        {row.team || (row.last_team ? `no NFL team (last: ${row.last_team})` : "no NFL team")}
      </span>
    </Link>
  );
}
