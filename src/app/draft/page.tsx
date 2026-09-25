import { getDraft } from "@/lib/draft";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { DraftBoard } from "@/components/DraftBoard";
import { PosBadge } from "@/components/PosBadge";

export const revalidate = 3600;

export default async function DraftPage() {
  const [draft, ab] = await Promise.all([getDraft(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!draft.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            League intel unavailable.
          </div>
        ) : (
          <>
            <div className="mt-4">
              <DraftBoard board={draft.board} />
            </div>

            {draft.regression.length > 0 ? (
              <>
                <SectionHeading title="Your regression watch — actual vs expected half-PPR" />
                <div className="space-y-2">
                  {draft.regression.map((row) => (
                    <div key={row.player} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <PosBadge pos={row.pos} />
                          <p className="text-sm font-semibold text-ink">{row.player}</p>
                        </div>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                            row.diff_pg >= 0 ? "bg-crimson/10 text-crimson" : "bg-pos-rb/10 text-pos-rb"
                          }`}
                        >
                          {row.diff_pg >= 0 ? "+" : ""}
                          {row.diff_pg.toFixed(1)} xFP±/g
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {row.gms} games · actual {row.actual.toFixed(1)} · expected {row.expected.toFixed(1)}
                        {row.signal ? ` · ${row.signal}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-6 text-sm text-muted">Not enough games yet to compare.</p>
            )}
          </>
        )}
      </main>
    </>
  );
}
