import Link from "next/link";
import { getDigest, type DigestSlateGame } from "@/lib/digest";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SimpleTable } from "@/components/SimpleTable";

export const revalidate = 3600;

const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);
const pts = (v: number) => v.toFixed(2);

function Side({ name, record, ppg, power, odds, mine }: {
  name: string; record: string; ppg: number; power: number | null; odds: number | null; mine: boolean;
}) {
  return (
    <div className={mine ? "text-navy" : "text-ink"}>
      <p className="text-sm font-semibold">{name}</p>
      <p className="text-xs text-muted">
        {record || "—"} · {ppg.toFixed(1)} pts/wk
        {power != null ? ` · power #${power}` : ""} · playoffs {pct(odds)}
      </p>
    </div>
  );
}

function GameCard({ g, myTeam, label }: { g: DigestSlateGame; myTeam: string; label?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      {label ? <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">{label}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Side name={g.a} record={g.a_record} ppg={g.a_ppg} power={g.a_power} odds={g.a_playoffs} mine={g.a === myTeam} />
        <span className="text-xs font-semibold text-muted">vs</span>
        <div className="sm:text-right">
          <Side name={g.b} record={g.b_record} ppg={g.b_ppg} power={g.b_power} odds={g.b_playoffs} mine={g.b === myTeam} />
        </div>
      </div>
    </div>
  );
}

export default async function DigestPage() {
  const [d, ab] = await Promise.all([getDigest(), getActionBoard()]);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!d.available ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            {d.reason ?? "No digest this week yet."}
          </div>
        ) : (
          <>
            {d.my_result ? (
              <div className={`rounded-2xl border p-5 shadow-sm ${d.my_result.won ? "border-pos-rb/30 bg-pos-rb/5" : "border-crimson/30 bg-crimson/5"}`}>
                <p className="text-xs uppercase tracking-wide text-muted">Week {d.week}</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {d.my_result.won ? "W" : "L"} {pts(d.my_result.points)}–{pts(d.my_result.opp_points)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  vs {d.my_result.opponent} · now {d.my_result.record} · {d.my_result.rank}
                  {d.my_result.rank === 1 ? "st" : d.my_result.rank === 2 ? "nd" : d.my_result.rank === 3 ? "rd" : "th"}
                  -best score · all-play {d.my_result.allplay}
                </p>
              </div>
            ) : null}

            <SectionHeading title={`Week ${d.week} in review`} />
            <ul className="space-y-2">
              {d.headlines.map((l) => (
                <li key={l.kind} className="flex gap-2 text-sm text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                  <span>{l.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              All-play is a score against every other team&apos;s that week — 6-5 means it would
              have beaten six of the eleven. It&apos;s the week-by-week version of the expected
              wins on <Link href="/league" className="text-navy hover:underline">The league</Link>.
            </p>

            <SectionHeading title="Scoreboard" />
            <div className="grid gap-2 sm:grid-cols-2">
              {d.games.map((g) => (
                <div key={g.winner} className="rounded-xl border border-line bg-card px-4 py-3 text-sm shadow-sm">
                  <div className="flex justify-between gap-2">
                    <span className={`font-semibold ${g.winner === d.my_team ? "text-navy" : "text-ink"}`}>{g.winner}</span>
                    <span className="font-semibold tabular-nums text-ink">{pts(g.w_pts)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-muted">
                    <span className={g.loser === d.my_team ? "text-navy" : ""}>{g.loser}</span>
                    <span className="tabular-nums">{pts(g.l_pts)}</span>
                  </div>
                </div>
              ))}
            </div>

            <SectionHeading title={`Every score, week ${d.week}`} />
            <SimpleTable
              rowKey={(r) => r.team}
              rows={d.table}
              myTeam={d.my_team}
              columns={[
                { key: "rank", label: "#", align: "right" },
                { key: "team", label: "Team" },
                { key: "points", label: "Points", align: "right", format: (v) => pts(v as number) },
                { key: "won", label: "Result", format: (v) => (v ? "W" : "L") },
                { key: "allplay", label: "All-play", align: "right" },
                { key: "record", label: "Record", align: "right" },
              ]}
            />

            {d.odds_movers.available ? (
              <>
                <SectionHeading title="Playoff odds, before and after" />
                <SimpleTable
                  rowKey={(r) => r.team}
                  rows={d.odds_movers.rows}
                  myTeam={d.my_team}
                  columns={[
                    { key: "team", label: "Team" },
                    { key: "p_before", label: `After wk ${d.odds_movers.from_week}`, align: "right", format: (v) => pct(v as number) },
                    { key: "p_after", label: `After wk ${d.week}`, align: "right", format: (v) => pct(v as number) },
                    {
                      key: "delta", label: "Change", align: "right",
                      format: (v) => `${(v as number) >= 0 ? "+" : "−"}${Math.abs((v as number) * 100).toFixed(0)}`,
                    },
                  ]}
                />
                <p className="mt-2 text-xs text-muted">
                  The same simulated seasons as{" "}
                  <Link href="/league" className="text-navy hover:underline">The league</Link>, kept
                  from the first run after each week ends.
                </p>
              </>
            ) : null}

            <SectionHeading title={`Week ${d.next_week} look-ahead`} />
            <div className="space-y-3">
              {d.my_game ? <GameCard g={d.my_game} myTeam={d.my_team} label="Your game" /> : null}
              {d.game_of_week ? (
                <GameCard g={d.game_of_week} myTeam={d.my_team} label="Game of the week — the most playoff odds riding on it" />
              ) : null}
            </div>
            {d.slate.length > 0 ? (
              <div className="mt-3 rounded-xl border border-line bg-card px-4 py-3 text-sm shadow-sm">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">The full slate</p>
                {d.slate.map((g) => (
                  <p key={g.a} className={g.mine ? "font-semibold text-navy" : "text-ink"}>
                    {g.a} <span className="text-muted">({g.a_record})</span> vs {g.b}{" "}
                    <span className="text-muted">({g.b_record})</span>
                  </p>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Your lineup for the week, with projections, is on{" "}
              <Link href="/start-sit" className="text-navy hover:underline">Lineup &amp; Matchups</Link>.
            </p>

            {d.todo.headline ? (
              <>
                <SectionHeading title="What to do about it" />
                <div className="rounded-xl border border-line bg-card p-4 text-sm shadow-sm">
                  <p className="font-semibold text-ink">{d.todo.headline}</p>
                  {d.todo.waiver ? (
                    <p className="mt-2 text-muted">
                      Top claim: <span className="font-medium text-ink">{d.todo.waiver.player}</span> ({d.todo.waiver.pos}),
                      bid ${d.todo.waiver.bid}{d.todo.waiver.drop ? `, drop ${d.todo.waiver.drop}` : ""} —{" "}
                      {d.todo.waiver.why}.{" "}
                      <Link href="/waivers" className="text-navy hover:underline">All waivers</Link>
                    </p>
                  ) : null}
                  {d.todo.trade ? (
                    <p className="mt-1 text-muted">
                      Top trade: give <span className="font-medium text-ink">{d.todo.trade.give}</span> to{" "}
                      {d.todo.trade.partner} for <span className="font-medium text-ink">{d.todo.trade.get}</span>.{" "}
                      <Link href="/trades" className="text-navy hover:underline">All trades</Link>
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
