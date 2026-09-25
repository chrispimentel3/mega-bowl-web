export type RouteTableRow = {
  slot: string;
  player: string;
  pos: string;
  team: string;
  fd_rr: number | null;
  tprr: number | null;
  tgt_pct: number | null;
  targets: number | null;
  routes: number | null;
  routes_pg: number | null;
  route_flag: string;
};

export type RouteScatterPoint = {
  player: string;
  pos: string;
  team: string;
  tprr: number;
  fd_rr: number;
  routes: number;
  qualified: boolean;
  mine: boolean;
};

export type Routes = {
  available: boolean;
  table: RouteTableRow[];
  scatter: RouteScatterPoint[];
  threshold: number;
  min_routes: number;
};

const REMOTE_URL = process.env.ROUTES_URL;

/** Same pattern as `getActionBoard` — see src/lib/action-board.ts for why. */
export async function getRoutes(): Promise<Routes> {
  if (REMOTE_URL) {
    const res = await fetch(REMOTE_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`ROUTES_URL fetch failed: ${res.status} ${res.statusText}`);
    return res.json();
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const siblingPath = path.join(process.cwd(), "..", "ff-dashboard", "data", "web", "routes.json");
  const samplePath = path.join(process.cwd(), "src", "data", "routes.sample.json");

  try {
    return JSON.parse(await readFile(siblingPath, "utf-8"));
  } catch {
    return JSON.parse(await readFile(samplePath, "utf-8"));
  }
}
