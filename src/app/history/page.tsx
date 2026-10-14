import { getHistory, type HabitRow } from "@/lib/history";
import { getLeague } from "@/lib/league";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SimpleTable } from "@/components/SimpleTable";
import { SeasonHistory } from "@/components/SeasonHistory";

export const revalidate = 3600;

export default async function HistoryPage() {
  const [h, lg, ab] = await Promise.all([getHistory(), getLeague(), getActionBoard()]);
  const champs = h.seasons.filter((s) => s.champion);
  const habits = h.habits ?? [];
  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">League history</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Final standings and rosters for every completed season, from Yahoo.
        </p>

        {!h.available ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No past seasons are loaded yet.
          </div>
        ) : (
          <>
            {h.missing.length ? (
              <p className="mb-4 rounded-lg bg-ink/5 px-3 py-2 text-xs text-muted">
                Still loading: {h.missing.join(", ")}. They&apos;re pulled from Yahoo one season at a time.
              </p>
            ) : null}

            <SectionHeading title="Champions" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {champs.map((s) => (
                <li key={s.year} className="flex items-baseline justify-between rounded-xl border border-line bg-card px-4 py-2.5 shadow-sm">
                  <span className="font-display text-lg font-bold text-ink">{s.year}</span>
                  <span className={`text-sm font-semibold ${s.champion === lg.my_team ? "text-pos-rb-text" : "text-ink"}`}>
                    {s.champion}
                  </span>
                </li>
              ))}
            </ul>

            <SectionHeading title="Season by season" />
            <SeasonHistory seasons={h.seasons} myTeam={lg.my_team} />

            {h.records.length ? (
              <>
                <SectionHeading title="Record book" />
                <SimpleTable
                  rowKey={(r) => r.label}
                  rows={h.records}
                  columns={[
                    { key: "label", label: "Record" },
                    { key: "value", label: "", align: "right" },
                    { key: "team", label: "Team" },
                    { key: "year", label: "Year", align: "right", format: (v) => String(v) },
                  ]}
                  myTeam={lg.my_team}
                />
              </>
            ) : null}

            {h.all_time.rows.length ? (
              <>
                <SectionHeading title="All-time" />
                <SimpleTable
                  rowKey={(r) => `${r.seat ?? "n"}-${r.team}`}
                  rows={h.all_time.rows}
                  myTeam={lg.my_team}
                  columns={[
                    { key: "team", label: "Team" },
                    { key: "titles", label: "Titles", align: "right" },
                    { key: "seasons", label: "Seasons", align: "right" },
                    { key: "record", label: "Record", align: "right" },
                    { key: "win_pct", label: "Win %", align: "right", format: (v) => `${((v as number) * 100).toFixed(0)}%` },
                    { key: "pf", label: "Points for", align: "right", format: (v) => (v as number).toLocaleString() },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  One row per manager, across team renames. Managers who have left are listed under their last
                  team name.
                </p>
              </>
            ) : null}

            {habits.length ? (
              <>
                <SectionHeading title="How each manager plays" />
                <SimpleTable
                  rowKey={(r) => r.team}
                  rows={habits}
                  myTeam={lg.my_team}
                  columns={[
                    { key: "team", label: "Team" },
                    {
                      key: "faab_aggression", label: "Waiver bids", align: "right",
                      format: (v) => (v == null ? "—" : `${(v as number).toFixed(1)}×`),
                    },
                    {
                      key: "trades_per_season", label: "Trades / yr", align: "right",
                      format: (v) => (v == null ? "—" : (v as number).toFixed(1)),
                    },
                    {
                      key: "lean", label: "Pays up for", format: (v) =>
                        (v as HabitRow["lean"]).filter((l) => l.mult > 1).map((l) => l.pos).join(", ") || "—",
                    },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  From every transaction since 2020. Waiver bids compare what a manager bid with what everyone else
                  bid on the same player (1.0× is the league). The waiver board prices rival bids with it, and the trade
                  odds lean toward managers who actually trade. &ldquo;Pays up for&rdquo; is where their waiver money
                  goes against the league&apos;s.
                </p>
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
