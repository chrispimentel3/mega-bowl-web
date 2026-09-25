export type Column<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  format?: (value: T[keyof T], row: T) => string;
};

export function SimpleTable<T extends Record<string, unknown>>({
  columns,
  rows,
  myTeam,
  teamKey = "team" as keyof T,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  myTeam?: string;
  teamKey?: keyof T;
  rowKey: (row: T, i: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        Nothing to show.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`px-3 py-2 font-medium ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isMine = myTeam != null && row[teamKey] === myTeam;
            return (
              <tr
                key={rowKey(row, i)}
                className={`border-b border-line last:border-0 ${isMine ? "bg-navy/5" : "even:bg-ink/[0.02]"}`}
              >
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className={`px-3 py-2 ${c.align === "right" ? "text-right font-medium text-ink" : "text-ink"} ${
                      isMine && c.key === teamKey ? "font-semibold text-navy" : ""
                    }`}
                  >
                    {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
