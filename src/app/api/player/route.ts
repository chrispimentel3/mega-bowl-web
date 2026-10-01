import type { NextRequest } from "next/server";
import { getPlayer, getPlayerIndex, type PlayerIndexRow } from "@/lib/players";

/** One player's card for the pop-up (src/components/PlayerCardProvider.tsx), by gsis id or
 *  by name — most pages only know a name. Only the two seasons the card shows are sent. */

// Names as pages print them vs the index: "Deebo Samuel Sr." / "Deebo Samuel", curly quotes
const norm = (s: string) =>
  s.toLowerCase().replace(/[.'’]/g, "").replace(/-/g, " ").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, " ")
    .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

function resolve(index: PlayerIndexRow[], name: string, pos?: string | null, team?: string | null) {
  const n = norm(name);
  let hits = index.filter((r) => norm(r.name) === n);
  for (const [key, want] of [["pos", pos], ["team", team]] as const) {
    const narrowed = want ? hits.filter((r) => r[key] === want) : [];
    if (hits.length > 1 && narrowed.length) hits = narrowed;
  }
  return hits[0] ?? null;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  let gsis = q.get("gsis");
  if (!gsis) {
    const name = q.get("name");
    if (!name) return Response.json({ error: "Pass gsis or name." }, { status: 400 });
    const idx = await getPlayerIndex();
    const hit = resolve(idx.index, name, q.get("pos"), q.get("team"));
    if (!hit) return Response.json({ error: `No card for ${name}.` }, { status: 404 });
    gsis = hit.gsis_id;
  }
  const p = await getPlayer(gsis);
  if (!p) return Response.json({ error: "No card for this player." }, { status: 404 });
  const keep = Object.keys(p.seasons).sort().reverse().slice(0, 2);
  return Response.json(
    { ...p, seasons: Object.fromEntries(keep.map((s) => [s, p.seasons[s]])) },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
