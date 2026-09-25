import { getLeague } from "@/lib/league";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { KpiRow } from "@/components/KpiRow";
import { SimpleTable } from "@/components/SimpleTable";
import { WeeklyResultsTable } from "@/components/WeeklyResultsTable";
import { WeeklyPointsChart } from "@/components/WeeklyPointsChart";

export const revalidate = 3600;

const pct = (v: unknown) => (v == null ? "—" : `${((v as number) * 100).toFixed(0)}%`);
const num1 = (v: unknown) => (v == null ? "—" : (v as number).toFixed(1));
const signed = (v: unknown) => (v == null ? "—" : `${(v as number) >= 0 ? "+" : ""}${(v as number).toFixed(0)}`);

export default async function LeaguePage() {
  const [lg, ab] = await Promise.all([getLeague(), getActionBoard()]);
  const myOdds = lg.playoff_odds.find((r) => r.team === lg.my_team);
  const myStanding = lg.standings.rows.find((r) => r.team === lg.my_team);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {lg.playoff_odds.length > 0 ? (
          <>
            <SectionHeading title="Playoff odds" />
            {myOdds ? (
              <div className="mb-3">
                <KpiRow
                  items={[
                    { label: "Make the playoffs", value: pct(myOdds.p_playoffs), sub: "6 of 12 get in" },
                    { label: "First-round bye", value: pct(myOdds.p_bye), sub: "top 2 seeds" },
                    { label: "Win it all", value: pct(myOdds.p_title), sub: "" },
                  ]}
                />
              </div>
            ) : null}
            <SimpleTable
              rowKey={(r) => r.team}
              rows={lg.playoff_odds}
              myTeam={lg.my_team}
              columns={[
                { key: "team", label: "Team" },
                { key: "p_playoffs", label: "Playoffs", align: "right", format: pct },
                { key: "p_bye", label: "Bye", align: "right", format: pct },
                { key: "p_title", label: "Title", align: "right", format: pct },
                { key: "mean_seed", label: "Avg seed", align: "right", format: num1 },
              ]}
            />
            <p className="mt-2 text-xs text-muted">
              6,000 simulated seasons. Each week&apos;s score is drawn around the team&apos;s own
              average, with this league&apos;s own spread.
            </p>
          </>
        ) : null}

        {lg.standings.available ? (
          <>
            <SectionHeading title="Standings" />
            {myStanding ? (
              <div className="mb-3">
                <KpiRow
                  items={[
                    { label: "Record", value: `${myStanding.wins}-${myStanding.losses}${myStanding.ties ? `-${myStanding.ties}` : ""}`, sub: lg.my_team },
                    { label: "Standing", value: `#${myStanding.rank}`, sub: `of ${lg.standings.rows.length}` },
                    { label: "Manager", value: myStanding.manager ?? "—", sub: "you" },
                  ]}
                />
              </div>
            ) : null}
            <SimpleTable
              rowKey={(r) => r.team}
              rows={lg.standings.rows}
              myTeam={lg.my_team}
              columns={[
                { key: "rank", label: "#" },
                { key: "team", label: "Team" },
                { key: "manager", label: "Manager" },
                { key: "wins", label: "W", align: "right" },
                { key: "losses", label: "L", align: "right" },
                { key: "ties", label: "T", align: "right" },
              ]}
            />
            <p className="mt-2 text-xs text-muted">Standings: {lg.standings.source}.</p>
          </>
        ) : null}

        {lg.power_xwins.available ? (
          <>
            <SectionHeading title="Power rankings — expected wins" />
            <p className="mb-3 text-sm text-muted">
              A fantasy record is mostly schedule. This throws the schedule out and asks what each
              week&apos;s score was worth against the whole league. Luck is real wins minus
              expected ones — positive means the record is flattering them.
            </p>
            <SimpleTable
              rowKey={(r) => r.team}
              rows={lg.power_xwins.rows}
              myTeam={lg.my_team}
              columns={[
                { key: "power_rank", label: "#" },
                { key: "team", label: "Team" },
                { key: "xwins", label: "xW", align: "right", format: num1 },
                { key: "wins", label: "W", align: "right" },
                { key: "luck_w", label: "Luck", align: "right", format: signed },
                { key: "pf", label: "PF", align: "right", format: num1 },
                { key: "ppg", label: "PPG", align: "right", format: num1 },
              ]}
            />
            <p className="mt-2 text-xs text-muted">Through week {lg.power_xwins.through_week}.</p>
          </>
        ) : null}

        {lg.power_roster_strength.length > 0 ? (
          <>
            <SectionHeading title="Power rankings — roster strength" />
            <p className="mb-3 text-sm text-muted">
              Every roster scored by what its best legal lineup is worth per game, ignoring record
              entirely. Luck is the gap between where a team sits and how good it is.
            </p>
            <SimpleTable
              rowKey={(r) => r.team}
              rows={lg.power_roster_strength}
              myTeam={lg.my_team}
              columns={[
                { key: "power_rank", label: "#" },
                { key: "team", label: "Team" },
                { key: "starters_pg", label: "Lineup", align: "right", format: num1 },
                { key: "bench_pg", label: "Bench", align: "right", format: num1 },
                { key: "rank", label: "Record #", align: "right" },
                { key: "luck", label: "Luck", align: "right", format: signed },
              ]}
            />
          </>
        ) : null}

        {lg.transactions.length > 0 ? (
          <>
            <SectionHeading title="Recent transactions" />
            <div className="space-y-1.5 text-sm text-muted">
              {lg.transactions.map((tx, i) => (
                <div key={i} className="rounded-lg border border-line bg-card p-2.5">
                  {Object.entries(tx).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {lg.weekly_results.available ? (
          <>
            <SectionHeading title="Weekly results" />
            <WeeklyResultsTable rows={lg.weekly_results.rows} />

            <SectionHeading title="Points by week" />
            <p className="mb-3 text-sm text-muted">
              The rest of the league is the grey backdrop. Flat and high beats spiky and high — a
              team that swings wildly loses weeks it should win.
            </p>
            <WeeklyPointsChart rows={lg.weekly_results.rows} myTeam={lg.my_team} />
            <p className="mt-2 text-xs text-muted">Scores from the {lg.weekly_results.source}.</p>
          </>
        ) : null}
      </main>
    </>
  );
}
