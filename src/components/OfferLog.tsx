"use client";

import { useCallback, useEffect, useState } from "react";
import {
  OFFERS_CHANGED, OfferError, listOffers, logOutcome, logSent, savePasscode, savedPasscode,
  type LoggedOffer, type OfferBody,
} from "@/lib/offers";

// a sleeping Render service fails the fetch itself, before any status comes back
const msg = (e: unknown, fallback: string) =>
  e instanceof OfferError ? e.message
    : e instanceof TypeError ? "Couldn't reach the server. It may be waking up; try again in a minute."
    : fallback;

function PasscodeForm({ onSave, error }: { onSave: (p: string) => void; error?: string }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v) onSave(v);
      }}
    >
      <input
        type="password"
        autoComplete="current-password"
        aria-label="Offer log passcode"
        placeholder="Offer log passcode"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-card px-3 text-sm text-ink"
      />
      <button type="submit" className="hit h-10 rounded-lg bg-navy px-4 text-sm font-semibold text-white">
        Save
      </button>
      {error ? <p className="w-full text-xs text-crimson">{error}</p> : null}
    </form>
  );
}

/** "Log as sent" under an offer. Asks for the passcode once per device. */
export function LogOfferButton({ offer }: { offer: OfferBody }) {
  const [state, setState] = useState<"idle" | "ask" | "busy" | "done">("idle");
  const [error, setError] = useState<string>();

  const send = async (passcode: string) => {
    setState("busy");
    setError(undefined);
    try {
      await logSent(passcode, offer);
      savePasscode(passcode);
      setState("done");
    } catch (e) {
      if (e instanceof OfferError && e.status === 401) savePasscode("");
      setError(msg(e, "Couldn't log it."));
      setState(e instanceof OfferError && e.status === 401 ? "ask" : "idle");
    }
  };

  if (state === "done") return <p className="text-xs font-semibold text-pos-rb-text">✓ Logged as sent</p>;
  if (state === "ask") return <PasscodeForm onSave={send} error={error} />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => {
          const p = savedPasscode();
          if (p) send(p);
          else setState("ask");
        }}
        className="hit h-9 rounded-lg border border-line px-3 text-xs font-semibold text-ink disabled:opacity-60"
      >
        {state === "busy" ? "Logging…" : "I sent this"}
      </button>
      {error ? <span className="text-xs text-crimson">{error}</span> : null}
    </div>
  );
}

const OUTCOMES: { action: NonNullable<LoggedOffer["outcome"]>; label: string }[] = [
  { action: "accepted", label: "Accepted" },
  { action: "declined", label: "Declined" },
  { action: "withdrawn", label: "Withdrawn" },
];

/** The log itself: open offers to mark, and how the closed ones went against the estimate. */
export function YourOffers() {
  const [passcode, setPasscode] = useState<string>();
  const [offers, setOffers] = useState<LoggedOffer[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const load = useCallback(async (p: string) => {
    try {
      const out = await listOffers(p);
      setOffers(out.offers);
      setError(undefined);
      savePasscode(p);
      setPasscode(p);
    } catch (e) {
      if (e instanceof OfferError && e.status === 401) {
        savePasscode("");
        setPasscode("");
      }
      setError(msg(e, "Couldn't load the offer log."));
    }
  }, []);

  useEffect(() => {
    const p = savedPasscode();
    setPasscode(p);
    if (p) load(p);
    const again = () => {
      const q = savedPasscode();
      if (q) load(q);
    };
    window.addEventListener(OFFERS_CHANGED, again);
    return () => window.removeEventListener(OFFERS_CHANGED, again);
  }, [load]);

  if (passcode === undefined) return null;            // first render, before storage is read
  if (!passcode) {
    return (
      <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-sm">
        <p className="mb-2 text-sm text-muted">Enter the passcode to see the offers you&apos;ve logged.</p>
        <PasscodeForm onSave={load} error={error} />
      </div>
    );
  }
  if (!offers) {
    return <p className="text-sm text-muted">{error ?? "Loading your offers…"}</p>;
  }
  if (!offers.length) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 text-sm text-muted">
        Nothing logged yet. Tap &ldquo;I sent this&rdquo; under any offer you actually make.
      </p>
    );
  }

  const closed = offers.filter((o) => o.outcome && o.outcome !== "withdrawn");
  const yes = closed.filter((o) => o.outcome === "accepted").length;
  const expected = closed.reduce((s, o) => s + (o.p_accept ?? 0), 0);

  const mark = async (o: LoggedOffer, action: NonNullable<LoggedOffer["outcome"]>) => {
    setBusy(o.id);
    try {
      setOffers((await logOutcome(passcode, o.id, action)).offers);
    } catch (e) {
      setError(msg(e, "Couldn't save that."));
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <>
      {closed.length ? (
        <p className="mb-2 text-sm text-muted">
          {yes} of {closed.length} answered offers accepted; the estimates added up to{" "}
          {expected.toFixed(1)}.
        </p>
      ) : null}
      {error ? <p className="mb-2 text-xs text-crimson">{error}</p> : null}
      <ul className="divide-y divide-line rounded-xl border border-line bg-card px-4 shadow-sm">
        {offers.map((o) => (
          <li key={o.id} className="py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-ink">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{o.partner}</span>
                <br />
                Sent <b>{o.give.join(" + ")}</b> for <b>{o.get.join(" + ")}</b>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                est. {o.p_accept != null ? `${Math.round(o.p_accept * 100)}%` : "—"}
              </span>
            </div>
            {o.outcome ? (
              <p className={`mt-1 text-xs font-semibold ${o.outcome === "accepted" ? "text-pos-rb-text" : o.outcome === "declined" ? "text-crimson" : "text-muted"}`}>
                {o.outcome[0].toUpperCase() + o.outcome.slice(1)}
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {OUTCOMES.map(({ action, label }) => (
                  <button
                    key={action}
                    type="button"
                    disabled={busy === o.id}
                    onClick={() => mark(o, action)}
                    className="hit h-9 rounded-lg border border-line px-3 text-xs font-semibold text-ink disabled:opacity-60"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
