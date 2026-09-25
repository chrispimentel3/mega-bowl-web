import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { AskExplorer } from "@/components/AskExplorer";

export default async function AskPage() {
  const ab = await getActionBoard();

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <AskExplorer />
      </main>
    </>
  );
}
