"use client";

import { useState } from "react";
import { KpiRow } from "./KpiRow";
import { RoleCard } from "./RoleCard";
import { ThisWeekNote } from "./ThisWeekNote";
import { SectionHeading } from "./SectionHeading";
import { SeasonDetailCard } from "./SeasonDetailCard";
import { GameLogTable } from "./GameLogTable";
import { ActualVsExpectedChart } from "./ActualVsExpectedChart";
import type { PlayerDetail } from "@/lib/players";

export function PlayerSeasonView({ player, nextWeek }: { player: PlayerDetail; nextWeek: number }) {
  const seasons = Object.keys(player.seasons).sort((a, b) => Number(b) - Number(a));
  const [season, setSeason] = useState(seasons[0]);
  const s = player.seasons[season];

  if (!s) {
    return <p className="mt-4 text-sm text-muted">No {season} regular-season games for {player.name}.</p>;
  }

  const usageRankKey = Object.keys(s.ranks).find((k) => k !== "pts_pg" && k !== "xfp_pg");
  const usageRank = usageRankKey ? s.ranks[usageRankKey] : null;

  return (
    <div className="mt-4">
      {seasons.length > 1 ? (
        <div className="mb-4 flex gap-2">
          {seasons.map((yr) => (
            <button
              key={yr}
              onClick={() => setSeason(yr)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                season === yr ? "bg-navy text-white" : "bg-ink/5 text-muted hover:bg-navy/10 hover:text-navy"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      ) : null}

      <KpiRow
        items={[
          { label: "Games", value: String(s.games), sub: `${season} regular season` },
          { label: "Pts/game", value: s.pts_pg != null ? s.pts_pg.toFixed(1) : "—", sub: s.ranks.pts_pg || "" },
          { label: s.usage_label, value: s.usage_fmt || "—", sub: usageRank || "" },
        ]}
      />

      {s.role ? (
        <div className="mt-4">
          <RoleCard role={s.role} />
        </div>
      ) : null}

      {s.this_week ? (
        <div className="mt-4 rounded-xl border border-line bg-card p-3 shadow-sm">
          <ThisWeekNote thisWeek={s.this_week} nextWeek={nextWeek} />
        </div>
      ) : null}

      {s.card.length > 0 ? (
        <>
          <SectionHeading title="Season detail" />
          <SeasonDetailCard rows={s.card} />
        </>
      ) : null}

      {s.game_log.length > 0 ? (
        <>
          <SectionHeading title="Game log" />
          <GameLogTable rows={s.game_log} />
          <div className="mt-3 rounded-xl border border-line bg-card p-3 shadow-sm">
            <ActualVsExpectedChart rows={s.game_log} />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">No games yet.</p>
      )}
    </div>
  );
}
