import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeWeather,
  forecastFrom,
  forecastResponse,
  parsePlace,
  pickPlace,
  rainIn,
  shapeForecast,
  tempIn,
  weatherDays,
  windIn,
  type ForecastResponse,
} from "../../src/lib/weather-data.ts";

const dublinIE = { name: "Dublin", latitude: 53.33, longitude: -6.25, country_code: "IE", country: "Ireland", admin1: "Leinster" };
const dublinUS = { name: "Dublin", latitude: 40.1, longitude: -83.11, country_code: "US", country: "United States", admin1: "Ohio" };
const londonGB = { name: "London", latitude: 51.5, longitude: -0.12, country_code: "GB", country: "United Kingdom", admin1: "England" };
const londonCA = { name: "London", latitude: 42.98, longitude: -81.23, country_code: "CA", country: "Canada", admin1: "Ontario" };

test("reads the town and country staff typed", () => {
  assert.deepEqual(parsePlace("Salou, Spain"), { name: "Salou", hints: ["spain"] });
  assert.deepEqual(parsePlace(" Tarragona , Catalonia, Spain "), { name: "Tarragona", hints: ["catalonia", "spain"] });
  assert.deepEqual(parsePlace("Salou"), { name: "Salou", hints: [] });
});

test("finds the place staff meant", () => {
  // The geocoder lists bigger places first; a country named picks the right one.
  assert.equal(pickPlace([dublinIE, dublinUS], "Dublin")?.label, "Dublin, Ireland");
  assert.equal(pickPlace([dublinIE, dublinUS], "Dublin, Ohio")?.label, "Dublin, United States");
  assert.equal(pickPlace([dublinIE, dublinUS], "dublin, usa")?.label, "Dublin, United States");
  assert.equal(pickPlace([londonCA, londonGB], "London, UK")?.label, "London, United Kingdom");
  assert.deepEqual(pickPlace([dublinIE], "Dublin, Ireland"), { label: "Dublin, Ireland", latitude: 53.33, longitude: -6.25 });
  // Nothing found, or nothing usable.
  assert.equal(pickPlace([], "Nowhere"), null);
  assert.equal(pickPlace([{ name: "Broken" }], "Broken"), null);
});

// Two days of hourly forecast, as Open-Meteo sends it.
function sample(): ForecastResponse {
  const time: string[] = [];
  for (const date of ["2026-11-02", "2026-11-03"]) for (let h = 0; h < 24; h++) time.push(`${date}T${String(h).padStart(2, "0")}:00`);
  const each = <T>(f: (i: number) => T) => time.map((_, i) => f(i));
  return forecastResponse.parse({
    latitude: 41.1,
    longitude: 1.16,
    timezone: "Europe/Madrid",
    current: { time: "2026-11-02T14:15", interval: 900, temperature_2m: 19.4, weather_code: 2, is_day: 1, wind_speed_10m: 12 },
    hourly: {
      time,
      temperature_2m: each((i) => (i === 47 ? null : 10 + (i % 24) / 2)),
      precipitation_probability: each((i) => (i % 24 === 15 ? 80 : null)),
      precipitation: each((i) => (i % 24 === 15 ? 2.4 : 0)),
      weather_code: each((i) => (i % 24 === 15 ? 95 : 1)),
      wind_speed_10m: each(() => 14),
      wind_gusts_10m: each(() => 30),
      is_day: each((i) => (i % 24 >= 8 && i % 24 < 19 ? 1 : 0)),
    },
    daily: {
      time: ["2026-11-02", "2026-11-03", "2026-11-04"],
      weather_code: [95, 1, 3],
      temperature_2m_max: [21.5, 20, null],
      temperature_2m_min: [11, 10, null],
      precipitation_probability_max: [80, null, 5],
      sunrise: ["2026-11-02T07:59", "2026-11-03T08:00", null],
      sunset: ["2026-11-02T18:11", "2026-11-03T18:10", null],
      wind_speed_10m_max: [20, 18, 9],
    },
  });
}

test("groups the forecast by day, in local time", () => {
  const f = shapeForecast(sample(), new Date("2026-11-02T13:20:00Z"));
  assert.equal(f.fetchedAt, "2026-11-02T13:20:00.000Z");
  assert.deepEqual(f.now, { date: "2026-11-02", time: "14:15", temp: 19.4, code: 2, isDay: true, wind: 12 });
  // A day without temperatures is left out.
  assert.deepEqual(
    f.days.map((d) => d.date),
    ["2026-11-02", "2026-11-03"],
  );
  const [mon, tue] = f.days;
  assert.equal(mon.hours.length, 24);
  assert.equal(tue.hours.length, 23, "the hour with no temperature is left out");
  assert.deepEqual(mon.hours[15], { time: "15:00", temp: 17.5, code: 95, isDay: true, rainChance: 80, rain: 2.4, wind: 14, gust: 30 });
  assert.equal(mon.hours[3].rainChance, null);
  assert.equal(mon.hours[3].isDay, false);
  assert.equal(mon.sunrise, "07:59");
  assert.equal(tue.rainChance, null);
});

test("offers the tournament's days once the forecast reaches them, else the week ahead", () => {
  const f = shapeForecast(sample(), new Date());
  const trip = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"];
  assert.deepEqual(weatherDays(f, trip, "2026-11-02"), ["2026-11-02", "2026-11-03"]);
  assert.deepEqual(weatherDays(f, trip, "2026-11-03"), ["2026-11-03"], "days gone by are dropped");
  assert.deepEqual(weatherDays(f, ["2026-12-01"], "2026-11-02"), ["2026-11-02", "2026-11-03"], "the week ahead before the forecast reaches the tournament");
  assert.equal(forecastFrom("2026-10-31"), "2026-10-16");
});

test("describes the weather in words and pictures", () => {
  assert.deepEqual(describeWeather(0), { label: "Clear", icon: "wx-sun" });
  assert.deepEqual(describeWeather(0, false), { label: "Clear", icon: "wx-moon" });
  assert.deepEqual(describeWeather(2, false), { label: "Partly cloudy", icon: "wx-cloudmoon" });
  assert.deepEqual(describeWeather(61), { label: "Light rain", icon: "wx-rain" });
  assert.deepEqual(describeWeather(95), { label: "Thunderstorm", icon: "wx-storm" });
  assert.deepEqual(describeWeather(1234), { label: "Cloudy", icon: "wx-cloud" });
});

test("shows °C or °F, km/h or mph, as each phone prefers", () => {
  assert.equal(tempIn(16, "metric"), 16);
  assert.equal(tempIn(16, "imperial"), 61);
  assert.ok(Object.is(tempIn(-0.4, "metric"), 0), "never -0°");
  assert.equal(windIn(16.1, "metric"), "16 km/h");
  assert.equal(windIn(16.1, "imperial"), "10 mph");
  assert.equal(rainIn(2.54, "imperial"), "0.10 in");
  assert.equal(rainIn(0.04, "metric"), "<0.1 mm");
});
