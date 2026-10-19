import { SimpleTable } from "./SimpleTable";
import type { WeeklyResultRow } from "@/lib/league";

type Row = { team: string; avg: number; spread: number; bad: number; booms: number; busts: number };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => (xs.length > 1 ? Math.sqrt(xs.reduce((a, x) => a + (x - mean(xs)) ** 2, 0) / (xs.length - 1)) : 0);
const f1 = (v: unknown) => (v as number).toFixed(1);

/** Boom = a top-quarter week league-wide, bust = a bottom-quarter one. Sorted by the "bad week"
 *  (average minus one spread): high and flat beats high and spiky. */
export function ConsistencyTable({ rows, myTeam }: { rows: WeeklyResultRow[]; myTeam: string }) {
  const all = rows.map((r) => r.points).sort((a, b) => a - b);
  const q = (p: number) => all[Math.min(all.length - 1, Math.floor(p * all.length))];
  const [low, high] = [q(0.25), q(0.75)];

  const teams = Array.from(new Set(rows.map((r) => r.team)));
  const table: Row[] = teams
    .map((team) => {
      const pts = rows.filter((r) => r.team === team).map((r) => r.points);
      const avg = mean(pts);
      const spread = sd(pts);
      return {
        team,
        avg,
        spread,
        bad: avg - spread,
        booms: pts.filter((p) => p >= high).length,
        busts: pts.filter((p) => p <= low).length,
      };
    })
    .sort((a, b) => b.bad - a.bad);
  const weeks = new Set(rows.map((r) => r.week)).size;

  return (
    <>
      <p className="mb-3 text-sm text-muted">
        <strong className="font-medium text-ink">Bad week</strong> is average minus one spread: about what a team
        scores on a rough Sunday. Boom is {high.toFixed(0)}+ (a top-quarter week league-wide), bust is{" "}
        {low.toFixed(0)} or less. {weeks} weeks in, so spreads still move a lot.
      </p>
      <SimpleTable<Row>
        rows={table}
        myTeam={myTeam}
        rowKey={(r) => r.team}
        columns={[
          { key: "team", label: "Team" },
          { key: "avg", label: "Avg", align: "right", format: f1 },
          { key: "spread", label: "±", align: "right", format: f1 },
          { key: "bad", label: "Bad week", align: "right", format: f1 },
          { key: "booms", label: "Boom / bust", align: "right", format: (_, r) => `${r.booms}/${r.busts}` },
        ]}
      />
    </>
  );
}
