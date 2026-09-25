import { getDownloads, type RosterRow } from "@/lib/downloads";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SimpleTable, type Column } from "@/components/SimpleTable";

const COLUMNS: Column<RosterRow>[] = [
  { key: "name", label: "PLAYER" },
  { key: "slot", label: "SLOT" },
  { key: "pos", label: "POS" },
  { key: "nfl_team", label: "TM" },
  { key: "match_method", label: "MATCHED BY", format: (v, row) => (row.unmapped ? "unmapped" : String(v ?? "—")) },
];

export default async function DownloadsPage() {
  const [d, ab] = await Promise.all([getDownloads(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!d.available ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Downloads aren&apos;t available right now.
          </div>
        ) : (
          <>
            <SectionHeading title="Mapped roster" />
            <p className="mb-3 text-sm text-muted">Yahoo → nflverse id match: {d.match_line}</p>
            <SimpleTable columns={COLUMNS} rows={d.roster} rowKey={(r) => r.yahoo_id ?? r.name} />

            <SectionHeading title="Weekly data (your roster)" />
            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href="/downloads/player_stats.csv"
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-navy/40 hover:text-navy"
              >
                weekly player_stats (.csv)
              </a>
              <a
                href="/downloads/ff_opportunity.csv"
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-navy/40 hover:text-navy"
              >
                ff_opportunity (.csv)
              </a>
            </div>

            <details className="rounded-xl border border-line bg-card p-3 text-sm">
              <summary className="cursor-pointer font-medium text-ink">Coverage notes</summary>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted">
                <li>
                  Kicker (Tyler Loop) and DST (Ravens) are <b>not</b> in the offensive datasets — track
                  those manually.
                </li>
                <li>Snap share joins via `pfr_id` from `ff_playerids`; rookies can lag a week.</li>
                <li>xFP uses the nflverse ff_opportunity model scored with half-PPR weights.</li>
              </ul>
            </details>
          </>
        )}
      </main>
    </>
  );
}
