import { getGlossary } from "@/lib/glossary";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { InlineMarkdown } from "@/components/InlineMarkdown";

export const revalidate = 86400;

export default async function GlossaryPage() {
  const [g, ab] = await Promise.all([getGlossary(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <p className="mb-2 text-sm text-muted">
          Every tag the dashboard puts next to a player, in plain English.
        </p>
        <InlineMarkdown text={g.headline} className="mb-4 text-sm text-muted" />

        {g.groups.map((group) => (
          <div key={group.key}>
            <SectionHeading title={group.title} />
            <InlineMarkdown text={group.lede} className="mb-3 text-sm text-muted" />
            <div className="space-y-2">
              {group.rows.map((row) => (
                <div key={row.tag} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                  <p className="font-display text-sm font-bold text-navy">{row.tag}</p>
                  <p className="mt-1 text-sm text-ink">{row["what it means"]}</p>
                  <p className="mt-1 text-xs text-muted">{row["why it matters"]}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
