import type { RoleSection } from "@/lib/players";

function fmt(v: number | null, spec: string): string {
  if (v == null) return "—";
  if (spec.includes("%")) return `${(v * 100).toFixed(spec.includes(".1") ? 1 : 0)}%`;
  if (spec.includes("f")) return v.toFixed(2);
  return String(Math.round(v));
}

export function RoleCard({ role }: { role: RoleSection }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <p className="font-display text-lg font-bold text-ink">{role.headline}</p>
      <p className="mt-1 text-xs text-muted">
        {role.from_usage ? `From his last ${role.games} games.` : "Too few games to read his usage, so this is his depth-chart spot."}
      </p>
      <div className="mt-3 space-y-2">
        {role.rows.map((r) => (
          <div key={r.metric} className="rounded-lg bg-ink/[0.03] p-2.5">
            <p className="text-xs font-medium capitalize text-ink">{r.metric}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>
                him <b className="text-ink">{fmt(r.him, r.fmt)}</b>
              </span>
              <span>
                vs role <b className={r.vs_role != null && r.vs_role >= 120 ? "text-crimson" : "text-ink"}>{r.vs_role != null ? Math.round(r.vs_role) : "—"}</b>
              </span>
              <span>
                vs NFL <b className="text-ink">{r.vs_nfl != null ? Math.round(r.vs_nfl) : "—"}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Shrunk toward his role&apos;s baseline. 100 = average; 120+ vs role is running above it.
      </p>
    </div>
  );
}
