import Link from "next/link";
import type { Guide } from "@/lib/schema";
import { clock, dayLabel, toMinutes } from "@/lib/time";
import { describeWeather, forecastFrom, type WeatherDay, type WeatherHour } from "@/lib/weather-data";
import { loadWeather } from "@/lib/weather";
import { Icon } from "./Icon";
import { Temp, Wind } from "./WeatherUnits";

/** "14:00" → "2 PM" */
export function hourLabel(t: string): string {
  const c = clock(t);
  return c ? `${c.hm.replace(/:00$/, "")} ${c.ap}` : t;
}

// Other days' hour by hour starts here: the small hours just make the list longer.
const DAY_STARTS = 6 * 60;

/** The hours from the current one on, for today; from 6 AM otherwise. */
export function hoursFrom(day: WeatherDay, isToday: boolean, minutes: number): WeatherHour[] {
  const from = isToday ? Math.floor(minutes / 60) * 60 : DAY_STARTS;
  return day.hours.filter((h) => (toMinutes(h.time) ?? 0) >= from);
}

function Facts({ d }: { d: WeatherDay }) {
  return (
    <>
      High <Temp c={d.max} /> · Low <Temp c={d.min} />
      {d.rainChance != null ? ` · ${d.rainChance}% chance of rain` : null}
    </>
  );
}

/** The weather card on Today: the selected day at a glance, linking to hour by hour. */
export async function TodayWeather({ guide, day, today, minutes }: { guide: Guide; day: string; today: string; minutes: number }) {
  const w = await loadWeather(guide.event);
  // Today stays clean when there's nothing to show; the Weather page explains why.
  if (w.status !== "ok" || day < today) return null;
  const town = w.place.label.split(",")[0];
  const d = w.forecast.days.find((x) => x.date === day);
  const href = d ? `/weather?day=${day}` : "/weather";

  if (!d) {
    return (
      <section className="sec">
        <h3 className="sec-h">
          <span>Weather · {town}</span>
        </h3>
        <Link className="card wx-card" href={href}>
          <p className="meta">
            The forecast for {dayLabel(day)} shows here from about {dayLabel(forecastFrom(day))}. Tap for the week ahead in {town}.
          </p>
        </Link>
      </section>
    );
  }

  const isToday = day === today;
  const now = isToday && w.forecast.now?.date === today ? w.forecast.now : null;
  const head = describeWeather(now ? now.code : d.code, now ? now.isDay : true);
  const hours = isToday ? hoursFrom(d, true, minutes).slice(0, 6) : d.hours.filter((h) => ["09:00", "12:00", "15:00", "18:00", "21:00"].includes(h.time));

  return (
    <section className="sec">
      <h3 className="sec-h">
        <span>Weather · {town}</span>
        <Link className="txt-link" href={href}>
          Hour by hour
          <Icon name="chev" size="sm" />
        </Link>
      </h3>
      <Link className="card wx-card" href={href} aria-label={`Weather for ${dayLabel(day)}: ${head.label}. Hour by hour`}>
        <div className="wx-head">
          <Icon name={head.icon} className="wx-big" />
          <div>
            <p className="wx-temp">
              {now ? (
                <Temp c={now.temp} />
              ) : (
                <>
                  <Temp c={d.max} />
                  <span className="wx-low">
                    {" / "}
                    <Temp c={d.min} />
                  </span>
                </>
              )}
            </p>
            <p className="meta">
              {head.label}
              {now ? (
                <>
                  {" · "}
                  <Facts d={d} />
                </>
              ) : d.rainChance != null ? (
                ` · ${d.rainChance}% chance of rain`
              ) : null}
            </p>
          </div>
        </div>
        {hours.length ? (
          <ol className="wx-strip">
            {hours.map((h) => {
              const x = describeWeather(h.code, h.isDay);
              return (
                <li key={h.time}>
                  <span className="t">{hourLabel(h.time)}</span>
                  <Icon name={x.icon} />
                  <b>
                    <Temp c={h.temp} />
                  </b>
                  <span className="p">{h.rainChance ? `${h.rainChance}%` : ""}</span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </Link>
    </section>
  );
}

/** A day at a glance, for the Weather page. */
export function DaySummary({ d }: { d: WeatherDay }) {
  const x = describeWeather(d.code);
  return (
    <div className="card wx-card">
      <div className="wx-head">
        <Icon name={x.icon} className="wx-big" />
        <div>
          <p className="wx-temp">
            <Temp c={d.max} />
            <span className="wx-low">
              {" / "}
              <Temp c={d.min} />
            </span>
          </p>
          <p className="meta">
            {x.label}
            {d.rainChance != null ? ` · ${d.rainChance}% chance of rain` : null}
          </p>
        </div>
      </div>
      <dl className="wx-facts">
        <div>
          <dt>Wind</dt>
          <dd>
            Up to <Wind kmh={d.windMax} />
          </dd>
        </div>
        {d.sunrise ? (
          <div>
            <dt>Sunrise</dt>
            <dd>{hourLabelExact(d.sunrise)}</dd>
          </div>
        ) : null}
        {d.sunset ? (
          <div>
            <dt>Sunset</dt>
            <dd>{hourLabelExact(d.sunset)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function hourLabelExact(t: string): string {
  const c = clock(t);
  return c ? `${c.hm} ${c.ap}` : t;
}
