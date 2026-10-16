import Link from "next/link";
import type { Guide } from "@/lib/schema";
import { EditLink } from "./EditLink";
import { Icon } from "./Icon";

/** "€8: One-day ticket. Gets you in…" → price and what it covers. A line without a colon is all description. */
function splitPrice(line: string) {
  const at = line.indexOf(":");
  if (at <= 0 || at > 24) return { price: "", text: line };
  return { price: line.slice(0, at).trim(), text: line.slice(at + 1).trim() };
}

export function hasTickets(t: Guide["tickets"]) {
  return !!(t.intro || t.prices.length || t.tip);
}

/** Spectator ticket details: on Venue in full, and under the schedule with a link back to Venue. */
export function Tickets({ tickets, id, venueLink = false }: { tickets: Guide["tickets"]; id?: string; venueLink?: boolean }) {
  if (!hasTickets(tickets)) return null;
  return (
    <div className="card tickets" id={id}>
      <div className="h-row">
        <h3>{tickets.heading || "Spectator tickets"}</h3>
        <EditLink href="/admin/tickets" />
      </div>
      {tickets.intro ? <p className="prose-p">{tickets.intro}</p> : null}
      {tickets.prices.length ? (
        <ul className="tix-list">
          {tickets.prices.map((line) => {
            const { price, text } = splitPrice(line);
            return (
              <li key={line}>
                {price ? <b>{price}</b> : null}
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {tickets.tip ? (
        <div className="info">
          <Icon name="info" />
          <span>{tickets.tip}</span>
        </div>
      ) : null}
      {venueLink ? (
        <Link className="txt-link" href="/venue#fields">
          Venue address and map
        </Link>
      ) : null}
    </div>
  );
}
