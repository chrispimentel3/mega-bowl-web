import { getLogic } from "@/lib/logic";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { LogicDetail } from "@/components/LogicDetail";

export const revalidate = 86400;

export default async function LogicPage() {
  const [logic, ab] = await Promise.all([getLogic(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-4 text-sm text-muted">
          The Glossary says what a tag on a player means. This is the layer underneath that —
          why the dashboard reaches for a given number in the first place. Each one starts with
          the short answer; open it up for the actual mechanics.
        </p>

        <div className="space-y-3">
          {logic.topics.map((topic) => (
            <details
              key={topic.key}
              id={topic.key}
              className="group scroll-mt-4 rounded-xl border border-line bg-card p-4 shadow-sm"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-ink">{topic.title}</h2>
                  <span className="mt-0.5 shrink-0 text-xs text-muted transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{topic.headline}</p>
              </summary>
              <div className="mt-4 border-t border-line pt-4">
                <LogicDetail text={topic.detail} />
              </div>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
