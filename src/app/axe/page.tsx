import { getAxe } from "@/lib/axe";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { BarCompareChart } from "@/components/BarCompareChart";

export const revalidate = 3600;

export default async function AxePage() {
  const [axe, ab] = await Promise.all([getAxe(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!axe.available ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            ff_opportunity data unavailable for this season.
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">
              Grey is what his usage should have produced; navy is what he scored. A navy bar well
              short of grey is a hold, not a cut — the work is there and the points normally
              follow.
            </p>
            <div className="mt-4 rounded-xl border border-line bg-card p-3 shadow-sm">
              <BarCompareChart rows={axe.rows} />
            </div>
            <p className="mt-2 text-center text-xs text-muted">
              Actual vs expected, through week {axe.week}
            </p>

            <div className="mt-6 space-y-2">
              {axe.rows.map((row) => (
                <div key={row.player} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{row.player}</p>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                        row.diff >= 0 ? "bg-crimson/10 text-crimson" : "bg-pos-rb/10 text-pos-rb"
                      }`}
                    >
                      {row.diff >= 0 ? "+" : ""}
                      {row.diff.toFixed(1)} xFP±
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    expected {row.expected.toFixed(1)} · actual {row.actual.toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
