import type { Metadata } from "next";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { PackingList } from "@/components/PackingList";
import { loadGuide } from "@/lib/content";

export const metadata: Metadata = { title: "Packing list" };

export default async function PackingPage() {
  const { guide } = await loadGuide();
  const info = guide.packingInfo;
  return (
    <>
      <Header title="Packing list" eyebrow="More" back="/more" />
      <main className="main">
        <div className="h-row">
          <span />
          <div className="row-btns">
            <EditLink href="/admin/packing" label="Edit items" />
            <EditLink href="/admin/packingNotes" label="Edit notes" />
          </div>
        </div>
        <PackingList items={guide.packing} notes={guide.packingNotes} />
        {info.supplied.length ? (
          <section className="sec">
            <h2 className="sec-h">
              <span>{info.suppliedTitle || "Supplied kit"}</span>
              <EditLink href="/admin/packingInfo" />
            </h2>
            <ul className="given">
              {info.supplied.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
