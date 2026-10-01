"use client";

import { createContext, useContext } from "react";
import type { Schedule } from "@/lib/schedule";
import { STEPS, step } from "@/lib/matchupVerdict";

const EMPTY: Schedule = { available: false, from_week: 0, games: 4, table: {}, names: {} };
const ScheduleContext = createContext<Schedule>(EMPTY);

export function ScheduleProvider({ schedule, children }: { schedule: Schedule; children: React.ReactNode }) {
  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>;
}

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;

/** The next few games' matchups for one player, as a single tag: "Next 4: Good". It is the
 *  rest-of-season counterpart to the lineup page's this-week tag — what the schedule does
 *  for a pickup or a trade target from here. Renders nothing for a player the model has no
 *  schedule for. */
export function ScheduleTag({ name, className = "" }: { name: string; className?: string }) {
  const s = useContext(ScheduleContext);
  const key = s.names[name];
  const row = key ? s.table[key] : undefined;
  if (!row || row.g.length === 0) return null;

  const x = STEPS[step(row.pct)];
  const pos = key.split("|")[1];
  const title =
    `${key.split("|")[0]}'s next ${row.g.length} games, how the opponents' defenses and betting lines treat ${pos}s vs a normal week: ` +
    `${row.g.map(([w, opp, p]) => `wk ${w} ${opp} ${signed(p)}`).join(", ")}. Average ${signed(row.pct)}.`;
  return (
    <span title={title} className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${x.chip} ${className}`}>
      Next {row.g.length}: {x.label}
    </span>
  );
}
