import type { Metadata } from "next";
import { safeNext } from "@/lib/auth";
import { loadGuide } from "@/lib/content";
import { rangeLabel } from "@/lib/time";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const { guide } = await loadGuide();
  const e = guide.event;
  const notice = one("admin")
    ? "That page is for staff. Log in with the staff password to edit the guide."
    : one("expired")
      ? "The team passcode has changed, or your login expired. Enter the current passcode from the group chat."
      : null;

  return (
    <main className="login">
      <div className="login-card">
        <span className="crest">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/crest.png" alt="Ireland Lacrosse" width={43} height={54} />
        </span>
        <div>
          <h1>
            {e.eventName} {e.guideTitle}
          </h1>
          <p className="sub">
            {[e.team, rangeLabel(e.startDate, e.endDate), e.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <LoginForm next={safeNext(one("next"))} notice={notice} />
        <p className="hint">Staff: log in with the staff password to edit.</p>
      </div>
    </main>
  );
}
