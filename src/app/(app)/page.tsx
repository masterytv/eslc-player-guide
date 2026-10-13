import Link from "next/link";
import { Suspense } from "react";
import { Countdown } from "@/components/Countdown";
import { DayStrip } from "@/components/DayStrip";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { TodayWeather } from "@/components/Weather";
import { loadGuide } from "@/lib/content";
import { defaultDay, entriesFor, isGameDay, nextGame, tripDays, TYPE_LABEL } from "@/lib/plan";
import { clock, countdown, dayLabel, dayParts, daysBetween, timeZoneLabel, toMinutes, with24h, zonedNow } from "@/lib/time";

/** A time in a big display font, with its 24-hour version small underneath. */
function TimeBig({ t }: { t: string }) {
  const c = clock(t);
  if (!c) return <>TBC</>;
  return (
    <>
      {c.hm} {c.ap}
      <small className="h24">{c.h24}</small>
    </>
  );
}

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function TodayPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const { guide } = await loadGuide();
  const now = new Date();
  const { date: today, minutes } = zonedNow(now, guide.event.timeZone);
  const days = tripDays(guide);
  const home = defaultDay(days, today);
  const day = typeof sp.day === "string" && days.includes(sp.day) ? sp.day : home;
  const beforeTrip = days.length > 0 && today < days[0];
  const isToday = day === today;
  const rel = isToday ? "Today" : day < today ? "Earlier" : beforeTrip && day === days[0] ? "Day 1" : "Coming up";
  const entries = entriesFor(guide, day);
  const next = day === home ? nextGame(guide, now.getTime()) : null;
  const nextIsToday = next?.game.date === today;

  return (
    <>
      <Header title="Today" />
      <main className="main" id="main">
        {guide.event.alert.trim() ? (
          <div className="alert" role="status">
            <Icon name="warn" />
            <span>{with24h(guide.event.alert)}</span>
          </div>
        ) : null}

        {days.length > 0 ? (
          <DayStrip
            days={days.map((d) => {
              const p = dayParts(d);
              return { date: d, dow: p.dow, day: p.day, label: dayLabel(d), selected: d === day, today: d === today, game: isGameDay(guide, d) };
            })}
          />
        ) : null}

        <div className="dayhead">
          <h2 className="h-disp">{dayLabel(day)}</h2>
          <span className="rel">{rel}</span>
        </div>

        {/* The day's plan comes first: it's what players open the guide for each morning. */}
        <section className="sec">
          <h3 className="sec-h">
            <span>Daily notes</span>
            <EditLink href={`/admin/daily?day=${day}`} />
          </h3>
          {entries.length ? (
            <div className="card">
              <ol className="tl">
                {entries.map((e) => {
                  const c = clock(e.time);
                  const mins = toMinutes(e.time);
                  const past = isToday && mins != null && mins < minutes;
                  return (
                    <li key={e.id} className={past ? "tl-item past" : "tl-item"}>
                      {c ? (
                        <div className="tl-time">
                          {c.hm}
                          <small>{c.ap}</small>
                          <small className="h24">{c.h24}</small>
                        </div>
                      ) : (
                        <div className="tl-time tbc">TBC</div>
                      )}
                      <div className="tl-body">
                        {e.kind !== "note" ? <span className={`chip ${e.kind}`}>{TYPE_LABEL[e.kind]}</span> : null}
                        <h3>{with24h(e.title)}</h3>
                        {e.meta ? <p className="meta">{with24h(e.meta)}</p> : null}
                        {e.details ? <p>{with24h(e.details)}</p> : null}
                        {e.link ? (
                          /^https?:/i.test(e.link.href) ? (
                            <a className="txt-link" href={e.link.href} target="_blank" rel="noopener noreferrer">
                              {e.link.label}
                              <Icon name="ext" size="sm" />
                            </a>
                          ) : (
                            <Link className="txt-link" href={e.link.href}>
                              {e.link.label}
                              <Icon name="chev" size="sm" />
                            </Link>
                          )
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="card empty">
              <h3>Nothing posted for this day yet</h3>
              <p className="meta">Staff add the plan here the night before. Anything new also goes in the group chat.</p>
            </div>
          )}
        </section>

        {beforeTrip && day === home ? (
          <section className="pretrip" aria-label="Trip countdown">
            <span className="eyebrow">
              {guide.event.eventName}
            </span>
            <p className="big">
              {daysBetween(today, days[0]) === 1 ? "We travel tomorrow" : `${daysBetween(today, days[0])} days to go`}
            </p>
            <p>
              {[dayLabel(days[0]), guide.event.location].filter(Boolean).join(" · ")}. Pack early and add your flight to the team sheet.
            </p>
            <div className="next-actions">
              <Link className="ghost" href="/more/packing">
                <Icon name="bag" size="sm" />
                Packing list
              </Link>
              <Link className="ghost" href="/venue#getting">
                <Icon name="plane" size="sm" />
                Flight details
              </Link>
            </div>
          </section>
        ) : null}

        {next ? (
          <section className="next" aria-label="Next game">
            {next.game.round ? (
              <span className="next-ghost" aria-hidden="true">
                {next.game.round.replace(/^\D+/, "")}
              </span>
            ) : null}
            <div className="next-top">
              <span className="live">{nextIsToday ? "Next up" : "Next game"}</span>
              <Countdown at={next.at.toISOString()} initial={`Starts in ${countdown(now.getTime(), next.at.getTime())}`} />
            </div>
            <p className="next-round">
              {[nextIsToday ? null : dayLabel(next.game.date), guide.event.poolName, next.game.round].filter(Boolean).join(" · ")}
            </p>
            <div className="vs">
              <span className="tm">IRL</span>
              <span className="v">vs</span>
              <span className="tm">{next.game.opponentCode || next.game.opponent.slice(0, 3).toUpperCase() || "TBC"}</span>
            </div>
            {next.game.opponent ? <p className="next-names">Ireland v {next.game.opponent}</p> : null}
            <dl className="next-meta">
              <div>
                <dt>Start</dt>
                <dd>
                  <TimeBig t={next.game.time} />
                </dd>
              </div>
              <div>
                <dt>Field</dt>
                <dd>{next.game.field.replace(/^field\s*/i, "") || "TBC"}</dd>
              </div>
              <div>
                <dt>Warm-up</dt>
                <dd>
                  <TimeBig t={next.game.warmup} />
                </dd>
              </div>
            </dl>
            <div className="next-actions">
              <Link className="ghost" href="/venue#fields">
                <Icon name="map" size="sm" />
                Field map
              </Link>
              <Link className="ghost" href="/more/anthem">
                <Icon name="anthem" size="sm" />
                Anthem
              </Link>
              <a className="ghost" href={`/cal/${next.game.id}`}>
                <Icon name="calplus" size="sm" />
                Add to calendar
              </a>
            </div>
          </section>
        ) : null}

        {isGameDay(guide, day) && guide.venue.walkNote ? (
          <div className="info">
            <Icon name="walk" />
            <span>{with24h(guide.venue.walkNote)}</span>
          </div>
        ) : null}

        {/* The forecast comes from another service: the rest of the page doesn't wait for it. */}
        <Suspense fallback={null}>
          <TodayWeather guide={guide} day={day} today={today} minutes={minutes} />
        </Suspense>

        <section className="sec">
          <h3 className="sec-h">Quick links</h3>
          <div className="quick cols-2">
            <Link className="qt" href="/weather">
              <Icon name="wx-cloudsun" />
              Weather
            </Link>
            <Link className="qt" href="/venue#fields">
              <Icon name="walk" />
              Walk to the fields
            </Link>
            <Link className="qt" href="/team">
              <Icon name="phone" />
              Staff contacts
            </Link>
            <Link className="qt" href="/more/anthem">
              <Icon name="anthem" />
              Anthem lyrics
            </Link>
          </div>
          {guide.playbook.length ? (
            <div className={["quick", guide.playbook.length < 3 && `cols-${guide.playbook.length}`].filter(Boolean).join(" ")}>
              {guide.playbook.map((p) => (
                <Link key={p.id} className="qt" href={`/more/game-plan/${p.slug}`}>
                  <Icon name="board" />
                  {p.title}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
        <p className="foot">All times are {timeZoneLabel(guide.event.timeZone)} time.</p>
      </main>
    </>
  );
}
