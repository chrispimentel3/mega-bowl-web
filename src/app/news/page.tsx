import { getNews } from "@/lib/news";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { NewsExplorer } from "@/components/NewsExplorer";

export const revalidate = 900;

export default async function NewsPage() {
  const [news, ab] = await Promise.all([getNews(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!news.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            News isn&apos;t available right now.
          </div>
        ) : (
          <div className="mt-4">
            <NewsExplorer items={news.items} />
          </div>
        )}
      </main>
    </>
  );
}
