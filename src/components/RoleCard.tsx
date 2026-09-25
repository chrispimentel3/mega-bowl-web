import type { RoleSection } from "@/lib/players";

function fmt(v: number | null, spec: string): string {
  if (v == null) return "—";
  if (spec.includes("%")) return `${(v * 100).toFixed(spec.includes(".1") ? 1 : 0)}%`;
  if (spec.includes("f")) return v.toFixed(2);
  return String(Math.round(v));
}

function delta(idx: number | null): string {
  if (idx == null) return "";
  const pct = Math.round(idx - 100);
  return ` (${pct >= 0 ? "+" : ""}${pct}%)`;
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
            <div className="mt-1 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Him</p>
                <p className="text-sm font-bold text-ink">{fmt(r.him, r.fmt)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Role avg</p>
                <p className="text-sm font-bold text-ink">
                  {fmt(r.role_avg, r.fmt)}
                  <span
                    className={`ml-1 text-[10px] font-normal ${
                      r.vs_role != null && r.vs_role >= 120
                        ? "text-crimson"
                        : r.vs_role != null && r.vs_role <= 80
                          ? "text-pos-rb"
                          : "text-muted"
                    }`}
                  >
                    {delta(r.vs_role)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">NFL avg</p>
                <p className="text-sm font-bold text-ink">
                  {fmt(r.nfl_avg, r.fmt)}
                  <span className="ml-1 text-[10px] font-normal text-muted">{delta(r.vs_nfl)}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        &quot;Role avg&quot; and &quot;NFL avg&quot; are the actual average for his role (e.g. every
        current WR2) and for the position league-wide — his own number is shrunk toward the role
        average first, so two good games don&apos;t overstate a small sample. The percentage is how
        far above or below that average he sits.
      </p>
    </div>
  );
}
