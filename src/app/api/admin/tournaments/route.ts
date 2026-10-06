import { NextResponse } from "next/server";
import { VIEW_COOKIE } from "@/lib/auth";
import { contentChanged, loadTournament, loadTournaments, viewCookie } from "@/lib/content";
import { sameSecret } from "@/lib/passwords";
import { issuesOf } from "@/lib/schema";
import { adminOrError } from "@/lib/session";
import { getStore, StorageNotConfigured } from "@/lib/store";
import { newTournamentSchema, startingContent, tournamentId } from "@/lib/tournaments";

const fix = (path: string, message: string) => Response.json({ error: "Some fields need fixing.", issues: [{ path, message }] }, { status: 422 });

/** Starts a tournament as a copy of an earlier one. Staff then work on it; players don't see it until it's made live. */
export async function POST(req: Request) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "The details didn't arrive in one piece. Try again." }, { status: 400 });
  }
  const parsed = newTournamentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Some fields need fixing.", issues: issuesOf(parsed.error) }, { status: 422 });
  const input = parsed.data;
  if (sameSecret(input.passcode, process.env.ADMIN_PASSWORD ?? "")) return fix("passcode", "That's the staff password. Pick something different for players.");

  const { list } = await loadTournaments();
  if (!list.some((t) => t.id === input.copyFrom)) return fix("copyFrom", "Pick a tournament to start from");
  const source = await loadTournament(input.copyFrom);
  const id = tournamentId(input.name, list.map((t) => t.id));

  try {
    if (!(await getStore().create(id, startingContent(source.guide, input)))) {
      return Response.json({ error: "A tournament with that name was added just now. Reload to see it." }, { status: 409 });
    }
  } catch (err) {
    if (err instanceof StorageNotConfigured) return Response.json({ error: err.message }, { status: 503 });
    console.error("Starting a tournament failed", err);
    return Response.json({ error: "Couldn't set it up right now. Try again in a minute." }, { status: 500 });
  }
  contentChanged();

  // The staff member who started it carries on working on it.
  const res = NextResponse.json({ id });
  res.cookies.set(VIEW_COOKIE, id, viewCookie(req));
  return res;
}
