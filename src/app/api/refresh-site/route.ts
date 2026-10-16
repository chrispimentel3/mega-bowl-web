import { revalidatePath, revalidateTag } from "next/cache";
import { DATA_TAG } from "@/lib/fetchRemoteJson";

const API_URL = process.env.NEXT_PUBLIC_ASK_API_URL || "http://localhost:8008";

/** After the Mac's refresh lands: expire every cached export so the next visit to any page
 *  reads the new data, instead of within the hour. Same passcode as the button, checked by
 *  the API, so a stranger can't keep the cache cold. */
export async function POST(req: Request) {
  const passcode = req.headers.get("x-offer-passcode") ?? "";
  const ok = await fetch(`${API_URL}/refresh`, { headers: { "X-Offer-Passcode": passcode }, cache: "no-store" })
    .then((r) => r.ok)
    .catch(() => false);
  if (!ok) return Response.json({ detail: "Wrong passcode, or the server is asleep." }, { status: 401 });
  revalidateTag(DATA_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
