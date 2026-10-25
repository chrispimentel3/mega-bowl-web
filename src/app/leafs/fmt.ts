export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;
export const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? "th"}`;
export const signed = (v: number, d = 0) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** top 8 of 32 = good, bottom 8 = bad (scales to any field size) */
export const tier = (rank: number, of = 32) => (rank <= of / 4 ? "good" : rank > (of * 3) / 4 ? "bad" : "mid");
/** "2026-10-25" -> "Sun Oct 25", read as a calendar date (no timezone shift) */
export const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
export const resultTone = (r: string) => (r === "W" ? "good" : r === "L" ? "bad" : "warn");
export const resultText = (r: string, ot: string) => (r === "OTL" ? `${ot} L` : r === "W" && ot ? `W ${ot}` : r);
