import { getUsage } from "@/lib/usage";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { UsageExplorer } from "@/components/UsageExplorer";

export const revalidate = 3600;

export default async function UsagePage() {
  const [usage, ab] = await Promise.all([getUsage(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!usage.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No usage data available for this season.
          </div>
        ) : (
          <div className="mt-4">
            <UsageExplorer usage={usage} />
          </div>
        )}
      </main>
    </>
  );
}
