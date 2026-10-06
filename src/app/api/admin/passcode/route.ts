import { loadGuide } from "@/lib/content";
import { sameSecret } from "@/lib/passwords";
import { ACCESS_KEY } from "@/lib/schema";
import { adminOrError } from "@/lib/session";
import { getStore, StorageNotConfigured } from "@/lib/store";

export async function POST(req: Request) {
  const auth = await adminOrError();
  if (auth instanceof Response) return auth;

  let passcode = "";
  try {
    const body = await req.json();
    passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";
  } catch {
    // handled below
  }
  if (passcode.length < 4) return Response.json({ error: "Use at least 4 characters. A couple of words is easy to share and hard to guess." }, { status: 422 });
  if (passcode.length > 64) return Response.json({ error: "Keep the passcode under 64 characters." }, { status: 422 });
  if (sameSecret(passcode, process.env.ADMIN_PASSWORD ?? "")) {
    return Response.json({ error: "That's the staff password. Pick something different for players." }, { status: 422 });
  }

  const { access } = await loadGuide();
  try {
    const result = await getStore().write(ACCESS_KEY, { passcode, version: access.version + 1 }, access.storedVersion);
    if (!result.ok) return Response.json({ error: "Someone else changed the passcode just now. Reload to see it." }, { status: 409 });
  } catch (err) {
    if (err instanceof StorageNotConfigured) return Response.json({ error: err.message }, { status: 503 });
    console.error("Changing the passcode failed", err);
    return Response.json({ error: "Couldn't change the passcode. Try again in a minute." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
