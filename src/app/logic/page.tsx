import { getLogic } from "@/lib/logic";
import { getGlossary } from "@/lib/glossary";
import { InlineMarkdown } from "@/components/InlineMarkdown";
import { SectionHeading } from "@/components/SectionHeading";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { LogicDetail } from "@/components/LogicDetail";

export const revalidate = 86400;

export default async function LogicPage() {
  const [logic, g, ab] = await Promise.all([getLogic(), getGlossary(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-4 text-sm text-muted">
          Why the dashboard reaches for a given number in the first place. Each one starts with the
          short answer; open it up for the actual mechanics. What each player tag means is{" "}
          <a href="#tags" className="text-navy hover:underline">at the bottom</a>.
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

        <div id="tags" className="scroll-mt-4">
          <SectionHeading title="What the tags mean" />
        </div>
        <InlineMarkdown text={g.headline} className="mb-3 text-sm text-muted" />
        <div className="space-y-3">
          {g.groups.map((group) => (
            <details key={group.key} className="group rounded-xl border border-line bg-card p-4 shadow-sm">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-ink">{group.title}</h2>
                  <span className="mt-0.5 shrink-0 text-xs text-muted transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </div>
                <InlineMarkdown text={group.lede} className="mt-1.5 text-sm text-muted" />
              </summary>
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {group.rows.map((row) => (
                  <div key={row.tag}>
                    <p className="font-display text-sm font-bold text-navy">{row.tag}</p>
                    <p className="mt-0.5 text-sm text-ink">{row["what it means"]}</p>
                    <p className="mt-0.5 text-xs text-muted">{row["why it matters"]}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
