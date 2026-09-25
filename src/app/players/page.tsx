import { getPlayerIndex } from "@/lib/players";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { PlayerSearch } from "@/components/PlayerSearch";

export const revalidate = 3600;

export default async function PlayersPage() {
  const [players, ab] = await Promise.all([getPlayerIndex(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-4 text-sm text-muted">
          Look up any QB, RB, WR or TE — who has him in Mega Bowl, how he&apos;s actually being
          used, and every game he&apos;s played. Type part of a name.
        </p>
        {!players.available ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            The player index isn&apos;t available right now.
          </div>
        ) : (
          <PlayerSearch index={players.index} />
        )}
      </main>
    </>
  );
}
