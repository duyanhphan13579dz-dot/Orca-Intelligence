// ====================================================================
// Fetch Utilities — Retry, Backoff, Performance Timing
// ====================================================================

const UA = "Mozilla/5.0 (compatible; OrcaBot/2.0; +https://orcafinancial.vn)";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;

export interface FetchTiming {
  url: string;
  durationMs: number;
  attempts: number;
  status: number | "timeout" | "error";
}

/**
 * Fetch with exponential backoff retry.
 * Không retry vô hạn — tối đa MAX_RETRIES lần.
 * Ghi log đầy đủ mỗi lần retry.
 */
export async function fetchWithRetry(
  url: string,
  options: { timeout?: number; headers?: Record<string, string> } = {},
): Promise<{ res: Response; timing: FetchTiming }> {
  const timeout = options.timeout ?? 12_000;
  const headers = { Accept: "*/*", "User-Agent": UA, ...(options.headers ?? {}) };
  const t0 = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeout),
        next: { revalidate: 900 },
      });
      const durationMs = Date.now() - t0;
      if (res.ok) {
        return { res, timing: { url, durationMs, attempts: attempt, status: res.status } };
      }
      // Non-retryable HTTP errors
      if (res.status === 404 || res.status === 403 || res.status === 401) {
        console.warn(`[fetch-utils] ${url} -> ${res.status} (non-retryable)`);
        return { res, timing: { url, durationMs, attempts: attempt, status: res.status } };
      }
      console.warn(`[fetch-utils] Attempt ${attempt}/${MAX_RETRIES}: ${url} -> ${res.status}`);
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === "TimeoutError";
      console.warn(`[fetch-utils] Attempt ${attempt}/${MAX_RETRIES}: ${url} -> ${isTimeout ? "timeout" : "error"} (${e instanceof Error ? e.message : e})`);
      if (attempt === MAX_RETRIES) {
        return {
          res: new Response(null, { status: 0 }),
          timing: { url, durationMs: Date.now() - t0, attempts: attempt, status: isTimeout ? "timeout" : "error" },
        };
      }
    }
    // Exponential backoff: 800ms, 1600ms, 3200ms
    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    await sleep(delay);
  }

  // Should not reach here but TypeScript requires it
  return {
    res: new Response(null, { status: 0 }),
    timing: { url, durationMs: Date.now() - t0, attempts: MAX_RETRIES, status: "error" },
  };
}

/** Run tasks in parallel with concurrency limit */
export async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit = 5,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.allSettled(batch.map((t) => t()));
    results.push(...batchResults);
  }
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Measure execution time of an async function */
export async function withTiming<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const t0 = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - t0 };
}
