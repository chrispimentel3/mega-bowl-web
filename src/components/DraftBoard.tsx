"use client";

import { useMemo, useState } from "react";
import { DraftRow } from "./DraftRow";
import type { DraftBoardRow } from "@/lib/draft";

export function DraftBoard({ board }: { board: DraftBoardRow[] }) {
  const [mineOnly, setMineOnly] = useState(false);

  const view = useMemo(() => (mineOnly ? board.filter((r) => r.mine) : board), [board, mineOnly]);
  const risers = view.slice(0, 15);
  const fallers = useMemo(() => [...view].sort((a, b) => a.value_delta - b.value_delta).slice(0, 15), [view]);

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={mineOnly}
          onChange={(e) => setMineOnly(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-navy"
        />
        My picks only
      </label>

      <p className="mb-2 text-sm font-semibold text-ink">▲ Risers vs draft slot</p>
      <div className="mb-6 space-y-2">
        {risers.map((row) => (
          <DraftRow key={row.player} row={row} />
        ))}
      </div>

      <p className="mb-2 text-sm font-semibold text-ink">▼ Fallers vs draft slot</p>
      <div className="space-y-2">
        {fallers.map((row) => (
          <DraftRow key={row.player} row={row} />
        ))}
      </div>
    </div>
  );
}
