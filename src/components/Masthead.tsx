import { NavTabs } from "./NavTabs";
import { SubNav } from "./SubNav";
import { MastheadShell } from "./MastheadShell";
import { BottomTabBar } from "./BottomTabBar";
import { getActionBoard } from "@/lib/action-board";

// A day, plus the daily run's start-time drift so a late-starting run isn't a false alarm.
// Pages re-render hourly (ISR), so the warning appears within the hour even with no new data.
const STALE_HOURS = 26;

function hoursSince(iso: string) {
  return (Date.now() - Date.parse(iso)) / 3_600_000;
}

export async function Masthead({
  season,
  week,
  nextWeek,
  rosterSrc,
}: {
  season: number;
  week: number;
  nextWeek: number;
  rosterSrc: string | null;
}) {
  // the same cached fetch every page already makes for these props
  const pulled = (await getActionBoard()).yahoo_pulled_at;
  const stale = pulled ? hoursSince(pulled) > STALE_HOURS : false;
  return (
    <>
    <MastheadShell>
      <div className="mh-row mx-auto flex max-w-2xl items-baseline justify-between px-4 pt-2 sm:max-w-3xl sm:pt-3">
        <h1 className="mh-title font-display text-xl font-bold text-navy sm:text-2xl">
          Mega Bowl
        </h1>
        {/* one line on a phone; the detail (scored weeks, roster source) from sm up */}
        <p className="mh-status text-right text-xs text-muted" title={rosterSrc ?? undefined}>
          {season} · wk {nextWeek}
          <span className="hidden sm:inline">
            {" "}· scored through wk {week}
            {rosterSrc ? <> · {rosterSrc}</> : null}
          </span>
        </p>
      </div>
      <NavTabs />
      <SubNav />
    </MastheadShell>
    {stale && pulled ? (
      <div className="mx-auto mt-2 max-w-2xl px-4 sm:max-w-3xl">
      <p role="status" className="rounded-lg bg-crimson/10 px-3 py-2 text-sm text-crimson">
        League data from Yahoo was last pulled{" "}
        {new Date(pulled).toLocaleString("en-US", {
          timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        })}{" "}
        ET — rosters, waivers and trades may be out of date. The usual cause is an expired Yahoo sign-in.
      </p>
      </div>
    ) : null}
    {/* outside the header: its backdrop-filter would trap a fixed bar inside it */}
    <BottomTabBar />
    </>
  );
}
