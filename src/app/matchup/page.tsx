import Link from "next/link";
import { getActionBoard } from "@/lib/action-board";
import { getStartSit, type LineupRow } from "@/lib/start-sit";
import { getMatchup } from "@/lib/matchup";
import { getPlayoffs } from "@/lib/playoffs";
import { getLogic } from "@/lib/logic";
import { STEPS, step } from "@/lib/matchupVerdict";
import { Masthead } from "@/components/Masthead";
import { SectionHeading } from "@/components/SectionHeading";
import { PosBadge } from "@/components/PosBadge";
import { MatchupTags } from "@/components/MatchupTags";
import { LogicTopicCard } from "@/components/LogicDetail";
import { PlayerName } from "@/components/PlayerCardProvider";

export const revalidate = 3600;

const pct = (x: number) => `${Math.round(x * 100)}%`;
const pts = (r: LineupRow | null) => r?.proj_adj ?? 0;
/** the How-it-works topics this page leans on, in reading order */
const LOGIC = ["playoff_odds", "matchup_model", "live_calib"];

type Pair = { slot: string; me: LineupRow | null; them: LineupRow | null };

/** The two lineups slot by slot: QB with QB, first RB with first RB, and so on. */
function pair(a: LineupRow[], b: LineupRow[]): Pair[] {
  const keyed = (rows: LineupRow[]) => {
    const seen: Record<string, number> = {};
    return rows.map((r) => [`${r.lineup}${(seen[r.lineup] = (seen[r.lineup] ?? -1) + 1)}`, r] as const);
  };
  const mine = new Map(keyed(a));
  const theirs = new Map(keyed(b));
  const keys = [...mine.keys(), ...[...theirs.keys()].filter((k) => !mine.has(k))];
  return keys.map((k) => ({ slot: k.replace(/\d+$/, ""), me: mine.get(k) ?? null, them: theirs.get(k) ?? null }));
}

export default async function MatchupPage() {
  const [ab, ss, mu, pp, logic] = await Promise.all([getActionBoard(), getStartSit(), getMatchup(), getPlayoffs(), getLogic()]);
  const week = ss.next_week;
  const ready = ss.available && mu.available && mu.next_week === week && !!mu.opp && !!ss.kpis && !!mu.kpis;
  // the win chance is the season sim's, for this exact game
  const odds = pp.rooting?.week === week && pp.rooting.mine?.opp === mu.opp ? pp.rooting.mine : null;
  const rows = ready ? pair(ss.starters, mu.starters) : [];
  const edges = rows.filter((r) => r.me && r.them).map((r) => ({ ...r, d: pts(r.me) - pts(r.them) }));
  const best = edges.reduce<(typeof edges)[number] | null>((x, r) => (!x || r.d > x.d ? r : x), null);
  const worst = edges.reduce<(typeof edges)[number] | null>((x, r) => (!x || r.d < x.d ? r : x), null);
  const players = [...ss.starters, ...ss.bench]
    .filter((r) => r.pos !== "K" && r.pos !== "DEF")
    .sort((x, y) => (y.matchup_pts ?? -99) - (x.matchup_pts ?? -99));
  const topics = LOGIC.flatMap((k) => logic.topics.filter((t) => t.key === k));
  // a starter who won't play: in practice a kicker or defense on bye, which Lineup can't swap
  // for someone you don't roster — the season sim streams one (title_odds.kdef_means)
  const dead = ss.starters.filter((r) => !r.proj_adj);

  return (
    <>
      <Masthead season={ab.season} week={ab.week} nextWeek={ab.next_week} rosterSrc={ab.roster_src} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:max-w-3xl">
        {!ready ? (
          <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
            {week > 14
              ? "No regular-season game this week — the playoff lineups are on Lineup → Playoffs."
              : "This week's matchup isn't built yet; it fills in on the next refresh."}
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Week {week}</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate font-display text-xl font-bold text-ink">You vs {mu.opp}</h1>
                  <p className="text-sm text-muted">
                    Projected <b className="text-ink">{ss.kpis!.proj_total.toFixed(1)}</b> –{" "}
                    <b className="text-ink">{mu.kpis!.proj_total.toFixed(1)}</b>
                  </p>
                </div>
                {odds ? (
                  <div className="shrink-0 text-right">
                    <p className="font-display text-3xl font-bold leading-none text-ink">{pct(odds.p_win)}</p>
                    <p className="text-xs text-muted">to win</p>
                  </div>
                ) : null}
              </div>
              {odds ? (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-crimson/25" role="img" aria-label={`${pct(odds.p_win)} to win`}>
                    <div className="h-full rounded-full bg-pos-rb" style={{ width: pct(odds.p_win) }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    A win puts your playoff odds at <b className="text-ink">{pct(odds.playoffs_if_win)}</b>; a loss,{" "}
                    <b className="text-ink">{pct(odds.playoffs_if_lose)}</b>.
                  </p>
                </>
              ) : null}
            </section>

            {dead.length ? (
              <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <b>{dead.map((r) => r.player).join(" and ")}</b> {dead.length > 1 ? "don't" : "doesn't"} play this week
                {dead.every((r) => !r.opp) ? " (bye)" : ""}. Pick up a replacement on{" "}
                <Link href="/waivers" className="font-semibold underline">Waivers</Link>. The win chance assumes you
                do; the projected totals don&apos;t.
              </p>
            ) : null}

            <SectionHeading title="Slot by slot" />
            <div className="overflow-hidden rounded-xl border border-line bg-card shadow-sm">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-line bg-ink/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">
                <span>You</span>
                <span className="w-12 text-center">Edge</span>
                <span className="truncate text-right">{mu.opp}</span>
              </div>
              {rows.map((r) => (
                <div key={`${r.slot}-${r.me?.player ?? r.them?.player}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-2 last:border-b-0">
                  <Side r={r.me} />
                  <Edge slot={r.slot} d={r.me && r.them ? pts(r.me) - pts(r.them) : null} />
                  <Side r={r.them} right />
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-ink/5 px-3 py-2">
                <span className="font-display text-base font-bold tabular-nums text-ink">{ss.kpis!.proj_total.toFixed(1)}</span>
                <Edge slot="Total" d={ss.kpis!.proj_total - mu.kpis!.proj_total} />
                <span className="text-right font-display text-base font-bold tabular-nums text-ink">{mu.kpis!.proj_total.toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-sm text-ink">
              {best && best.d >= 0.5 ? (
                <p>
                  Your biggest edge is at <b>{best.slot}</b>: {best.me!.player} projects {best.d.toFixed(1)} more than{" "}
                  {best.them!.player}.
                </p>
              ) : null}
              {worst && worst.d <= -0.5 ? (
                <p>
                  Theirs is at <b>{worst.slot}</b>: {worst.them!.player} projects {(-worst.d).toFixed(1)} more than{" "}
                  {worst.me!.player}.
                </p>
              ) : null}
              <p className="text-xs text-muted">
                Both lineups are set the way Lineup sets yours: our projection, this week&apos;s matchup, and anyone
                ruled out at zero. The win chance plays the week out 6,000 times with each player&apos;s full range of
                outcomes (and his backup if he sits), so it can lean a little differently from the two totals.
              </p>
            </div>

            <SectionHeading title="Your players' matchups" />
            <p className="mb-2 text-sm text-muted">
              Best to worst: how far the defense he faces and this week&apos;s Vegas line move each player from a normal
              week. Inside ±3% is noise. Whether a better matchup is worth starting someone is{" "}
              <Link href="/start-sit" className="text-navy hover:underline">Lineup</Link>&apos;s call.
            </p>
            <div className="grid gap-2">
              {players.map((r) => (
                <div key={r.player} className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <PosBadge pos={r.pos} />
                      <PlayerName name={r.player} pos={r.pos} className="truncate font-semibold text-ink" />
                    </div>
                    <span className="shrink-0 text-xs text-muted">{r.lineup === "BENCH" ? "bench" : "starting"}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.nfl_team}
                    {r.opp ? ` · ${r.opp}` : r.report_status ? "" : " · bye"}
                    {r.report_status ? <span className="font-bold text-crimson"> · {r.report_status}</span> : null}
                  </p>
                  {r.matchup_pct != null ? (
                    <MatchupTags
                      className="mt-2"
                      pct={r.matchup_pct} pts={r.matchup_pts} pos={r.pos} opp={r.opp} team={r.nfl_team}
                      defRank={r.matchup_def_rank} vegasPct={r.matchup_vegas_pct} basis={r.matchup_basis}
                    />
                  ) : (
                    <p className="mt-2 text-xs text-muted">No matchup read for this game.</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {topics.length ? (
          <>
            <SectionHeading title="How it works" />
            <div className="space-y-3">
              {topics.map((t) => (
                <LogicTopicCard key={t.key} topic={t} />
              ))}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}

/** One side of a slot: points, name, and his NFL game with the matchup word when it isn't neutral. */
function Side({ r, right = false }: { r: LineupRow | null; right?: boolean }) {
  if (!r) return <span className={`text-sm text-muted ${right ? "text-right" : ""}`}>—</span>;
  const s = r.matchup_pct != null ? STEPS[step(r.matchup_pct)] : null;
  return (
    <div className={`min-w-0 ${right ? "text-right" : ""}`}>
      <p className={`flex items-baseline gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <span className="font-display text-base font-bold tabular-nums text-ink">{r.proj_adj?.toFixed(1) ?? "—"}</span>
        <PlayerName name={r.player} pos={r.pos} className="truncate text-sm font-semibold text-ink" />
      </p>
      <p className="truncate text-xs text-muted">
        {r.report_status ? <span className="font-bold text-crimson">{r.report_status} · </span> : null}
        {r.nfl_team}
        {r.opp ? ` · ${r.opp}` : r.report_status ? "" : " · bye"}
        {s && s.label !== "Neutral" ? <span className={s.tone}> · {s.label}</span> : null}
      </p>
    </div>
  );
}

/** The slot, and who it favours by how much (the arrow points at the stronger side). */
function Edge({ slot, d }: { slot: string; d: number | null }) {
  return (
    <div className="flex w-12 flex-col items-center leading-tight">
      <span className="text-xs font-bold uppercase text-muted">{slot}</span>
      {d == null ? null : Math.abs(d) < 0.5 ? (
        <span className="text-xs text-muted">even</span>
      ) : (
        <span className={`text-xs font-bold tabular-nums ${d > 0 ? "text-pos-rb-text" : "text-crimson"}`}>
          {d > 0 ? "◀ " : ""}
          {Math.abs(d).toFixed(1)}
          {d < 0 ? " ▶" : ""}
        </span>
      )}
    </div>
  );
}
