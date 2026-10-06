import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sessionKey, type Session } from "./auth";
import { FIRST_TOURNAMENT } from "./schema";

/** Constant-time comparison that doesn't leak the length of the stored value. */
export function sameSecret(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Stands in for the team passcode inside a player's login cookie without revealing it. A login
 * lasts while the live tournament's passcode still matches: changing the passcode, or making a
 * tournament with a different one live, signs players out; one with the same passcode doesn't.
 */
export function passcodeFingerprint(passcode: string): string {
  const key = sessionKey();
  if (!key || !passcode) return "";
  return createHmac("sha256", key).update(`team-passcode:${passcode}`).digest("base64url").slice(0, 22);
}

export function viewerMayStay(session: Session, live: { id: string; passcode: string; version: number }): boolean {
  if (!live.passcode) return false;
  if (session.fp) return session.fp === passcodeFingerprint(live.passcode);
  // Logins from before tournaments carry the passcode's version number instead.
  return live.id === FIRST_TOURNAMENT && session.pv === live.version;
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
