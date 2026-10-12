import { unstable_cache } from "next/cache";
import type { Guide } from "./schema";
import { forecastResponse, geocodeResponse, pickPlace, shapeForecast, type Forecast, type Place } from "./weather-data";

// Fetches the forecast for the tournament from Open-Meteo: free, no account, and allowed for a
// non-commercial team guide as long as the page credits it. The tests point these elsewhere.
const FORECAST_URL = process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = process.env.OPEN_METEO_GEOCODE_URL || "https://geocoding-api.open-meteo.com/v1/search";
const TIMEOUT_MS = 5000;

export type Weather =
  | { status: "ok"; place: Place; forecast: Forecast }
  /** The tournament has no location to look up. */
  | { status: "no-place" }
  /** Nothing on the map matched what staff typed. */
  | { status: "not-found"; query: string }
  /** The forecast service couldn't be reached; the page says to try again later. */
  | { status: "unavailable"; query: string };

/** What staff set as the weather town, else the tournament's location. */
export function weatherQuery(event: Guide["event"]): string {
  return (event.weatherPlace || event.location).trim();
}

async function getJson(url: URL): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`${url.host} answered ${res.status}`);
  return res.json();
}

// A place doesn't move: look it up once a week. Not finding it is kept too (as null), so a typo
// doesn't send a request on every page load; correcting it is a new lookup.
const geocode = unstable_cache(
  async (query: string): Promise<Place | null> => {
    const name = query.split(",")[0].trim();
    if (name.length < 2) return null;
    const url = new URL(GEOCODE_URL);
    url.search = new URLSearchParams({ name, count: "10", language: "en", format: "json" }).toString();
    const parsed = geocodeResponse.parse(await getJson(url));
    return pickPlace(parsed.results ?? [], query);
  },
  ["weather-geocode-v1"],
  { revalidate: 7 * 24 * 3600 },
);

// Forecasts change through the day; half an hour old is fresh enough and keeps requests rare.
const forecastFor = unstable_cache(
  async (latitude: number, longitude: number, timeZone: string): Promise<Forecast> => {
    const url = new URL(FORECAST_URL);
    url.search = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: timeZone,
      forecast_days: "16",
      hourly: "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max",
      current: "temperature_2m,weather_code,is_day,wind_speed_10m",
    }).toString();
    return shapeForecast(forecastResponse.parse(await getJson(url)), new Date());
  },
  ["weather-forecast-v1"],
  { revalidate: 1800 },
);

/** The tournament's forecast. Never throws: a failure becomes a status the page explains. */
export async function loadWeather(event: Guide["event"]): Promise<Weather> {
  const query = weatherQuery(event);
  if (!query) return { status: "no-place" };
  try {
    const place = await geocode(query.toLowerCase());
    if (!place) return { status: "not-found", query };
    const forecast = await forecastFor(place.latitude, place.longitude, event.timeZone);
    return { status: "ok", place, forecast };
  } catch (err) {
    console.warn(`Weather for "${query}" is unavailable:`, err instanceof Error ? err.message : err);
    return { status: "unavailable", query };
  }
}
