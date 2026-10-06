import type { Metadata } from "next";
import Link from "next/link";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { loadGuide } from "@/lib/content";
import { byTime, TYPE_LABEL } from "@/lib/plan";
import type { Row } from "@/lib/schema";
import { clock, clockLabel, dayLabel, zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Schedule" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "game", label: "Games" },
  { key: "practice", label: "Practice" },
  { key: "meeting", label: "Meetings" },
] as const;

function matches(row: Row<"schedule">, filter: string) {
  if (filter === "all") return true;
  if (filter === "practice") return row.type === "practice" || row.type === "ceremony";
  if (filter === "meeting") return row.type === "meeting" || row.type === "other";
  return row.type === filter;
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.key === sp.filter) ? (sp.filter as string) : "all";
  const { guide } = await loadGuide();
  const { date: today } = zonedNow();
  const rows = guide.schedule.filter((r) => matches(r, filter));
  const dates = [...new Set(rows.map((r) => r.date))].sort();

  return (
    <>
      <Header title="Schedule" />
      <main className="main">
        <div className="sched-head">
          <div>
            {guide.event.poolName ? <p className="eyebrow">{guide.event.poolName}</p> : null}
            <h2 className="h-disp">Ireland&rsquo;s week</h2>
          </div>
          <div className="row-btns">
            <EditLink href="/admin/schedule" />
            {guide.event.scheduleUrl ? (
              <a className="pill-btn" href={guide.event.scheduleUrl} target="_blank" rel="noopener noreferrer">
                Full schedule
                <Icon name="ext" />
              </a>
            ) : null}
          </div>
        </div>

        <nav className="seg" aria-label="Filter">
          {FILTERS.map((f) => (
            <Link key={f.key} href={f.key === "all" ? "/schedule" : `/schedule?filter=${f.key}`} replace scroll={false} aria-current={filter === f.key ? "true" : undefined}>
              {f.label}
            </Link>
          ))}
        </nav>

        {dates.length ? (
          dates.map((date) => (
            <section className="day-group" key={date}>
              <h3 className="sday">
                {dayLabel(date)}
                {date === today ? <span className="live">Today</span> : null}
              </h3>
              {rows
                .filter((r) => r.date === date)
                .sort(byTime)
                .map((r) => {
                  const c = clock(r.time);
                  const isGame = r.type === "game";
                  const meta = isGame
                    ? [r.round, r.field, r.warmup ? `Warm-up ${clockLabel(r.warmup)}` : ""].filter(Boolean).join(" · ")
                    : [r.field && (/^field/i.test(r.field) ? r.field : `Field ${r.field}`), c ? "" : "Time to be confirmed"].filter(Boolean).join(" · ");
                  return (
                    <article key={r.id} className={date < today ? "ev past" : "ev"}>
                      {c ? (
                        <div className="ev-time">
                          <b>{c.hm}</b>
                          <small>{c.ap}</small>
                        </div>
                      ) : (
                        <div className="ev-time tbc">
                          <b>TBD</b>
                        </div>
                      )}
                      <div className="ev-main">
                        <span className={`chip ${r.type}`}>{TYPE_LABEL[r.type]}</span>
                        <h4>
                          {isGame ? `vs ${r.opponent || "TBC"}` : r.title || TYPE_LABEL[r.type]}
                          {isGame && r.opponentCode ? <span className="code">{r.opponentCode}</span> : null}
                        </h4>
                        {meta ? <p className="meta">{meta}</p> : null}
                        {r.notes ? <p className="meta">{r.notes}</p> : null}
                      </div>
                      {c ? (
                        <a className="icon-btn" href={`/cal/${r.id}`} aria-label={`Add ${isGame ? `the ${r.opponent} game` : r.title} to your calendar`}>
                          <Icon name="calplus" />
                        </a>
                      ) : (
                        <span />
                      )}
                    </article>
                  );
                })}
            </section>
          ))
        ) : (
          <div className="card empty">
            <h3>Nothing here yet</h3>
            <p className="meta">Games and practices appear here as soon as staff add them.</p>
          </div>
        )}

        {guide.schedule.some((r) => r.type === "game" && r.time) ? (
          // A calendar file download, not a page, so a plain link is right here.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a className="pill-btn self-start" href="/cal/games">
            <Icon name="calplus" />
            Add every game to my calendar
          </a>
        ) : null}

        <div className="key-legend">
          <span className="meta">Colours match the printed guide:</span>
          <span className="chip practice">Practice</span>
          <span className="chip ceremony">Ceremony</span>
          <span className="chip game">Pool play</span>
          <span className="chip meeting">Meeting</span>
        </div>
      </main>
    </>
  );
}
