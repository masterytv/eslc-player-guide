import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";
import { telHref, whatsappHref } from "@/lib/phone";

export const metadata: Metadata = { title: "Team" };

function initials(name: string) {
  const parts = name.replace(/[’']/g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const view = sp.view === "roster" || sp.view === "rooms" ? sp.view : "staff";
  const { guide } = await loadGuide();
  const roster = [...guide.roster].sort((a, b) => (parseInt(a.number, 10) || 999) - (parseInt(b.number, 10) || 999));

  const tabs = [
    { key: "staff", label: `Staff (${guide.staff.length})`, href: "/team" },
    { key: "roster", label: guide.roster.length ? `Roster (${guide.roster.length})` : "Roster", href: "/team?view=roster" },
    { key: "rooms", label: "Rooms", href: "/team?view=rooms" },
  ];

  return (
    <>
      <Header title="Team" />
      <main className="main">
        <nav className="seg" aria-label="Team lists">
          {tabs.map((t) => (
            <Link key={t.key} href={t.href} replace scroll={false} aria-current={view === t.key ? "true" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>

        {view === "staff" ? (
          <section className="sec">
            <h2 className="sec-h">
              <span>Staff</span>
              <EditLink href="/admin/staff" />
            </h2>
            {guide.staff.length ? (
              <ul className="list">
                {guide.staff.map((p) => {
                  const tel = telHref(p.phone);
                  const wa = p.whatsapp ? whatsappHref(p.phone) : null;
                  return (
                    <li className="person" key={p.id}>
                      <span className="avatar" aria-hidden="true">
                        {initials(p.name)}
                      </span>
                      <div>
                        <h3>{p.name}</h3>
                        {p.role ? <p className="role">{p.role}</p> : null}
                        {p.phone ? <p className="num-line">{p.phone}</p> : <p className="num-line none">No number yet</p>}
                        {p.email ? (
                          <p className="num-line">
                            <a href={`mailto:${p.email}`}>{p.email}</a>
                          </p>
                        ) : null}
                        {tel ? (
                          <div className="row-btns">
                            <a className="pill-btn primary" href={tel}>
                              <Icon name="phone" />
                              Call
                            </a>
                            {wa ? (
                              <a className="pill-btn" href={wa} target="_blank" rel="noopener noreferrer">
                                <Icon name="chat" />
                                WhatsApp
                              </a>
                            ) : null}
                            <CopyButton text={p.phone} done="Number copied" />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="card empty">
                <h3>No staff listed yet</h3>
              </div>
            )}
          </section>
        ) : null}

        {view === "roster" ? (
          <section className="sec">
            <h2 className="sec-h">
              <span>Final roster</span>
              <EditLink href="/admin/roster" />
            </h2>
            {roster.length ? (
              <ol className="list roster">
                {roster.map((r) => (
                  <li key={r.id}>
                    <span className="jersey">{r.number || "–"}</span>
                    <span>
                      <b>
                        {r.firstName} {r.lastName}
                      </b>
                    </span>
                    <span className="meta">{r.position}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="card empty">
                <h3>The final roster isn&rsquo;t posted yet</h3>
                <p className="meta">Squad size is limited to 12 players. Names appear here once staff add them.</p>
              </div>
            )}
          </section>
        ) : null}

        {view === "rooms" ? (
          <>
            {guide.accommodation.villaName ? (
              <div className="card">
                <p className="eyebrow">Villa type</p>
                <h3>{guide.accommodation.villaName}</h3>
                <p className="meta">{[guide.accommodation.villaDetails, guide.accommodation.name].filter(Boolean).join(" · ")}</p>
                <Link className="txt-link" href="/venue#villas">
                  Villa details and maps
                  <Icon name="chev" size="sm" />
                </Link>
              </div>
            ) : null}
            <section className="sec">
              <h2 className="sec-h">
                <span>Rooming list</span>
                <EditLink href="/admin/rooming" />
              </h2>
              {guide.rooming.length ? (
                guide.rooming.map((v) => (
                  <div className="card" key={v.id}>
                    <h3>{v.villa}</h3>
                    {v.names.length ? (
                      <ul className="villa-names">
                        {v.names.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="meta">Names to come</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="card empty">
                  <h3>Room assignments aren&rsquo;t posted yet</h3>
                  <p className="meta">You&rsquo;ll see who you&rsquo;re sharing with here.</p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
