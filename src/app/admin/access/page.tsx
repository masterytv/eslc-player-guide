import type { Metadata } from "next";
import { CopyButton } from "@/components/CopyButton";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide, loadTournaments } from "@/lib/content";
import { PasscodeForm } from "./PasscodeForm";

export const metadata: Metadata = { title: "Team passcode" };

export default async function AccessPage() {
  const [{ id, guide, access }, { liveId }] = await Promise.all([loadGuide(), loadTournaments()]);
  const live = id === liveId;
  return (
    <>
      <Header title="Team passcode" eyebrow={guide.event.eventName || "Edit the guide"} back="/admin" />
      <main className="main no-tabs">
        <div className="card">
          <p className="eyebrow">{live ? "Players log in with" : "Players will log in with"}</p>
          {access.passcode ? (
            <>
              <p className="passcode-big">
                {access.passcode}
              </p>
              <div className="row-btns">
                <CopyButton text={access.passcode} label="Copy passcode" done="Passcode copied" />
              </div>
            </>
          ) : (
            <p className="warn">
              <Icon name="warn" />
              <span>No team passcode is set, so players can&rsquo;t log in yet. Set one below.</span>
            </p>
          )}
          <p className="meta">
            {live
              ? "Share it in the team group chat. Players enter it once per phone."
              : `This tournament isn't live yet. Players will need this passcode once it is, unless it's the same as now.`}
          </p>
        </div>

        <section className="sec">
          <h2 className="sec-h">Change the passcode</h2>
          <div className="card">
            <PasscodeForm tournament={id} />
            <p className="meta">Everyone already logged in as a player will be asked for the new passcode next time they open the guide. Staff stay logged in.</p>
          </div>
        </section>

        <div className="info">
          <Icon name="info" />
          <span>
            The staff password isn&rsquo;t shown here. It&rsquo;s set in Vercel (Settings → Environment Variables → <b>ADMIN_PASSWORD</b>) and changing it needs a redeploy.
          </span>
        </div>
      </main>
    </>
  );
}
