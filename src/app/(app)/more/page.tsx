import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Header } from "@/components/Header";
import { LogoutButton } from "@/components/LogoutButton";
import { loadGuide } from "@/lib/content";
import { currentSession } from "@/lib/session";

export const metadata: Metadata = { title: "More" };

function Item({ href, icon, title, sub, admin }: { href: string; icon: IconName; title: string; sub?: string; admin?: boolean }) {
  return (
    <li>
      <Link href={href}>
        <span className={admin ? "mi admin" : "mi"}>
          <Icon name={icon} />
        </span>
        <span>
          <span className="mt">{title}</span>
          {sub ? <span className="ms">{sub}</span> : null}
        </span>
        <Icon name="chev" className="chev" />
      </Link>
    </li>
  );
}

const PAGE_ICON: Record<string, IconName> = { rules: "book", conduct: "shield" };

export default async function MorePage() {
  const [{ guide }, session] = await Promise.all([loadGuide(), currentSession()]);
  const pages = (group: "before" | "team") =>
    guide.pages
      .filter((p) => p.group === group)
      .map((p) => <Item key={p.id} href={`/more/${p.slug}`} icon={PAGE_ICON[p.slug] ?? "book"} title={p.title} sub={p.summary} />);

  return (
    <>
      <Header title="More" />
      <main className="main">
        <section className="sec">
          <h2 className="sec-h">Before you go</h2>
          <ul className="list menu">
            <Item href="/more/packing" icon="bag" title="Packing list" sub={`${guide.packing.length} items to tick off`} />
            <Item href="/venue#getting" icon="plane" title="Flight details" sub="Add yours to the team sheet" />
            {pages("before")}
          </ul>
        </section>
        <section className="sec">
          <h2 className="sec-h">Team</h2>
          <ul className="list menu">
            {pages("team")}
            <Item href="/more/anthem" icon="anthem" title="National anthem" sub={guide.anthem.title} />
            <Item href="/more/links" icon="link" title="Useful links" sub={guide.links.map((l) => l.label).slice(0, 3).join(", ")} />
          </ul>
        </section>
        {session?.role === "admin" ? (
          <section className="sec">
            <h2 className="sec-h">Staff</h2>
            <ul className="list menu">
              <Item href="/admin" icon="pencil" title="Edit the guide" sub="Change anything players see" admin />
              <Item href="/admin/access" icon="key" title="Team passcode" sub="See it, share it, or change it" admin />
              <Item href="/admin/tournaments" icon="schedule" title="Tournaments" sub="Start the next one, choose which one players see" admin />
            </ul>
          </section>
        ) : null}
        <section className="sec">
          <h2 className="sec-h">This phone</h2>
          <ul className="list menu">
            <li>
              <LogoutButton />
            </li>
          </ul>
          <p className="meta">To keep the guide on your home screen, use Share → Add to Home Screen (iPhone) or the ⋮ menu → Add to home screen (Android).</p>
        </section>
      </main>
    </>
  );
}
