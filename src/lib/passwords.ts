import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time comparison that doesn't leak the length of the stored value. */
export function sameSecret(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// A small per-instance brake on guessing. Serverless instances don't share
// memory, so this slows guessing rather than capping it; a passcode of a few
// words is the real protection.
const WINDOW_MS = 10 * 60_000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; until: number }>();

export function tooManyAttempts(ip: string, now = Date.now()): boolean {
  const entry = failures.get(ip);
  if (!entry || entry.until < now) return false;
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(ip: string, now = Date.now()): void {
  const entry = failures.get(ip);
  if (!entry || entry.until < now) failures.set(ip, { count: 1, until: now + WINDOW_MS });
  else entry.count += 1;
  if (failures.size > 5000) failures.clear();
}

export function clearFailures(ip: string): void {
  failures.delete(ip);
}
