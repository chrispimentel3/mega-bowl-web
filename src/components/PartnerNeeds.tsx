import type { TeamProfile } from "@/lib/tradeSearch";

/** One line under a trade card's partner: what the other manager is thin at, whether this
 *  offer sends him a player at that position, and bench players he could spare. */
export function PartnerNeeds({ profile, givePos = [] }: { profile?: TeamProfile | null; givePos?: string[] }) {
  if (!profile || (!profile.needs.length && !profile.spare.length)) return null;
  const fills = profile.needs.filter((n) => givePos.includes(n.pos)).map((n) => n.pos);
  return (
    <p className="mt-1 text-[11px] leading-snug text-muted">
      {profile.needs.length ? (
        <>
          <span className="font-semibold text-ink">Needs</span>{" "}
          <span title={profile.needs.map((n) => `${n.pos}: ${n.gap.toFixed(1)} pts/wk under the league average`).join("; ")}>
            {profile.needs.map((n) => n.pos).join(", ")}
          </span>
          {fills.length ? <span className="font-semibold text-pos-rb-text"> — this sends {fills.join(", ")}</span> : null}
        </>
      ) : null}
      {profile.needs.length && profile.spare.length ? " · " : null}
      {profile.spare.length ? (
        <>
          <span className="font-semibold text-ink">Spare</span> {profile.spare.map((p) => `${p.name} (${p.pos})`).join(", ")}
        </>
      ) : null}
    </p>
  );
}
