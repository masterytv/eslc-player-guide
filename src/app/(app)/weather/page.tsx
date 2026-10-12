import type { Metadata } from "next";
import { DayStrip } from "@/components/DayStrip";
import { EditLink } from "@/components/EditLink";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { DaySummary, hourLabel, hoursFrom } from "@/components/Weather";
import { RainMap, Temp, UnitToggle, Wind } from "@/components/WeatherUnits";
import { loadGuide } from "@/lib/content";
import { entriesFor, isGameDay, tripDays } from "@/lib/plan";
import { clockLabel, dayLabel, dayParts, timeZoneLabel, toMinutes, zonedNow } from "@/lib/time";
import { describeWeather, forecastFrom, weatherDays } from "@/lib/weather-data";
import { loadWeather } from "@/lib/weather";

export const metadata: Metadata = { title: "Weather" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function WeatherPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const { guide } = await loadGuide();
  const tz = guide.event.timeZone;
  const { date: today, minutes } = zonedNow(new Date(), tz);
  const w = await loadWeather(guide.event);

  if (w.status !== "ok") {
    const message =
      w.status === "no-place"
        ? "Add the tournament's location under Edit the guide → Event & alert, and the forecast shows here."
        : w.status === "not-found"
          ? `Couldn't find “${w.query}” on the map. Staff can set the town under Edit the guide → Event & alert → Weather town.`
          : "The forecast isn't available right now. Try again in a few minutes.";
    return (
      <>
        <Header title="Weather" back="/" />
        <main className="main">
          <div className="card empty">
            <h3>{w.status === "unavailable" ? "No forecast right now" : "No forecast yet"}</h3>
            <p className="meta">{message}</p>
            <EditLink href="/admin/event" />
          </div>
        </main>
      </>
    );
  }

  const { place, forecast } = w;
  const trip = tripDays(guide);
  const days = weatherDays(forecast, trip, today);
  const requested = typeof sp.day === "string" ? sp.day : "";
  const day = days.includes(requested) ? requested : days.includes(today) ? today : days[0];
  const d = forecast.days.find((x) => x.date === day);
  const tripAhead = trip.length > 0 && !days.some((x) => trip.includes(x)) && trip[0] > today;

  // What's on that day, by the hour it starts: shown beside the forecast for that hour.
  const onAt = new Map<number, string[]>();
  for (const e of entriesFor(guide, day)) {
    const m = toMinutes(e.time);
    if (m == null) continue;
    const h = Math.floor(m / 60);
    onAt.set(h, [...(onAt.get(h) ?? []), `${clockLabel(e.time)} · ${e.title}`]);
  }
  const hours = d ? hoursFrom(d, day === today, minutes) : [];
  const updated = zonedNow(new Date(forecast.fetchedAt), tz).minutes;
  const updatedAt = clockLabel(`${String(Math.floor(updated / 60)).padStart(2, "0")}:${String(updated % 60).padStart(2, "0")}`);

  return (
    <>
      <Header title="Weather" eyebrow={place.label} back="/" />
      <main className="main">
        {tripAhead ? (
          <div className="info">
            <Icon name="info" />
            <span>
              The forecast for the tournament starts showing around {dayLabel(forecastFrom(trip[0]))}. Until then, here&rsquo;s the
              week ahead in {place.label.split(",")[0]}.
            </span>
          </div>
        ) : null}

        <DayStrip
          base="/weather"
          label="Forecast days"
          days={days.map((x) => {
            const p = dayParts(x);
            return { date: x, dow: p.dow, day: p.day, label: dayLabel(x), selected: x === day, today: x === today, game: isGameDay(guide, x) };
          })}
        />

        <div className="dayhead">
          <h2 className="h-disp">{dayLabel(day)}</h2>
          <UnitToggle />
        </div>

        {d ? <DaySummary d={d} /> : null}

        <section className="sec">
          <h3 className="sec-h">Hour by hour</h3>
          {hours.length ? (
            <ol className="card wx-hours">
              {hours.map((h) => {
                const x = describeWeather(h.code, h.isDay);
                const on = onAt.get(Number(h.time.slice(0, 2)));
                return (
                  <li key={h.time} className={on ? "wx-hour on" : "wx-hour"}>
                    <span className="t">{hourLabel(h.time)}</span>
                    <Icon name={x.icon} />
                    <span className="d">
                      <b>
                        <Temp c={h.temp} />
                      </b>
                      <span className="l">{x.label}</span>
                    </span>
                    <span className="r">
                      <span className="p">
                        <Icon name="drop" size="sm" />
                        {h.rainChance ?? 0}%
                      </span>
                      <span className="w">
                        <Wind kmh={h.wind} />
                      </span>
                    </span>
                    {on ? (
                      <span className="wx-on">
                        {on.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="card empty">
              <p className="meta">No more hours in the forecast for today. Pick tomorrow above.</p>
            </div>
          )}
        </section>

        <section className="sec">
          <h3 className="sec-h">Rain map</h3>
          <div className="card">
            <RainMap latitude={place.latitude} longitude={place.longitude} town={place.label.split(",")[0]} />
          </div>
        </section>

        <p className="foot">
          Forecast by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo.com
          </a>
          , updated {updatedAt}. All times are {timeZoneLabel(tz)} time.
        </p>
      </main>
    </>
  );
}
