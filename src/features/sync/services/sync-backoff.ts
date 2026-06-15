const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export function calculateRetryDelayMs(attempt: number): number {
  const normalizedAttempt = Math.max(1, Math.floor(attempt));
  const exponentialDelay = Math.min(
    BASE_DELAY_MS * 2 ** (normalizedAttempt - 1),
    MAX_DELAY_MS,
  );
  const jitter = Math.floor(Math.random() * BASE_DELAY_MS);

  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

export function calculateRetryTimestamp(
  attempt: number,
  now: number = Date.now(),
): string {
  return new Date(now + calculateRetryDelayMs(attempt)).toISOString();
}
