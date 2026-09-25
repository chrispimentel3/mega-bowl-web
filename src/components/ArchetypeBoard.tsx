"use client";

import { useMemo, useState } from "react";
import { PosBadge } from "./PosBadge";
import type { ArchBoardRow } from "@/lib/archetypes";

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

const STATUS_LABEL: Record<string, string> = {
  mine: "mine",
  rostered: "rostered",
  available: "available",
};

const STATUS_STYLE: Record<string, string> = {
  mine: "bg-navy/10 text-navy",
  rostered: "bg-ink/5 text-muted",
  available: "bg-pos-rb/10 text-pos-rb",
};

export function ArchetypeBoard({ rows }: { rows: ArchBoardRow[] }) {
  const [pos, setPos] = useState<(typeof POSITIONS)[number]>("QB");

  const filtered = useMemo(
    () => rows.filter((r) => r.pos === pos).slice(0, 20),
    [rows, pos],
  );

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {POSITIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              pos === p ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-muted">
        available = not on any draft-board roster (verify against live adds) · mine = already
        yours.
      </p>
      <div className="space-y-2">
        {filtered.map((row) => (
          <div key={row.player} className="rounded-xl border border-line bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <PosBadge pos={row.pos} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{row.player}</p>
                  <p className="text-xs text-muted">
                    {row.team}
                    {row.half_ppr_pg != null ? ` · ${row.half_ppr_pg.toFixed(1)} pts/g` : ""}
                    {row.proj_ppg != null ? ` · proj ${row.proj_ppg.toFixed(1)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[row.status] ?? ""}`}>
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
                <div className="text-right">
                  <p className="font-display text-lg font-bold leading-none text-ink">
                    {row.arch_fit.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-sm text-muted">{row.why}</p>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No {pos}s scored yet.</p>
        ) : null}
      </div>
    </div>
  );
}
