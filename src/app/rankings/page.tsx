import { getRankings } from "@/lib/rankings";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { RankingsBoard } from "@/components/RankingsBoard";

export const revalidate = 3600;

export default async function RankingsPage() {
  const [rankings, ab] = await Promise.all([getRankings(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-3 text-sm text-muted">
          Every rostered-or-relevant QB/RB/WR/TE, ranked within his position by projected
          half-PPR points for week {rankings.next_week} — not just your own roster. The %
          next to each score is his matchup impact for the week; tap a name for the full
          breakdown.
        </p>
        {!rankings.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Rankings unavailable this run.
          </div>
        ) : (
          <RankingsBoard rows={rankings.rows} />
        )}
      </main>
    </>
  );
}
