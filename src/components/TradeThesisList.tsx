"use client";

import { useMemo, useState } from "react";
import { TradeThesisCard } from "./TradeThesisCard";
import type { TradeThesis } from "@/lib/trades";

type Order = "title" | "accept";

/** Title-odds order is the handoff's ranking (D1); "most likely accepted" re-sorts by
 *  P(accept) × our title gain — the offer worth sending first, not just the best one. */
export function TradeThesisList({ cards }: { cards: TradeThesis[] }) {
  const [order, setOrder] = useState<Order>("title");
  const sorted = useMemo(() => {
    const gain = (c: TradeThesis) => (c.us.title_noise ? 0 : c.us.d_title);
    const s = [...cards];
    if (order === "accept") s.sort((a, b) => b.p_accept * gain(b) - a.p_accept * gain(a));
    else s.sort((a, b) => gain(b) - gain(a) || b.us.d_ros - a.us.d_ros);
    return s;
  }, [cards, order]);

  return (
    <>
      <div className="mt-4 inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-semibold">
        {(
          [
            ["title", "Best for your title odds"],
            ["accept", "Most worth sending"],
          ] as [Order, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setOrder(k)}
            className={`rounded-md px-3 py-1.5 ${order === k ? "bg-navy text-white" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        {sorted.map((c) => (
          <TradeThesisCard key={`${c.partner}|${c.give.map((g) => g.name).join("+")}|${c.get.map((g) => g.name).join("+")}`} card={c} />
        ))}
      </div>
    </>
  );
}
