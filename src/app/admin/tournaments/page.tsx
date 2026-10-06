import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { activeTournamentId, loadTournament, loadTournaments } from "@/lib/content";
import { rangeLabel, zonedNow } from "@/lib/time";
import { TournamentActions } from "./TournamentActions";

export const metadata: Metadata = { title: "Tournaments" };

export default async function TournamentsPage() {
  const [{ liveId, list }, active] = await Promise.all([loadTournaments(), activeTournamentId()]);
  const guides = await Promise.all(list.map((t) => loadTournament(t.id)));
  const passcodes = new Map(guides.map((g) => [g.id, g.access.passcode]));
  const liveName = list.find((t) => t.live)?.name ?? "";

  return (
    <>
      <Header title="Tournaments" eyebrow="Edit the guide" back="/admin" />
      <main className="main no-tabs">
        <p className="meta">
          Players see the live tournament. Staff can work on any of them: get the next one ready before it goes live, or look back at
          an old one.
        </p>
        <Link className="btn primary" href="/admin/tournaments/new">
          <Icon name="plus" />
          Start the next tournament
        </Link>
        <ul className="tourneys">
          {list.map((t) => {
            const finished = !t.live && !!t.endDate && t.endDate < zonedNow(new Date(), t.timeZone).date;
            return (
              <li className="card" key={t.id}>
                <div className="tourney-top">
                  {t.live ? <span className="chip live-now">Live</span> : <span className="chip">{finished ? "Finished" : "Not live"}</span>}
                  {t.id === active ? <span className="chip meeting">You&rsquo;re working on this</span> : null}
                </div>
                <h3>{t.name}</h3>
                <p className="meta">{[rangeLabel(t.startDate, t.endDate), t.location].filter(Boolean).join(" · ")}</p>
                <TournamentActions
                  id={t.id}
                  name={t.name}
                  live={t.live}
                  active={t.id === active}
                  liveName={liveName}
                  passcode={passcodes.get(t.id) ?? ""}
                  samePasscode={passcodes.get(t.id) === passcodes.get(liveId)}
                />
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
