import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, verifySession, type Session } from "./auth";
import { loadLiveGuide } from "./content";
import { viewerMayStay } from "./passwords";

/**
 * The signed-in session, or null. A player counts as signed out once the live tournament's
 * passcode is no longer the one they logged in with.
 */
export const currentSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  if (session.role === "viewer") {
    const live = await loadLiveGuide();
    if (!viewerMayStay(session, { id: live.id, ...live.access })) return null;
  }
  return session;
});

export async function requireViewer(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect("/login?expired=1");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/login?admin=1&next=/admin");
  return session;
}

/** For route handlers: the admin session, or a 401/403 response to return. */
export async function adminOrError(): Promise<Session | Response> {
  const session = await currentSession();
  if (!session) return Response.json({ error: "Your login has expired. Log in again to save." }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Only staff can make changes." }, { status: 403 });
  return session;
}
