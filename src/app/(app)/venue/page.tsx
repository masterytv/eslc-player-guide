import type { Metadata } from "next";
import { CopyButton } from "@/components/CopyButton";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { MapTiles } from "@/components/MapTiles";
import { loadGuide } from "@/lib/content";
import { clockLabel, dayLabel } from "@/lib/time";

export const metadata: Metadata = { title: "Venue & stay" };

const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function External({ href, children, className = "txt-link" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default async function VenuePage() {
  const { guide } = await loadGuide();
  const { travel, accommodation: acc, venue } = guide;
  const maps = (where: string) => guide.maps.filter((m) => m.placement === where).map((m) => ({ id: m.id, title: m.title, src: m.image }));
  const otherMaps = maps("other");
  const resortQuery = [acc.name, acc.address].filter(Boolean).join(", ");
  const venueQuery = [venue.name, venue.address].filter(Boolean).join(", ");

  return (
    <>
      <Header title="Venue & stay" />
      <main className="main">
        <nav className="jumps" aria-label="Jump to">
          <a href="#getting">Getting there</a>
          <a href="#villas">Villas</a>
          <a href="#fields">Fields</a>
          <a href="#meals">Meals</a>
        </nav>

        <section className="sec" id="getting">
          <div className="h-row">
            <h2 className="h-disp">Getting there</h2>
            <EditLink href="/admin/travel" />
          </div>
          {travel.busTime || travel.busText ? (
            <div className="card">
              <p className="eyebrow">{[travel.busDate && dayLabel(travel.busDate), "Team bus"].filter(Boolean).join(" · ")}</p>
              <div className="big-time">
                {travel.busTime ? <b>{clockLabel(travel.busTime)}</b> : null}
                {travel.busHeadline ? <span>{travel.busHeadline}</span> : null}
              </div>
              {travel.busText ? <p className="prose-p">{travel.busText}</p> : null}
            </div>
          ) : null}
          {travel.flightTitle || travel.flightText ? (
            <div className="card">
              {travel.flightTitle ? <h3>{travel.flightTitle}</h3> : null}
              {travel.flightText ? <p className="prose-p">{travel.flightText}</p> : null}
              {travel.flightFormUrl || travel.flightResponsesUrl ? (
                <div className="row-btns">
                  {travel.flightFormUrl ? (
                    <External className="pill-btn primary" href={travel.flightFormUrl}>
                      <Icon name="plane" />
                      Add my flight
                    </External>
                  ) : null}
                  {travel.flightResponsesUrl ? (
                    <External className="pill-btn" href={travel.flightResponsesUrl}>
                      See responses
                    </External>
                  ) : null}
                </div>
              ) : (
                <p className="meta">Ask staff for the link to the flight sheet.</p>
              )}
            </div>
          ) : null}
          {guide.rides.length ? (
            <div className="card rides">
              <div className="h-row">
                <h3>{travel.ridesTitle || "Ride options"}</h3>
                <EditLink href="/admin/rides" />
              </div>
              {guide.rides.map((r) => (
                <details key={r.id}>
                  <summary>
                    <span>
                      <b>{r.name}</b>
                      {r.summary ? <span>{r.summary}</span> : null}
                    </span>
                    <Icon name="chev" />
                  </summary>
                  {r.details ? <p>{r.details}</p> : null}
                </details>
              ))}
              {travel.ridesLinkUrl ? (
                <External href={travel.ridesLinkUrl}>
                  {travel.ridesLinkLabel || "More ride options"}
                  <Icon name="ext" size="sm" />
                </External>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="sec" id="villas">
          <div className="h-row">
            <h2 className="h-disp">Villas</h2>
            <EditLink href="/admin/accommodation" />
          </div>
          <div className="card">
            {acc.dates ? <p className="eyebrow">{acc.dates}</p> : null}
            <h3>{acc.name || "Accommodation"}</h3>
            {acc.address ? <p className="addr">{acc.address}</p> : null}
            {resortQuery ? (
              <div className="row-btns">
                <External className="pill-btn primary" href={mapsUrl(resortQuery)}>
                  <Icon name="map" />
                  Open in Maps
                </External>
                <CopyButton text={resortQuery} label="Copy address" done="Address copied" />
              </div>
            ) : null}
          </div>
          {acc.villaName || acc.amenities.length ? (
            <div className="card">
              <p className="eyebrow">Our villas</p>
              {acc.villaName ? <h3>{acc.villaName}</h3> : null}
              {acc.villaDetails || acc.villaNote ? <p className="meta">{[acc.villaDetails, acc.villaNote].filter(Boolean).join(" · ")}</p> : null}
              {acc.amenities.length ? (
                <ul className="amen">
                  {acc.amenities.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <MapTiles maps={maps("villas")} />
        </section>

        <section className="sec" id="fields">
          <div className="h-row">
            <h2 className="h-disp">Fields</h2>
            <EditLink href="/admin/venue" />
          </div>
          <div className="card">
            <p className="eyebrow">Venue</p>
            <h3>{venue.name || "Venue"}</h3>
            {venue.address ? <p className="addr">{venue.address}</p> : null}
            {venueQuery ? (
              <div className="row-btns">
                <External className="pill-btn primary" href={mapsUrl(venueQuery)}>
                  <Icon name="map" />
                  Open in Maps
                </External>
                <CopyButton text={venueQuery} label="Copy address" done="Address copied" />
              </div>
            ) : null}
          </div>
          {venue.walkNote ? (
            <div className="info">
              <Icon name="walk" />
              <span>{venue.walkNote}</span>
            </div>
          ) : null}
          {venue.amenities.length || venue.notes.length ? (
            <div className="card">
              <h3>At the venue</h3>
              {venue.amenities.length ? (
                <ul className="amen">
                  {venue.amenities.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
              {venue.notes.length ? (
                <ul className="bul">
                  {venue.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <MapTiles maps={maps("fields")} />
          <div className="h-row">
            <span />
            <EditLink href="/admin/maps" label="Edit maps" />
          </div>
        </section>

        {otherMaps.length ? (
          <section className="sec" id="maps">
            <h2 className="h-disp">More maps</h2>
            <MapTiles maps={otherMaps} />
          </section>
        ) : null}

        <section className="sec" id="meals">
          <div className="h-row">
            <h2 className="h-disp">Meals</h2>
            <EditLink href="/admin/meals" />
          </div>
          {guide.meals.length ? (
            <ul className="list">
              {guide.meals.map((m) => (
                <li className="meal-row" key={m.id}>
                  <b>{m.meal}</b>
                  <div>
                    <p>{[m.time, m.place].filter(Boolean).join(" · ") || "Time and place to be confirmed"}</p>
                    {m.notes ? <p className="meta">{m.notes}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card empty">
              <h3>Meal times aren&rsquo;t posted yet</h3>
              <p className="meta">Times and where we eat will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
