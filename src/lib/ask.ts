/** Client for the live Ask API (service/main.py in ff-dashboard, deployed to Render).
 *
 * Every other page in this app reads precomputed JSON — see src/lib/action-board.ts for
 * why. This one can't: the question space is open-ended, so it's the one page that talks
 * to a small live backend instead of a static export. See the "Ask anything" page for the
 * user-facing explanation of that tradeoff.
 */
const API_URL = process.env.NEXT_PUBLIC_ASK_API_URL || "http://localhost:8008";

export type AskColumn = { key: string; label: string };

export type AskRow = Record<string, string | number | null>;

export type AskResult = {
  restated: string;
  columns: AskColumn[];
  rows: AskRow[];
  warnings: string[];
  note: string;
  empty: boolean;
};

export type AskMeta = {
  season: number;
  weeks_available: number[];
  seasons_selectable: number[];
  examples: string[];
};

export async function getAskMeta(): Promise<AskMeta> {
  const res = await fetch(`${API_URL}/meta`);
  if (!res.ok) throw new Error(`Ask API /meta failed: ${res.status}`);
  return res.json();
}

export async function askQuestion(text: string, seasons: number[]): Promise<AskResult> {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, seasons }),
  });
  if (res.status === 400) {
    const body = await res.json().catch(() => ({ detail: "Could not read that question." }));
    throw new Error(body.detail || "Could not read that question.");
  }
  if (!res.ok) throw new Error(`Ask API /ask failed: ${res.status}`);
  return res.json();
}

export function rowsToCsv(columns: AskColumn[], rows: AskRow[]): string {
  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const display = r[`${c.key}_display`];
        const v = display ?? r[c.key] ?? "";
        const s = String(v);
        return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  return [header, ...lines].join("\n");
}
