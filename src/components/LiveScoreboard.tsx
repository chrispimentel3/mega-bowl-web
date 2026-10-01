"use client";

import { useEffect, useState } from "react";
import type { LiveResponse } from "@/app/api/live/route";
import type { LiveStarter, LiveTeam } from "@/lib/liveScoring";
import { PlayerName } from "@/components/PlayerCardProvider";

const f2 = (v: number) => v.toFixed(2);

function kickoff(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function StarterRow({ s }: { s: LiveStarter }) {
  const status =
    !s.player ? "empty slot"
    : s.state === "pre" ? `${s.detail || "not started"}`
    : s.state === "in" ? s.detail
    : s.state === "bye" ? "bye"
    : s.state === "post" ? "final"
    : "no game found";
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className={`truncate text-sm ${s.player ? "text-ink" : "italic text-crimson"}`}>
          <span className="mr-1.5 inline-block w-8 text-[11px] font-semibold text-muted">{s.slot}</span>
          {s.player ? <PlayerName name={s.player} pos={s.slot === "K" || s.slot === "DEF" ? s.slot : undefined} team={s.nfl_team} /> : "nobody"}
          {s.nfl_team ? <span className="text-xs text-muted"> · {s.nfl_team}</span> : null}
        </p>
        <p className="truncate pl-[2.4rem] text-[11px] text-muted">
          {s.state === "in" ? <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-crimson align-middle" /> : null}
          {status}
          {s.line ? ` · ${s.line}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${s.state === "pre" ? "text-muted" : "text-ink"}`}>
          {s.state === "pre" ? "—" : f2(s.pts)}
        </p>
        <p className="text-[11px] tabular-nums text-muted">
          proj {s.state === "post" ? f2(s.pts) : s.projFinal.toFixed(1)}
          {s.proj_avg && s.state === "pre" ? "*" : ""}
        </p>
      </div>
    </div>
  );
}

function Side({ t, mine, winning }: { t: LiveTeam; mine: boolean; winning: boolean }) {
  return (
    <div>
      <p className={`truncate text-sm font-semibold ${mine ? "text-navy" : "text-ink"}`}>{t.team}</p>
      <p className={`font-display text-3xl font-bold tabular-nums ${winning ? "text-ink" : "text-muted"}`}>{f2(t.pts)}</p>
      <p className="text-xs text-muted">
        proj {t.projFinal.toFixed(1)} · {t.playing ? `${t.playing} playing · ` : ""}{t.toPlay} to play
      </p>
    </div>
  );
}

function Matchup({ a, b, myTeam, open }: { a: LiveTeam; b: LiveTeam; myTeam: string; open: boolean }) {
  const started = a.toPlay + b.toPlay < a.starters.length + b.starters.length;
  return (
    <details open={open} className="group rounded-2xl border border-line bg-card shadow-sm">
      <summary className="cursor-pointer list-none p-4">
        <div className="grid grid-cols-2 gap-4">
          <Side t={a} mine={a.team === myTeam} winning={!started || a.pts >= b.pts} />
          <div className="text-right">
            <Side t={b} mine={b.team === myTeam} winning={!started || b.pts >= a.pts} />
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted group-open:hidden">show lineups</p>
      </summary>
      <div className="grid gap-4 border-t border-line px-4 pb-4 pt-2 sm:grid-cols-2">
        {[a, b].map((t) => (
          <div key={t.team} className="divide-y divide-line/60">
            {t.starters.map((s, i) => <StarterRow key={`${s.slot}-${i}`} s={s} />)}
          </div>
        ))}
      </div>
    </details>
  );
}

export function LiveScoreboard() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      let live = false;
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        const body: LiveResponse = await res.json();
        if (!cancelled) {
          setData(body);
          setError(false);
        }
        live = !!body.live;
      } catch {
        if (!cancelled) setError(true);
      }
      // every minute while a game is on, every five otherwise
      if (!cancelled) timer = setTimeout(load, live ? 60_000 : 300_000);
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!data) {
    return <p className="py-6 text-center text-sm text-muted">{error ? "Couldn't load live scores." : "Loading live scores…"}</p>;
  }
  if (!data.available || !data.matchups) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        {data.reason ?? "No live scores right now."}
      </div>
    );
  }

  const games = data.games ?? [];
  const next = games.filter((g) => g.state === "pre").sort((x, y) => x.kickoff.localeCompare(y.kickoff))[0];
  const started = games.some((g) => g.state !== "pre");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-ink">
          Week {data.week} {started ? "live" : "preview"}
          {data.live ? <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-crimson align-middle" /> : null}
        </h1>
        <p className="text-xs text-muted">
          {next ? `next kickoff ${kickoff(next.kickoff)} · ` : ""}
          updated {data.updated ? new Date(data.updated).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"}
        </p>
      </div>

      <div className="space-y-3">
        {data.matchups.map(({ a, b }) => (
          <Matchup key={a.team} a={a} b={b} myTeam={data.my_team ?? ""}
                   open={a.team === data.my_team || b.team === data.my_team} />
        ))}
      </div>

      {games.length > 0 ? (
        <div className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">NFL games</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {games.map((g) => (
              <div key={g.id} className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs">
                <div className="flex justify-between"><span>{g.away}</span><span className="tabular-nums">{g.state === "pre" ? "" : g.awayScore}</span></div>
                <div className="flex justify-between"><span>{g.home}</span><span className="tabular-nums">{g.state === "pre" ? "" : g.homeScore}</span></div>
                <p className={`mt-0.5 truncate ${g.state === "in" ? "text-crimson" : "text-muted"}`}>
                  {g.state === "pre" ? kickoff(g.kickoff) : g.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted">
        Scored here from ESPN&apos;s box scores with the league&apos;s half-PPR rules — checked
        against week 3, where it matched Yahoo to the point for every lineup that hadn&apos;t
        changed since. Lineups are as of this morning&apos;s Yahoo pull, so a swap made later
        won&apos;t show, and Yahoo&apos;s own stat corrections can move a total afterwards.
        Projected finals add each starter&apos;s projection for the part of his game still to
        play; * marks a kicker or defense, which use a league-average week.
      </p>
    </div>
  );
}
