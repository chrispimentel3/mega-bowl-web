import { readCsvExport } from "@/lib/downloads";

export async function GET() {
  const csv = await readCsvExport(process.env.FF_OPPORTUNITY_CSV_URL, "ff_opportunity.csv");
  if (csv == null) return new Response("Not available.", { status: 404 });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="ff_opportunity.csv"',
    },
  });
}
