import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/auth";

// First gate: every page, image and API call needs a valid login cookie, and
// anything under /admin needs the admin role. (The server also re-checks the
// team passcode version, which this proxy can't see.)
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");

  if (session && (!adminPath || session.role === "admin")) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: session ? "Only staff can make changes." : "Your login has expired. Log in again." },
      { status: session ? 403 : 401 },
    );
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  if (session && adminPath) login.searchParams.set("admin", "1");
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico|icons/|crest.png|sw.js|manifest.webmanifest|robots.txt).*)",
  ],
};
