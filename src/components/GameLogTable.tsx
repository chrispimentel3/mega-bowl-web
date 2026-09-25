import type { GameLogRow } from "@/lib/players";

const LABELS: Record<string, string> = {
  week: "Wk",
  game: "Opp",
  snap_pct: "Snap%",
  completions: "Cmp",
  attempts: "Att",
  passing_yards: "Pass Yd",
  passing_tds: "Pass TD",
  passing_interceptions: "INT",
  sacks_suffered: "Sacks",
  carries: "Car",
  rushing_yards: "Rush Yd",
  rushing_tds: "Rush TD",
  targets: "Tgt",
  tgt_pct: "Tgt%",
  receptions: "Rec",
  receiving_yards: "Rec Yd",
  receiving_tds: "Rec TD",
  receiving_first_downs: "1D",
  receiving_air_yards: "Air Yd",
  receiving_yards_after_catch: "YAC",
  routes: "Routes",
  half_ppr: "Pts",
  xfp: "xFP",
  vs_exp: "xFP±",
};

const PERCENT_COLS = new Set(["snap_pct", "tgt_pct"]);
const ONE_DECIMAL_COLS = new Set(["half_ppr", "xfp"]);
const SIGNED_COLS = new Set(["vs_exp"]);

function formatCell(col: string, value: number | string | null): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (PERCENT_COLS.has(col)) return `${Math.round(value * 100)}%`;
  if (SIGNED_COLS.has(col)) return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
  if (ONE_DECIMAL_COLS.has(col)) return value.toFixed(1);
  return String(Math.round(value));
}

export function GameLogTable({ rows }: { rows: GameLogRow[] }) {
  if (rows.length === 0) return null;
  const cols = Object.keys(LABELS).filter((c) => c in rows[0]);

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
            {cols.map((c) => (
              <th key={c} className={`px-2.5 py-2 font-medium ${c === "week" || c === "game" ? "" : "text-right"}`}>
                {LABELS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.week)} className="border-b border-line last:border-0 even:bg-ink/[0.02]">
              {cols.map((c) => (
                <td
                  key={c}
                  className={`px-2.5 py-2 ${c === "week" || c === "game" ? "text-ink" : "text-right text-ink"} ${
                    c === "vs_exp" && typeof row[c] === "number"
                      ? (row[c] as number) >= 0
                        ? "font-semibold text-pos-rb"
                        : "font-semibold text-crimson"
                      : ""
                  }`}
                >
                  {formatCell(c, row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
