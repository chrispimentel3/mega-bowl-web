import Link from "next/link";
import { getPlayer } from "@/lib/players";
import { getActionBoard } from "@/lib/action-board";
import { getArchetypes } from "@/lib/archetypes";
import { Masthead } from "@/components/Masthead";
import { PlayerHeader } from "@/components/PlayerHeader";
import { PlayerSeasonView } from "@/components/PlayerSeasonView";

export const revalidate = 3600;

export default async function PlayerDetailPage({ params }: { params: Promise<{ gsisId: string }> }) {
  const { gsisId } = await params;
  const [player, ab, arch] = await Promise.all([getPlayer(gsisId), getActionBoard(), getArchetypes()]);
  // the league-winner blueprint score, keyed by name and position like the board it comes from
  const fit = player && arch.available ? arch.board.find((r) => r.player === player.name && r.pos === player.pos) : undefined;

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        <Link href="/players" className="mb-4 inline-block text-sm text-navy hover:underline">
          ← Back to search
        </Link>

        {!player ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Player not found.
          </div>
        ) : player.error ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            Couldn&apos;t build this card: {player.error}
          </div>
        ) : (
          <>
            <PlayerHeader player={player} />
            {fit ? (
              <p className="mt-3 rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink shadow-sm">
                Blueprint fit <b>{Math.round(fit.arch_fit)}</b>
                <span className="text-muted">/100</span>
                {fit.why ? <span className="text-muted"> · {fit.why}</span> : null}
                <span className="block text-xs text-muted">
                  How closely he matches what this league&apos;s winning rosters were built on.
                </span>
              </p>
            ) : null}
            <PlayerSeasonView player={player} nextWeek={ab.next_week} />
          </>
        )}
      </main>
    </>
  );
}
