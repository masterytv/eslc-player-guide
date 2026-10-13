import type { Metadata } from "next";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";
import { NEARBY_CATEGORIES, NEARBY_LABEL } from "@/lib/schema";
import { with24h } from "@/lib/time";

export const metadata: Metadata = { title: "Around the Resort" };

const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default async function AroundTheResortPage() {
  const { guide } = await loadGuide();
  const { notes } = guide.nearbyInfo;
  // Categories always show in the same order; within one, places keep the order staff gave them.
  const groups = NEARBY_CATEGORIES.map((c) => ({ key: c, label: NEARBY_LABEL[c], places: guide.nearby.filter((p) => p.category === c) })).filter(
    (g) => g.places.length,
  );

  return (
    <>
      <Header title="Around the Resort" eyebrow="More" back="/more" />
      <main className="main">
        <div className="h-row">
          <span />
          <div className="row-btns">
            <EditLink href="/admin/nearby" label="Edit places" />
            <EditLink href="/admin/nearbyInfo" label="Edit notes" />
          </div>
        </div>

        {notes.length ? (
          <div className="info">
            <Icon name="info" />
            <ul className="near-notes">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {groups.length ? (
          <nav className="jumps wrap" aria-label="Jump to">
            {groups.map((g) => (
              <a key={g.key} href={`#${g.key}`}>
                {g.label}
              </a>
            ))}
          </nav>
        ) : (
          <div className="card empty">
            <h3>No places yet</h3>
          </div>
        )}

        {groups.map((g) => (
          <section className="sec" id={g.key} key={g.key}>
            <h2 className="h-disp">{g.label}</h2>
            {g.places.map((p) => (
              <div className="card near" key={p.id}>
                <h3>{p.name}</h3>
                {p.walk || p.hours || p.rating ? (
                  <p className="near-facts">
                    {p.walk ? (
                      <span>
                        <Icon name="walk" size="sm" />
                        {/walk/i.test(p.walk) ? p.walk : `${p.walk} walk`}
                      </span>
                    ) : null}
                    {p.hours ? <span>{with24h(p.hours)}</span> : null}
                    {p.rating ? <span aria-label={`Rated ${p.rating} out of 5`}>★ {p.rating}</span> : null}
                  </p>
                ) : null}
                {p.note ? <p className="near-note">{p.note}</p> : null}
                <a className="pill-btn near-map" href={mapsUrl([p.name, p.town].filter(Boolean).join(", "))} target="_blank" rel="noopener noreferrer">
                  <Icon name="map" />
                  Open in Google Maps
                </a>
              </div>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
