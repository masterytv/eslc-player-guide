import Link from "next/link";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide, loadTournaments } from "@/lib/content";
import { FIRST_TOURNAMENT } from "@/lib/schema";
import { countOf, GROUPS, SECTIONS } from "@/lib/sections";
import { getStore } from "@/lib/store";
import { rangeLabel } from "@/lib/time";

function when(iso: string | null, timeZone: string, empty: string) {
  if (!iso) return empty;
  return `Saved ${new Date(iso).toLocaleString("en-GB", { timeZone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}

export default async function AdminHome() {
  const [{ id, guide, meta }, { liveId }] = await Promise.all([loadGuide(), loadTournaments()]);
  const readonly = getStore().kind === "readonly";
  const live = id === liveId;
  const e = guide.event;
  return (
    <>
      <Header title="Edit the guide" eyebrow="Staff" back="/more" />
      <main className="main">
        <section className="adm-group">
          <h2 className="sec-h">Tournament</h2>
          <ul className="list">
            <li>
              <Link className="adm-row" href="/admin/tournaments">
                <span>
                  <span className="mt">{e.eventName || "Untitled tournament"}</span>
                  <span className="ms">{[live ? "Live: players see it" : "Not live: only staff see it", rangeLabel(e.startDate, e.endDate)].filter(Boolean).join(" · ")}</span>
                  <span className="ms">Switch tournament or start the next one</span>
                </span>
                <Icon name="chev" className="chev" />
              </Link>
            </li>
          </ul>
        </section>
        {readonly ? (
          <p className="warn">
            <Icon name="warn" />
            <span>Saving is switched off: this deployment has no database yet. Add the Neon integration in Vercel (Storage → Neon), then redeploy.</span>
          </p>
        ) : live ? (
          <p className="meta">Changes go live as soon as you save. Pick what to change:</p>
        ) : (
          <p className="meta">Players won&rsquo;t see these changes until you make this tournament live. Pick what to change:</p>
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
                        <span className="ms">{when(meta[s.key].updatedAt, e.timeZone, id === FIRST_TOURNAMENT ? "Starting content" : "Not changed yet")}</span>
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
