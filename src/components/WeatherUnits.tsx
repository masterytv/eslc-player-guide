"use client";

import { useState, useSyncExternalStore } from "react";
import { rainIn, tempIn, windIn, type Units } from "@/lib/weather-data";
import { useOnline, useStoredString } from "./hooks";
import { Icon } from "./Icon";

// °C or °F is a choice each phone keeps. Until someone picks, phones set to US English get °F.
const UNITS_KEY = "guide:units";
const noSubscribe = () => () => {};

export function useUnits(): [Units, (u: Units) => void] {
  const [stored, setStored] = useStoredString(UNITS_KEY);
  const local = useSyncExternalStore<Units>(
    noSubscribe,
    () => (navigator.language === "en-US" ? "imperial" : "metric"),
    () => "metric",
  );
  const units: Units = stored === "metric" || stored === "imperial" ? stored : local;
  return [units, setStored];
}

/** "21°" in the phone's chosen unit. */
export function Temp({ c }: { c: number }) {
  const [units] = useUnits();
  return <>{tempIn(c, units)}°</>;
}

export function Wind({ kmh }: { kmh: number }) {
  const [units] = useUnits();
  return <>{windIn(kmh, units)}</>;
}

export function RainAmount({ mm }: { mm: number }) {
  const [units] = useUnits();
  return <>{rainIn(mm, units)}</>;
}

export function UnitToggle() {
  const [units, setUnits] = useUnits();
  return (
    <div className="seg wx-units" role="group" aria-label="Temperature unit">
      <button type="button" aria-pressed={units === "metric"} onClick={() => setUnits("metric")}>
        °C
      </button>
      <button type="button" aria-pressed={units === "imperial"} onClick={() => setUnits("imperial")}>
        °F
      </button>
    </div>
  );
}

type MapLayer = "forecast" | "radar";

/**
 * Windy.com's rain map around the venue: the forecast (rain, thunder and wind, with a timeline to
 * play), or the radar, which only shows rain that's falling now and so is empty on a dry day.
 * Loaded on request: it's heavy on a phone plan abroad.
 */
export function RainMap({ latitude, longitude, town }: { latitude: number; longitude: number; town: string }) {
  const [shown, setShown] = useState(false);
  const [layer, setLayer] = useState<MapLayer>("forecast");
  const [units] = useUnits();
  const online = useOnline();

  if (!shown) {
    return (
      <>
        <button type="button" className="btn wx-radar-btn" onClick={() => setShown(true)} disabled={!online}>
          <Icon name="radar" />
          {online ? "Show the rain map" : "The rain map needs signal"}
        </button>
        <p className="meta">The rain forecast and live radar around {town}, from Windy.com.</p>
      </>
    );
  }

  const imperial = units === "imperial";
  const radar = layer === "radar";
  const params = new URLSearchParams({
    type: "map",
    location: "coordinates",
    lat: latitude.toFixed(3),
    lon: longitude.toFixed(3),
    detailLat: latitude.toFixed(3),
    detailLon: longitude.toFixed(3),
    zoom: "8",
    overlay: radar ? "radar" : "rain",
    product: radar ? "radar" : "ecmwf",
    level: "surface",
    marker: "true",
    metricTemp: imperial ? "°F" : "°C",
    metricWind: imperial ? "mph" : "km/h",
    metricRain: imperial ? "in" : "mm",
  });
  return (
    <>
      <div className="seg wx-layers" role="group" aria-label="Map shows">
        <button type="button" aria-pressed={!radar} onClick={() => setLayer("forecast")}>
          Rain forecast
        </button>
        <button type="button" aria-pressed={radar} onClick={() => setLayer("radar")}>
          Radar: rain now
        </button>
      </div>
      <iframe
        className="wx-radar"
        title={radar ? "Rain radar" : "Rain forecast map"}
        src={`https://embed.windy.com/embed.html?${params}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <p className="meta">
        {radar
          ? `Rain falling around ${town} now, from weather radar. Empty means it's dry right now: the forecast shows what's coming.`
          : `Rain, thunder and wind from the forecast around ${town}. Press play to see what's coming.`}
      </p>
    </>
  );
}
