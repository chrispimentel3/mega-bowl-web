"use client";

import { useState } from "react";
import { WaiverLaneCard } from "./WaiverLaneCard";
import type { WaiverLaneRow } from "@/lib/waivers";

type LaneKey = "bid_now" | "early_signal" | "stash";

const LANES: { key: LaneKey; title: string; blurb: (tau: number) => string; empty?: string }[] = [
  {
    key: "bid_now",
    title: "Bid now",
    blurb: (tau) => `Adds more than ${tau} pts/wk to your lineup over the next three weeks.`,
    empty:
      "Nothing available improves your lineup over the next three weeks. That's a real answer, not a missing one — hold the budget for a week when it isn't true.",
  },
  {
    key: "early_signal",
    title: "Early signal",
    blurb: () =>
      "Usage is rising before the points have. Ranked by the chance his role grows (fitted on 2021–25) times what it's worth to you if it does.",
  },
  {
    key: "stash",
    title: "Stash",
    blurb: () => "Worth a bench spot for what he insures or covers, not for what he scores this week.",
  },
];

/** HANDOFF v1.3 §7: the three waiver lanes as tabs, each with its count, opening on the
 *  first lane that has anyone in it. */
export function WaiverLanes({
  lanes,
  tau,
}: {
  lanes: Record<LaneKey, WaiverLaneRow[]>;
  tau: number;
}) {
  const first = LANES.find((l) => (lanes[l.key] ?? []).length)?.key ?? "bid_now";
  const [active, setActive] = useState<LaneKey>(first);
  const lane = LANES.find((l) => l.key === active)!;
  const rows = lanes[active] ?? [];

  return (
    <section className="mt-6">
      <div role="tablist" className="flex gap-1 rounded-xl border border-line bg-card p-1">
        {LANES.map((l) => {
          const n = (lanes[l.key] ?? []).length;
          const on = l.key === active;
          return (
            <button
              key={l.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(l.key)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                on ? "bg-navy text-white" : "text-muted hover:text-ink"
              }`}
            >
              {l.title} <span className={on ? "text-white" : "text-muted"}>{n}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-3 mt-3 text-sm text-muted">{lane.blurb(tau)}</p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
          {lane.empty ?? "Nobody in this lane this week."}
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <WaiverLaneCard key={row.player} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
