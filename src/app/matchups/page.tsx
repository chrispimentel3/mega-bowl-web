import { getMatchups } from "@/lib/matchups";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { TeamEnvironmentCard } from "@/components/TeamEnvironmentCard";
import { PlayerDifficultyRow } from "@/components/PlayerDifficultyRow";
import { VegasPlayersTable } from "@/components/VegasPlayersTable";
import Link from "next/link";

export const revalidate = 3600;

export default async function MatchupsPage() {
  const [mm, ab] = await Promise.all([getMatchups(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={mm.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!mm.available ? (
          <EmptyNote text="Schedule unavailable." />
        ) : (
          <>
            <SectionHeading title={`Week ${mm.next_week} — team game environment (Vegas)`} />
            <p className="mb-3 text-sm text-muted">
              Implied team total = Vegas&apos;s expected points for that offense. Higher = more
              scoring to go around. See{" "}
              <Link href="/logic#vegas" className="text-navy hover:underline">
                Logic → why Vegas lines, not a homemade projection
              </Link>{" "}
              for the math behind these numbers.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {mm.team_environment.map((row) => (
                <TeamEnvironmentCard key={row.team} row={row} />
              ))}
            </div>

            {mm.vegas_players.length > 0 ? (
              <>
                <SectionHeading title={`Week ${mm.next_week} — Vegas player projections`} />
                <VegasPlayersTable rows={mm.vegas_players} myTeam={mm.my_team} />
              </>
            ) : (
              <div className="mt-8">
                <EmptyNote text="No player props on file for this week." />
              </div>
            )}

            {mm.player_difficulty.length > 0 ? (
              <>
                <SectionHeading title={`Week ${mm.next_week} — player matchup difficulty`} />
                <div className="space-y-2">
                  {mm.player_difficulty.map((row) => (
                    <PlayerDifficultyRow key={row.player} row={row} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
      {text}
    </div>
  );
}
