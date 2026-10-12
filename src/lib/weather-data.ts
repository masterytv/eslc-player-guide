import { z } from "zod";
import { addDays } from "./time";

// The weather forecast, shaped for the guide. Client-safe: no server imports.
// Forecasts come from Open-Meteo (open-meteo.com), in the tournament's local time.

export interface WeatherHour {
  /** "14:00", local time where the tournament is. */
  time: string;
  temp: number;
  code: number;
  isDay: boolean;
  /** 0–100, or null when the forecast doesn't say. */
  rainChance: number | null;
  /** Millimetres in that hour. */
  rain: number;
  /** km/h */
  wind: number;
  gust: number;
}

export interface WeatherDay {
  date: string;
  code: number;
  max: number;
  min: number;
  rainChance: number | null;
  /** "08:03", local time. */
  sunrise: string;
  sunset: string;
  /** km/h */
  windMax: number;
  hours: WeatherHour[];
}

export interface Forecast {
  days: WeatherDay[];
  now: { date: string; time: string; temp: number; code: number; isDay: boolean; wind: number } | null;
  /** When it was fetched (ISO). */
  fetchedAt: string;
}

export interface Place {
  /** "Salou, Spain" */
  label: string;
  latitude: number;
  longitude: number;
}

/* ---------- where ---------- */

// Countries people tend to write differently from the geocoder's names.
const COUNTRY_ALIASES: Record<string, string> = {
  uk: "gb",
  "united kingdom": "gb",
  "great britain": "gb",
  england: "gb",
  scotland: "gb",
  wales: "gb",
  "northern ireland": "gb",
  usa: "us",
  "united states": "us",
  "united states of america": "us",
};

/** "Salou, Spain" → the town to look up and the words that narrow it down. */
export function parsePlace(place: string): { name: string; hints: string[] } {
  const [name = "", ...rest] = place
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return { name, hints: rest.map((h) => h.toLowerCase()) };
}

const geoResult = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
});
type GeoResult = z.infer<typeof geoResult>;
export const geocodeResponse = z.object({ results: z.array(z.unknown()).optional() });

/**
 * The geocoder's best match for what staff typed: one in the country they named if there is
 * one ("Dublin, Ireland" over Dublin, Ohio), else the most likely (the geocoder lists bigger
 * places first). Null if nothing matched.
 */
export function pickPlace(raw: unknown[], place: string): Place | null {
  const results = raw.map((r) => geoResult.safeParse(r)).flatMap((r) => (r.success ? [r.data] : []));
  if (!results.length) return null;
  const { hints } = parsePlace(place);
  const score = (r: GeoResult) =>
    hints.reduce((s, h) => {
      const code = COUNTRY_ALIASES[h] ?? h;
      if (r.country?.toLowerCase() === h || r.country_code?.toLowerCase() === code) return s + 2;
      if (r.admin1?.toLowerCase() === h || r.admin2?.toLowerCase() === h) return s + 1;
      return s;
    }, 0);
  const best = results.reduce((a, b) => (score(b) > score(a) ? b : a));
  return {
    label: [best.name, best.country].filter(Boolean).join(", "),
    latitude: best.latitude,
    longitude: best.longitude,
  };
}

/* ---------- the forecast ---------- */

const num = z.number();
const nums = z.array(num.nullable());
export const forecastResponse = z.object({
  current: z
    .object({ time: z.string(), temperature_2m: num, weather_code: num, is_day: num, wind_speed_10m: num })
    .optional(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: nums,
    precipitation_probability: nums,
    precipitation: nums,
    weather_code: nums,
    wind_speed_10m: nums,
    wind_gusts_10m: nums,
    is_day: nums,
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: nums,
    temperature_2m_max: nums,
    temperature_2m_min: nums,
    precipitation_probability_max: nums,
    sunrise: z.array(z.string().nullable()),
    sunset: z.array(z.string().nullable()),
    wind_speed_10m_max: nums,
  }),
});
export type ForecastResponse = z.infer<typeof forecastResponse>;

const clockOf = (iso: string | null | undefined) => (iso ? iso.slice(11, 16) : "");

/** Open-Meteo's columns, regrouped by day. Days and hours with no temperature are left out. */
export function shapeForecast(r: ForecastResponse, fetchedAt: Date): Forecast {
  const hoursByDay = new Map<string, WeatherHour[]>();
  r.hourly.time.forEach((t, i) => {
    const temp = r.hourly.temperature_2m[i];
    if (temp == null) return;
    const date = t.slice(0, 10);
    const list = hoursByDay.get(date) ?? [];
    list.push({
      time: clockOf(t),
      temp,
      code: r.hourly.weather_code[i] ?? 0,
      isDay: r.hourly.is_day[i] !== 0,
      rainChance: r.hourly.precipitation_probability[i] ?? null,
      rain: r.hourly.precipitation[i] ?? 0,
      wind: r.hourly.wind_speed_10m[i] ?? 0,
      gust: r.hourly.wind_gusts_10m[i] ?? 0,
    });
    hoursByDay.set(date, list);
  });

  const d = r.daily;
  const days: WeatherDay[] = [];
  d.time.forEach((date, i) => {
    const max = d.temperature_2m_max[i];
    const min = d.temperature_2m_min[i];
    if (max == null || min == null) return;
    days.push({
      date,
      code: d.weather_code[i] ?? 0,
      max,
      min,
      rainChance: d.precipitation_probability_max[i] ?? null,
      sunrise: clockOf(d.sunrise[i]),
      sunset: clockOf(d.sunset[i]),
      windMax: d.wind_speed_10m_max[i] ?? 0,
      hours: hoursByDay.get(date) ?? [],
    });
  });

  const c = r.current;
  return {
    days,
    now: c
      ? { date: c.time.slice(0, 10), time: clockOf(c.time), temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day !== 0, wind: c.wind_speed_10m }
      : null,
    fetchedAt: fetchedAt.toISOString(),
  };
}

/** How far ahead forecasts reach, roughly: a day further out shows up this many days before. */
export const FORECAST_DAYS = 16;

/** The day a forecast for `date` should first appear. */
export function forecastFrom(date: string): string {
  return addDays(date, -(FORECAST_DAYS - 1));
}

/**
 * The days the weather page offers: the tournament's days that have a forecast, or, before the
 * forecast reaches them (or after the tournament), the coming days from today.
 */
export function weatherDays(forecast: Forecast, tripDays: string[], today: string): string[] {
  const upcoming = forecast.days.map((d) => d.date).filter((d) => d >= today);
  const trip = upcoming.filter((d) => tripDays.includes(d));
  return trip.length ? trip : upcoming.slice(0, 10);
}

/* ---------- describing it ---------- */

export type WeatherIconName = "wx-sun" | "wx-moon" | "wx-cloudsun" | "wx-cloudmoon" | "wx-cloud" | "wx-fog" | "wx-rain" | "wx-snow" | "wx-storm";

// WMO weather codes, as Open-Meteo reports them.
const CODES: Record<number, [label: string, icon: WeatherIconName | "clear" | "partly"]> = {
  0: ["Clear", "clear"],
  1: ["Mostly clear", "clear"],
  2: ["Partly cloudy", "partly"],
  3: ["Cloudy", "wx-cloud"],
  45: ["Fog", "wx-fog"],
  48: ["Freezing fog", "wx-fog"],
  51: ["Light drizzle", "wx-rain"],
  53: ["Drizzle", "wx-rain"],
  55: ["Heavy drizzle", "wx-rain"],
  56: ["Freezing drizzle", "wx-rain"],
  57: ["Freezing drizzle", "wx-rain"],
  61: ["Light rain", "wx-rain"],
  63: ["Rain", "wx-rain"],
  65: ["Heavy rain", "wx-rain"],
  66: ["Freezing rain", "wx-rain"],
  67: ["Freezing rain", "wx-rain"],
  71: ["Light snow", "wx-snow"],
  73: ["Snow", "wx-snow"],
  75: ["Heavy snow", "wx-snow"],
  77: ["Snow grains", "wx-snow"],
  80: ["Light showers", "wx-rain"],
  81: ["Showers", "wx-rain"],
  82: ["Heavy showers", "wx-rain"],
  85: ["Snow showers", "wx-snow"],
  86: ["Heavy snow showers", "wx-snow"],
  95: ["Thunderstorm", "wx-storm"],
  96: ["Thunderstorm with hail", "wx-storm"],
  99: ["Thunderstorm with hail", "wx-storm"],
};

/** "Light rain" and its icon; clear and partly cloudy skies show the moon at night. */
export function describeWeather(code: number, isDay = true): { label: string; icon: WeatherIconName } {
  const [label, icon] = CODES[code] ?? ["Cloudy", "wx-cloud"];
  if (icon === "clear") return { label, icon: isDay ? "wx-sun" : "wx-moon" };
  if (icon === "partly") return { label, icon: isDay ? "wx-cloudsun" : "wx-cloudmoon" };
  return { label, icon };
}

/* ---------- units ---------- */

export type Units = "metric" | "imperial";

export function tempIn(c: number, units: Units): number {
  // `|| 0` so -0.4° shows as 0°, not -0°.
  return Math.round(units === "imperial" ? (c * 9) / 5 + 32 : c) || 0;
}

export function windIn(kmh: number, units: Units): string {
  return units === "imperial" ? `${Math.round(kmh / 1.609344)} mph` : `${Math.round(kmh)} km/h`;
}

export function rainIn(mm: number, units: Units): string {
  if (units === "imperial") {
    const inches = mm / 25.4;
    return `${inches < 0.01 ? "<0.01" : inches.toFixed(2)} in`;
  }
  return `${mm < 0.1 ? "<0.1" : mm.toFixed(1)} mm`;
}
