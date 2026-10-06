import { contentChanged, loadTournaments } from "@/lib/content";
import { APP_SCOPE, LIVE_KEY } from "@/lib/schema";
import { adminOrError } from "@/lib/session";
import { FORCE, getStore, StorageNotConfigured } from "@/lib/store";

/** Makes a tournament the one players see. */
export async function POST(req: Request) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  const id = await req
    .json()
    .then((b) => (typeof b.id === "string" ? b.id : ""))
    .catch(() => "");
  const { list } = await loadTournaments();
  if (!list.some((t) => t.id === id)) return Response.json({ error: "That tournament no longer exists. Reload the page." }, { status: 404 });

  try {
    await getStore().write(APP_SCOPE, LIVE_KEY, { id }, FORCE);
  } catch (err) {
    if (err instanceof StorageNotConfigured) return Response.json({ error: err.message }, { status: 503 });
    console.error("Switching the live tournament failed", err);
    return Response.json({ error: "Couldn't switch right now. Try again in a minute." }, { status: 500 });
  }
  contentChanged();
  return Response.json({ ok: true });
}
