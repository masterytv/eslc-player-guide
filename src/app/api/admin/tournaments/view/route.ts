import { NextResponse } from "next/server";
import { VIEW_COOKIE } from "@/lib/auth";
import { loadTournaments, viewCookie } from "@/lib/content";
import { adminOrError } from "@/lib/session";

/** Picks the tournament this staff member is working on. Only their own view changes. */
export async function POST(req: Request) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  const id = await req
    .json()
    .then((b) => (typeof b.id === "string" ? b.id : ""))
    .catch(() => "");
  const { liveId, list } = await loadTournaments();
  if (!list.some((t) => t.id === id)) return Response.json({ error: "That tournament no longer exists. Reload the page." }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  // Working on the live one means following whichever tournament is live.
  if (id === liveId) res.cookies.set(VIEW_COOKIE, "", { ...viewCookie(req), maxAge: 0 });
  else res.cookies.set(VIEW_COOKIE, id, viewCookie(req));
  return res;
}
