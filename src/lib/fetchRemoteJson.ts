/** Every page here reads at least one export off raw.githubusercontent.com, and player
 * cards read one of 998 distinct, individually-cold URLs — under concurrent traffic that
 * host occasionally hiccups (a timeout or a transient 5xx), and an uncaught throw from a
 * Server Component takes down the whole page render, not just the one fetch. This retries
 * a failed fetch a couple of times with a short backoff before giving up, so a momentary
 * blip doesn't read as "the site is broken." A 404 is never retried — that's a real answer,
 * not a hiccup.
 */
export class RemoteFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "RemoteFetchError";
    this.status = status;
  }
}

export async function fetchRemoteJson<T>(url: string, revalidate: number, label: string): Promise<T> {
  const attempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate } });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 404) throw new RemoteFetchError(`${label} 404: ${url}`, 404);
      lastError = new RemoteFetchError(`${label} fetch failed: ${res.status} ${res.statusText}`, res.status);
    } catch (e) {
      lastError = e;
    }
    if (lastError instanceof RemoteFetchError && lastError.status === 404) break;
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError;
}
