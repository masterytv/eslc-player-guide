import type { Metadata } from "next";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";

export const metadata: Metadata = { title: "Useful links" };

export default async function LinksPage() {
  const { links } = (await loadGuide()).guide;
  return (
    <>
      <Header title="Useful links" eyebrow="More" back="/more" />
      <main className="main">
        <div className="h-row">
          <span />
          <EditLink href="/admin/links" />
        </div>
        {links.length ? (
          <ul className="list menu">
            {links.map((l) => (
              <li key={l.id}>
                <a href={l.url} {...(/^https?:/i.test(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="mi">
                    <Icon name="link" />
                  </span>
                  <span>
                    <span className="mt">{l.label}</span>
                    {l.note ? <span className="ms">{l.note}</span> : null}
                  </span>
                  <Icon name="ext" className="chev" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card empty">
            <h3>No links yet</h3>
          </div>
        )}
      </main>
    </>
  );
}
