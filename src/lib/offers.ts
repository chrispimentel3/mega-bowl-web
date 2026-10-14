/** Client for the trade-offer log (service/offer_log.py): offers you actually sent and how
 *  each came back — the declined ones Yahoo never shows, which the acceptance odds need. */
const API_URL = process.env.NEXT_PUBLIC_ASK_API_URL || "http://localhost:8008";
const KEY = "offer-passcode";
export const OFFERS_CHANGED = "offers-changed";

export type OfferBody = {
  partner: string;
  give: string[];
  get: string[];
  p_accept?: number | null;
  d_me?: number | null;
  d_them?: number | null;
  source: string;
};

export type LoggedOffer = OfferBody & {
  id: string;
  ts: number;
  outcome: "accepted" | "declined" | "withdrawn" | null;
  outcome_ts: number | null;
};

// a convenience per device: if storage is blocked, the passcode is just asked again
export function savedPasscode(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePasscode(p: string) {
  try {
    if (p) localStorage.setItem(KEY, p);
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: ask again next time */
  }
}

export class OfferError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(method: "GET" | "POST", passcode: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_URL}/offers`, {
    method,
    headers: { "Content-Type": "application/json", "X-Offer-Passcode": passcode },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let detail = `The offer log answered ${r.status}.`;
    try {
      detail = (await r.json()).detail ?? detail;
    } catch {
      /* keep the status line */
    }
    throw new OfferError(detail, r.status);
  }
  return r.json();
}

export const listOffers = (passcode: string) => call<{ offers: LoggedOffer[] }>("GET", passcode);

export async function logSent(passcode: string, offer: OfferBody) {
  const out = await call<{ offers: LoggedOffer[] }>("POST", passcode, { action: "sent", ...offer });
  window.dispatchEvent(new Event(OFFERS_CHANGED));
  return out;
}

export async function logOutcome(passcode: string, id: string, action: NonNullable<LoggedOffer["outcome"]>) {
  const out = await call<{ offers: LoggedOffer[] }>("POST", passcode, { action, id });
  window.dispatchEvent(new Event(OFFERS_CHANGED));
  return out;
}
