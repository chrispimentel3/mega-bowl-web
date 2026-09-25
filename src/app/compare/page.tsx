import { getPlayerIndex, getPlayer, type PlayerDetail } from "@/lib/players";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { ComparePicker } from "@/components/ComparePicker";
import { ComparePlayerCard } from "@/components/ComparePlayerCard";

export const revalidate = 3600;

const MAX_PLAYERS = 4;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);

  const [index, ab, fetched] = await Promise.all([
    getPlayerIndex(),
    getActionBoard(),
    Promise.all(ids.map((id) => getPlayer(id))),
  ]);

  const found = fetched.filter((p): p is PlayerDetail => p != null && !p.error);
  const missing = ids.length - found.length;

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-4 text-sm text-muted">
          Pick up to {MAX_PLAYERS} players to compare side by side — season stats, role, and
          this week&apos;s matchup.
        </p>

        {index.available ? (
          <ComparePicker index={index.index} selectedIds={ids} maxPlayers={MAX_PLAYERS} />
        ) : null}

        {missing > 0 ? (
          <p className="mt-3 text-xs text-crimson">
            {missing} of {ids.length} selected player{ids.length === 1 ? "" : "s"} couldn&apos;t be loaded.
          </p>
        ) : null}

        {found.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">Search above to add players.</p>
        ) : (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {found.map((p) => (
              <div key={p.gsis_id} className="w-[270px] shrink-0">
                <ComparePlayerCard player={p} nextWeek={ab.next_week} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
