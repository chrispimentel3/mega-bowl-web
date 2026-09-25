"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PosBadge } from "./PosBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PlayerIndexRow } from "@/lib/players";

export function ComparePicker({
  index,
  selectedIds,
  maxPlayers,
}: {
  index: PlayerIndexRow[];
  selectedIds: string[];
  maxPlayers: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const byId = useMemo(() => new Map(index.map((r) => [r.gsis_id, r])), [index]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((r): r is PlayerIndexRow => !!r);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return index
      .filter((r) => r.label.toLowerCase().includes(needle) && !selectedIds.includes(r.gsis_id))
      .slice(0, 10);
  }, [q, index, selectedIds]);

  function navigate(ids: string[]) {
    router.push(ids.length ? `/compare?ids=${ids.join(",")}` : "/compare");
  }

  function add(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= maxPlayers) return;
    setQ("");
    navigate([...selectedIds, id]);
  }

  function remove(id: string) {
    navigate(selectedIds.filter((i) => i !== id));
  }

  const full = selectedIds.length >= maxPlayers;

  return (
    <div>
      {selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((r) => (
            <button
              key={r.gsis_id}
              onClick={() => remove(r.gsis_id)}
              className="flex items-center gap-1.5 rounded-full bg-navy/10 py-1 pl-1 pr-2.5 text-sm font-medium text-navy"
            >
              <PlayerAvatar player={r.name} size={20} />
              {r.name}
              <span className="text-navy/60">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={full}
        placeholder={full ? `Remove one to add another (max ${maxPlayers})` : "Search — e.g. Puka, Bijan, Kelce…"}
        className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-navy disabled:opacity-50"
      />

      {q.trim() && !full ? (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">No players match &quot;{q}&quot;.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.gsis_id}
                onClick={() => add(r.gsis_id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-card p-2.5 text-left shadow-sm transition-colors hover:border-navy/40"
              >
                <span className="flex items-center gap-2">
                  <PlayerAvatar player={r.name} size={24} />
                  <PosBadge pos={r.pos} />
                  <span className="text-sm font-semibold text-ink">{r.name}</span>
                </span>
                <span className="text-xs text-muted">{r.team || "no NFL team"}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
