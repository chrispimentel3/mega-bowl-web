import { readCsvExport } from "@/lib/downloads";

export async function GET() {
  const csv = await readCsvExport(process.env.PLAYER_STATS_CSV_URL, "player_stats.csv");
  if (csv == null) return new Response("Not available.", { status: 404 });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="player_stats.csv"',
    },
  });
}
