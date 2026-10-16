"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { savePasscode, savedPasscode } from "@/lib/offers";
import { PasscodeForm, msg } from "./OfferLog";

/** "Refresh league": asks the Mac to pull Yahoo and rebuild the site (service/refresh_request.py,
 *  tools/refresh_watch.py), follows it, and expires the site's cache when it lands. */
const API_URL = process.env.NEXT_PUBLIC_ASK_API_URL || "http://localhost:8008";
const POLL_MS = 10_000;
const MAC_SLOW_S = 90;     // queued this long and the Mac hasn't picked it up: it's probably asleep

type State = {
  status?: "queued" | "running" | "done" | "failed";
  step?: string | null;
  requested_at?: number;
  finished_at?: number;
  message?: string | null;
  cooldown?: boolean;
};

class RefreshError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call(method: "GET" | "POST", passcode: string): Promise<State> {
  const r = await fetch(`${API_URL}/refresh`, { method, headers: { "X-Offer-Passcode": passcode } });
  if (!r.ok) {
    let detail = `The server answered ${r.status}.`;
    try {
      detail = (await r.json()).detail ?? detail;
    } catch {
      /* keep the status line */
    }
    throw new RefreshError(detail, r.status);
  }
  return r.json();
}

function ago(ts: number) {
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function RefreshButton() {
  const router = useRouter();
  // storage is read on the client only: the server render (and hydration) see `undefined`
  const stored = useSyncExternalStore(() => () => {}, savedPasscode, () => undefined);
  const [entered, setPasscode] = useState<string>();
  const passcode = entered ?? stored;
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<State>({});
  const [error, setError] = useState<string>();
  const watching = useRef(false);

  const fail = useCallback((e: unknown) => {
    if (e instanceof RefreshError && e.status === 401) {
      savePasscode("");
      setPasscode("");
      setAsking(true);
    }
    setError(e instanceof RefreshError ? e.message : msg(e, "Couldn't reach the server."));
  }, []);

  // follow a queued or running refresh; when it lands, expire the cache and re-render
  const follow = useCallback(async (p: string) => {
    if (watching.current) return;
    watching.current = true;
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        const s = await call("GET", p);
        setState(s);
        if (s.status === "done" || s.status === "failed") {
          if (s.status === "done") {
            await fetch("/api/refresh-site", { method: "POST", headers: { "X-Offer-Passcode": p } });
            router.refresh();
          }
          return;
        }
      }
    } catch (e) {
      fail(e);
    } finally {
      watching.current = false;
    }
  }, [fail, router]);

  useEffect(() => {
    if (!stored) return;
    const p = stored;
    call("GET", p)
      .then((s) => {
        setState(s);
        if (s.status === "queued" || s.status === "running") follow(p);
      })
      .catch(fail);
  }, [stored, fail, follow]);

  const press = async (p: string) => {
    setError(undefined);
    try {
      const s = await call("POST", p);
      savePasscode(p);
      setPasscode(p);
      setAsking(false);
      setState(s);
      if (s.status === "queued" || s.status === "running") follow(p);
    } catch (e) {
      fail(e);
    }
  };

  if (passcode === undefined) return null;          // first render, before storage is read

  const busy = state.status === "queued" || state.status === "running";
  const waited = state.requested_at ? Date.now() / 1000 - state.requested_at : 0;
  const line =
    state.status === "running" ? `${state.step ?? "Refreshing"}…`
    : state.status === "queued" ? (waited > MAC_SLOW_S
        ? "Waiting for your Mac — it runs as soon as your Mac is awake."
        : "Queued — your Mac picks it up within a minute.")
    : state.status === "failed" ? `Refresh failed: ${state.message ?? "see the log on your Mac"}`
    : state.status === "done" && state.finished_at
      ? `${state.cooldown ? "Refreshed" : "Updated"} ${ago(state.finished_at)}${state.message ? ` · ${state.message}` : ""}`
      : "League data refreshes every morning at 7.";

  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className={`min-w-0 text-xs ${state.status === "failed" ? "text-crimson" : "text-muted"}`} aria-live="polite">
          {line}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => (passcode ? press(passcode) : setAsking(true))}
          className="hit h-9 shrink-0 rounded-lg bg-navy px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh league"}
        </button>
      </div>
      {asking ? (
        <div className="mt-3">
          <PasscodeForm onSave={press} error={error} />
        </div>
      ) : error ? (
        <p className="mt-2 text-xs text-crimson">{error}</p>
      ) : null}
    </div>
  );
}
