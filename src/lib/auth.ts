import { jwtVerify, SignJWT } from "jose";

// Shared by the proxy and the server: no database or Node-only imports here.

export const SESSION_COOKIE = "guide_session";
export const SESSION_DAYS = 30;
/** Which tournament a staff member is working on, when it isn't the live one. */
export const VIEW_COOKIE = "guide_view";

export type Role = "viewer" | "admin";
export interface Session {
  role: Role;
  /** Players: a fingerprint of the team passcode they logged in with (see passwords.ts). */
  fp?: string;
  /**
   * The passcode's version number, which is how logins were checked before tournaments existed.
   * Still written so a rollback to that version keeps everyone logged in.
   */
  pv?: number;
}

const DEV_SECRET = "local-development-secret-not-for-production";

function secret(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode(DEV_SECRET);
  return null;
}

export function sessionSecretConfigured(): boolean {
  return secret() !== null;
}

/** The signing key, also used to fingerprint team passcodes. Null when it isn't set up. */
export function sessionKey(): Uint8Array | null {
  return secret();
}

export async function signSession(session: Session): Promise<string> {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new SignJWT({ role: session.role, pv: session.pv ?? 0, ...(session.fp ? { fp: session.fp } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  const key = secret();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const role = payload.role;
    const fp = typeof payload.fp === "string" ? payload.fp : undefined;
    const pv = typeof payload.pv === "number" ? payload.pv : undefined;
    if (role === "admin") return { role };
    if (role !== "viewer" || (fp === undefined && pv === undefined)) return null;
    return { role, fp, pv };
  } catch {
    return null;
  }
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.startsWith("/login") || next.startsWith("/api/")) return "/";
  return next;
}
