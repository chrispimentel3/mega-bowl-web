import { PosBadge } from "./PosBadge";
import { OwnershipBadge } from "./OwnershipBadge";
import { TeamLogo } from "./TeamLogo";
import type { PlayerDetail } from "@/lib/players";

export function PlayerHeader({ player }: { player: PlayerDetail }) {
  const b = player.bio;
  const facts = [player.pos];
  if (b.jersey_number != null) facts.push(`#${b.jersey_number}`);
  if (b.age != null) facts.push(`age ${b.age}`);
  const hw = [b.height, b.weight != null ? `${b.weight} lb` : null].filter(Boolean).join(" ");
  if (hw) facts.push(hw);
  if (b.college) facts.push(b.college);
  if (b.draft_number != null) {
    facts.push(b.entry_year != null ? `pick ${b.draft_number} (${b.entry_year})` : `pick ${b.draft_number}`);
  } else if (b.entry_year != null) {
    facts.push(`undrafted (${b.entry_year})`);
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {b.headshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.headshot_url} alt={player.name} width={80} height={80} className="rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PosBadge pos={player.pos} />
            <h1 className="truncate font-display text-xl font-bold text-ink">{player.name}</h1>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
            <TeamLogo team={player.team || player.last_team} size={18} />
            {player.team || `no team (last: ${player.last_team || "—"})`}
          </p>
          <p className="mt-0.5 text-xs text-muted">{facts.join(" · ")}</p>
          <div className="mt-3 space-y-1 text-sm">
            <p>
              <span className="text-xs uppercase tracking-wide text-muted">Mega Bowl </span>
              <OwnershipBadge ownership={player.ownership} />
            </p>
            {player.nfl_status ? (
              <p>
                <span className="text-xs uppercase tracking-wide text-muted">NFL status </span>
                {player.out_reason ? (
                  <span className="mr-1.5 rounded-md bg-crimson/10 px-1.5 py-0.5 text-xs font-bold text-crimson">
                    {player.out_reason}
                  </span>
                ) : null}
                {player.nfl_status}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
