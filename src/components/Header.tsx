import Link from "next/link";
import { loadGuide } from "@/lib/content";
import { currentSession } from "@/lib/session";
import { Icon } from "./Icon";
import { UpdatedAt } from "./UpdatedAt";

export async function Header({ title, eyebrow, back }: { title: string; eyebrow?: string; back?: string }) {
  const [{ guide, lastUpdated }, session] = await Promise.all([loadGuide(), currentSession()]);
  const fallbackEyebrow = [guide.event.team.replace(/ Lacrosse$/, ""), guide.event.eventName].filter(Boolean).join(" · ");
  return (
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
  );
}
