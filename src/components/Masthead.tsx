import { NavTabs } from "./NavTabs";
import { SubNav } from "./SubNav";
import { MastheadShell } from "./MastheadShell";
import { BottomTabBar } from "./BottomTabBar";

export function Masthead({
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
    {/* outside the header: its backdrop-filter would trap a fixed bar inside it */}
    <BottomTabBar />
    </>
  );
}
