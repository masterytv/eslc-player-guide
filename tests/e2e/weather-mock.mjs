// A stand-in for Open-Meteo during the end-to-end tests: the same request and response shapes,
// with a predictable forecast. Every day from today: a thunderstorm from 3 PM to 5 PM, and the
// temperature at hour h is 10 + h/2 °C (16 °C at noon).
import http from "node:http";

const PORT = Number(process.env.WEATHER_MOCK_PORT ?? 3399);
const pad = (n) => String(n).padStart(2, "0");

function todayIn(timeZone) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function forecast(timeZone, days) {
  const now = todayIn(timeZone);
  const dates = Array.from({ length: days }, (_, i) => addDays(now.date, i));
  const time = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${pad(h)}:00`));
  const hour = (i) => i % 24;
  const storm = (i) => hour(i) >= 15 && hour(i) <= 17;
  return {
    latitude: 41.1,
    longitude: 1.16,
    timezone: timeZone,
    current: { time: `${now.date}T${pad(now.hour)}:00`, interval: 900, temperature_2m: 10 + now.hour / 2, weather_code: 2, is_day: 1, wind_speed_10m: 10 },
    hourly: {
      time,
      temperature_2m: time.map((_, i) => 10 + hour(i) / 2),
      precipitation_probability: time.map((_, i) => (storm(i) ? 80 : 10)),
      precipitation: time.map((_, i) => (storm(i) ? 3 : 0)),
      weather_code: time.map((_, i) => (storm(i) ? 95 : 1)),
      wind_speed_10m: time.map(() => 12),
      wind_gusts_10m: time.map(() => 25),
      is_day: time.map((_, i) => (hour(i) >= 8 && hour(i) < 19 ? 1 : 0)),
    },
    daily: {
      time: dates,
      weather_code: dates.map(() => 95),
      temperature_2m_max: dates.map(() => 21.5),
      temperature_2m_min: dates.map(() => 10),
      precipitation_probability_max: dates.map(() => 80),
      sunrise: dates.map((d) => `${d}T07:59`),
      sunset: dates.map((d) => `${d}T18:11`),
      wind_speed_10m_max: dates.map(() => 20),
    },
  };
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const send = (body, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === "/health") return send({ ok: true });
    if (url.pathname === "/v1/search") {
      if ((url.searchParams.get("name") ?? "").toLowerCase() === "nowhere") return send({ generationtime_ms: 0.1 });
      return send({ results: [{ name: "Salou", latitude: 41.0766, longitude: 1.1416, country_code: "ES", country: "Spain", admin1: "Catalonia" }] });
    }
    if (url.pathname === "/v1/forecast") {
      // WEATHER_MOCK_DAYS stretches the forecast, e.g. to see a tournament's days in screenshots.
      const days = Number(process.env.WEATHER_MOCK_DAYS ?? url.searchParams.get("forecast_days") ?? 16);
      return send(forecast(url.searchParams.get("timezone") ?? "UTC", days));
    }
    send({ error: true, reason: "Not found" }, 404);
  })
  .listen(PORT, "127.0.0.1");
