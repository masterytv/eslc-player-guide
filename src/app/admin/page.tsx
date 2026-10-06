import Link from "next/link";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";
import { getStore } from "@/lib/store";
import { countOf, GROUPS, SECTIONS } from "@/lib/sections";

function when(iso: string | null) {
  if (!iso) return "Starting content";
  return `Saved ${new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}

export default async function AdminHome() {
  const { guide, meta } = await loadGuide();
  const readonly = getStore().kind === "readonly";
  return (
    <>
      <Header title="Edit the guide" eyebrow="Staff" back="/more" />
      <main className="main">
        {readonly ? (
          <p className="warn">
            <Icon name="warn" />
            <span>Saving is switched off: this deployment has no database yet. Add the Neon integration in Vercel (Storage → Neon), then redeploy.</span>
          </p>
        ) : (
          <p className="meta">Changes go live as soon as you save. Pick what to change:</p>
        )}
        {GROUPS.map((g) => (
          <section className="adm-group" key={g}>
            <h2 className="sec-h">{g}</h2>
            <ul className="list">
              {SECTIONS.filter((s) => s.group === g).map((s) => {
                const n = countOf(guide, s.key);
                return (
                  <li key={s.key}>
                    <Link className="adm-row" href={`/admin/${s.key}`}>
                      <span>
                        <span className="mt">{s.title}</span>
                        <span className="ms">{s.description}</span>
                        <span className="ms">{when(meta[s.key].updatedAt)}</span>
                      </span>
                      <span className="inline">
                        {n != null ? <span className="adm-count">{n}</span> : null}
                        <Icon name="chev" className="chev" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className="adm-group">
          <h2 className="sec-h">Access</h2>
          <ul className="list">
            <li>
              <Link className="adm-row" href="/admin/access">
                <span>
                  <span className="mt">Team passcode</span>
                  <span className="ms">See it, share it, or change it</span>
                </span>
                <Icon name="chev" className="chev" />
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
