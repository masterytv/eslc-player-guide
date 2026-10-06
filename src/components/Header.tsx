import Link from "next/link";
import { loadGuide, loadTournaments } from "@/lib/content";
import { currentSession } from "@/lib/session";
import { Icon } from "./Icon";
import { UpdatedAt } from "./UpdatedAt";

export async function Header({ title, eyebrow, back }: { title: string; eyebrow?: string; back?: string }) {
  const [{ id, guide, lastUpdated }, session, { liveId, list }] = await Promise.all([loadGuide(), currentSession(), loadTournaments()]);
  const fallbackEyebrow = [guide.event.team.replace(/ Lacrosse$/, ""), guide.event.eventName].filter(Boolean).join(" · ");
  // Staff working on a tournament players can't see are reminded on every page.
  const preview = session?.role === "admin" && id !== liveId;
  return (
    <>
      <header className="hdr">
        {back ? (
          <Link className="back" href={back} aria-label="Back">
            <Icon name="back" />
          </Link>
        ) : (
          <span className="crest">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crest.png" alt="Ireland Lacrosse" width={24} height={30} />
          </span>
        )}
        <div className="hdr-txt">
          <span className="hdr-eyebrow">{eyebrow ?? fallbackEyebrow}</span>
          <h1 className="hdr-title">{title}</h1>
        </div>
        {session?.role === "admin" ? (
          <Link className="admin-pill" href="/admin">
            Staff
          </Link>
        ) : null}
        <UpdatedAt iso={lastUpdated} />
      </header>
      {preview ? (
        <Link className="preview-bar" href="/admin/tournaments">
          <span>
            You&rsquo;re working on <b>{guide.event.eventName || "a tournament"}</b>. Players see{" "}
            {list.find((t) => t.id === liveId)?.name ?? "the live one"}.
          </span>
          <span className="txt">Switch</span>
        </Link>
      ) : null}
    </>
  );
}
