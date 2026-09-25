import type { AskColumn, AskRow } from "@/lib/ask";

export function AskResultTable({ columns, rows }: { columns: AskColumn[]; rows: AskRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        No rows.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ink/5 text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0 even:bg-ink/[0.02]">
              {columns.map((c) => {
                const display = row[`${c.key}_display`];
                const value = display ?? row[c.key];
                return (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2 text-ink">
                    {value == null || value === "" ? "—" : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
