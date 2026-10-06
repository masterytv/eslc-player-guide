import { jwtVerify, SignJWT } from "jose";

// Shared by the proxy and the server: no database or Node-only imports here.

export const SESSION_COOKIE = "guide_session";
export const SESSION_DAYS = 30;

export type Role = "viewer" | "admin";
export interface Session {
  role: Role;
  /** The team passcode version the viewer logged in with; changing the passcode bumps it. */
  pv: number;
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

export async function signSession(session: Session): Promise<string> {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new SignJWT({ role: session.role, pv: session.pv })
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
    const pv = payload.pv;
    if ((role !== "viewer" && role !== "admin") || typeof pv !== "number") return null;
    return { role, pv };
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
