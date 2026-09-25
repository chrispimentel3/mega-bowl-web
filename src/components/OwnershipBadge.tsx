import type { PlayerOwnership } from "@/lib/players";

export function OwnershipBadge({ ownership }: { ownership: PlayerOwnership }) {
  switch (ownership.kind) {
    case "mine":
      return (
        <span>
          <b className="text-navy">Yours</b> · {ownership.slot === "BN" ? "bench" : ownership.slot}
        </span>
      );
    case "other_team":
      return (
        <span>
          <b>{ownership.team}</b> · {ownership.slot === "BN" ? "bench" : ownership.slot}
        </span>
      );
    case "waivers":
      return (
        <span>
          <b>On waivers</b> until {ownership.waiver_until}
        </span>
      );
    case "no_team":
      return <b>No NFL team</b>;
    case "free_agent":
      return <b>Free agent</b>;
    default:
      return <span className="text-muted">—</span>;
  }
}
