/** Vendored from ff-dashboard's static/logos/ (see mega/logos.py there for why — Wikimedia,
 * the original source, rejects hotlinking at the request pattern a browser makes). Same
 * alias table as mega/ids.py's canon_team, so a raw code from any export still resolves. */
const TEAM_ALIAS: Record<string, string> = {
  LAR: "LA", RAM: "LA", STL: "LA", WSH: "WAS", JAC: "JAX", ARZ: "ARI",
  GBP: "GB", KCC: "KC", LVR: "LV", OAK: "LV", NEP: "NE", NOS: "NO",
  SFO: "SF", TBB: "TB", SDC: "LAC", SD: "LAC", BLT: "BAL", CLV: "CLE", HST: "HOU",
};

const KNOWN = new Set([
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU",
  "IND", "JAX", "KC", "LA", "LAC", "LV", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT",
  "SEA", "SF", "TB", "TEN", "WAS",
]);

function canonTeam(team: string | null | undefined): string | null {
  if (!team) return null;
  const code = TEAM_ALIAS[team.toUpperCase()] ?? team.toUpperCase();
  return KNOWN.has(code) ? code : null;
}

export function TeamLogo({
  team,
  size = 20,
  className = "",
}: {
  team: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const code = canonTeam(team);
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${code}.png`}
      alt={code}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
