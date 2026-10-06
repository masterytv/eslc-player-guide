import { NextResponse, type NextRequest } from "next/server";
import { safeNext, SESSION_COOKIE, SESSION_DAYS, sessionSecretConfigured, signSession, type Session } from "@/lib/auth";
import { loadGuide } from "@/lib/content";
import { clearFailures, recordFailure, sameSecret, tooManyAttempts } from "@/lib/passwords";

export async function POST(req: NextRequest) {
  if (!sessionSecretConfigured()) {
    return NextResponse.json(
      { error: "The app isn't set up yet: SESSION_SECRET is missing. Add it in Vercel and redeploy." },
      { status: 500 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: "Too many tries. Wait 10 minutes and try again." }, { status: 429 });
  }

  let body: { passcode?: unknown; next?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";
  const { access } = await loadGuide();

  let session: Session | null = null;
  if (passcode && sameSecret(passcode, process.env.ADMIN_PASSWORD ?? "")) session = { role: "admin", pv: access.version };
  else if (passcode && sameSecret(passcode, access.passcode)) session = { role: "viewer", pv: access.version };

  if (!session) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 400));
    const unset = !access.passcode && !process.env.ADMIN_PASSWORD;
    return NextResponse.json(
      {
        error: unset
          ? "No passwords are set up yet. Add ADMIN_PASSWORD and VIEWER_PASSWORD in Vercel and redeploy."
          : "That passcode didn't work. Check the team group chat for the current one.",
      },
      { status: unset ? 500 : 401 },
    );
  }

  clearFailures(ip);
  const res = NextResponse.json({ ok: true, role: session.role, next: safeNext(typeof body.next === "string" ? body.next : "/") });
  res.cookies.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
