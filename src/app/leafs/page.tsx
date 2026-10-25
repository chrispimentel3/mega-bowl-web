import { getLeafs, ROLL } from "@/lib/leafs";
import { getActionBoard } from "@/lib/action-board";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { SimpleTable } from "@/components/SimpleTable";
import { KpiRow } from "@/components/KpiRow";
import { MultiLineChart } from "@/components/MultiLineChart";

export const revalidate = 3600;

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));

export default async function LeafsPage() {
  const [d, ab] = await Promise.all([getLeafs().catch(() => null), getActionBoard()]);
  if (!d) {
    return (
      <>
        <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 text-sm text-muted sm:max-w-3xl">
          Couldn&apos;t reach the NHL API. Try again in a bit.
        </main>
      </>
    );
  }
  const { record: r } = d;
  const last10 = d.games.slice(-ROLL);
  const l10 = `${last10.filter((g) => g.result === "W").length}-${last10.filter((g) => g.result === "L").length}-${last10.filter((g) => g.result === "OTL").length}`;
  const series = ["Goals %", ...(d.hasMoneyPuck ? ["xGoals % (5v5)", "Corsi % (5v5)"] : [])];

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <h1 className="font-display text-xl font-bold text-ink">Maple Leafs {d.season.label}</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Regular season. Refreshes hourly from the NHL API{d.hasMoneyPuck ? " and MoneyPuck" : ""}.
        </p>

        {d.games.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            No regular-season games played yet.
          </div>
        ) : (
          <>
            <KpiRow
              items={[
                { label: "Record", value: `${r.w}-${r.l}-${r.otl}`, sub: `${r.pts} pts · ${pct(r.ptsPct)}` },
                { label: "Goal diff", value: signed(r.gf - r.ga), sub: `${r.gf} GF · ${r.ga} GA` },
                { label: `Last ${last10.length}`, value: l10, sub: `${last10.reduce((t, g) => t + g.gf - g.ga, 0)} GD` },
              ]}
            />

            <SectionHeading title={`Rolling ${ROLL}-game share`} />
            <p className="mb-2 text-xs text-muted">
              Leafs&apos; share of goals{d.hasMoneyPuck ? ", expected goals and shot attempts (5-on-5)" : ""}. Above 50% = outplaying opponents.
            </p>
            <div className="rounded-xl border border-line bg-card p-2 shadow-sm">
              <MultiLineChart data={d.trend} xKey="game" series={series} highlighted={series} percent />
            </div>

            <SectionHeading title="Recent results" />
            <SimpleTable
              rowKey={(g) => String(g.id)}
              rows={[...last10].reverse()}
              columns={[
                { key: "date", label: "Date" },
                { key: "opp", label: "Opp", format: (v, g) => `${g.home ? "vs" : "@"} ${v}` },
                { key: "result", label: "", format: (v, g) => `${v} ${g.gf}-${g.ga}${g.ot ? ` ${g.ot}` : ""}` },
                ...(d.hasMoneyPuck
                  ? [{ key: "xgPct" as const, label: "xG% 5v5", align: "right" as const, format: (v: unknown) => (v == null ? "—" : pct(v as number)) }]
                  : []),
              ]}
            />
          </>
        )}

        {d.upcoming.length ? (
          <>
            <SectionHeading title="Up next" />
            <ul className="grid gap-1 text-sm text-ink">
              {d.upcoming.map((g) => (
                <li key={g.id}>{g.date} · {g.home ? "vs" : "@"} {g.opp}</li>
              ))}
            </ul>
          </>
        ) : null}

        {d.form.length ? (
          <>
            <SectionHeading title={`Who's hot: last ${ROLL} games`} />
            <SimpleTable
              rowKey={(f) => String(f.id)}
              rows={d.form}
              columns={[
                { key: "name", label: "Player" },
                { key: "lastGp", label: "GP", align: "right" },
                { key: "lastG", label: "G", align: "right" },
                { key: "lastP", label: "P", align: "right" },
                { key: "lastPpg", label: "P/GP", align: "right", format: (v) => (v as number).toFixed(2) },
                { key: "seasonPpg", label: "Season P/GP", align: "right", format: (v) => (v as number).toFixed(2) },
                {
                  key: "id", label: "Trend", align: "right",
                  format: (_, f) => (!f.lastGp ? "—" : f.lastPpg > f.seasonPpg * 1.2 ? "🔥 hot" : f.lastPpg < f.seasonPpg * 0.8 ? "🧊 cold" : "steady"),
                },
              ]}
            />
          </>
        ) : null}

        <SectionHeading title="Skaters" />
        <SimpleTable
          rowKey={(s) => String(s.id)}
          rows={d.skaters}
          columns={[
            { key: "name", label: "Player" },
            { key: "pos", label: "Pos" },
            { key: "gp", label: "GP", align: "right" },
            { key: "g", label: "G", align: "right" },
            { key: "a", label: "A", align: "right" },
            { key: "p", label: "P", align: "right" },
            { key: "pm", label: "+/-", align: "right", format: (v) => signed(v as number) },
            { key: "ppg", label: "PPG", align: "right" },
            { key: "shots", label: "SOG", align: "right" },
            { key: "toi", label: "TOI", align: "right", format: (v) => mmss(v as number) },
          ]}
        />

        <SectionHeading title="Goalies" />
        <SimpleTable
          rowKey={(g) => String(g.id)}
          rows={d.goalies}
          columns={[
            { key: "name", label: "Goalie" },
            { key: "gp", label: "GP", align: "right" },
            { key: "w", label: "Record", align: "right", format: (v, g) => `${v}-${g.l}-${g.otl}` },
            { key: "svPct", label: "SV%", align: "right", format: (v) => (v as number).toFixed(3).replace(/^0/, "") },
            { key: "gaa", label: "GAA", align: "right", format: (v) => (v as number).toFixed(2) },
            { key: "so", label: "SO", align: "right" },
          ]}
        />

        <p className="mt-8 text-xs text-muted">Data: NHL.com · MoneyPuck.com</p>
      </main>
    </>
  );
}
