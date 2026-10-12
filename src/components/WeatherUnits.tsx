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

/** A live rain radar map around the venue. Loaded on request: it's heavy on a phone plan abroad. */
export function RadarMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [shown, setShown] = useState(false);
  const [units] = useUnits();
  const online = useOnline();

  if (!shown) {
    return (
      <button type="button" className="btn wx-radar-btn" onClick={() => setShown(true)} disabled={!online}>
        <Icon name="radar" />
        {online ? "Show the rain radar" : "The radar needs signal"}
      </button>
    );
  }

  const imperial = units === "imperial";
  const params = new URLSearchParams({
    type: "map",
    location: "coordinates",
    lat: latitude.toFixed(3),
    lon: longitude.toFixed(3),
    detailLat: latitude.toFixed(3),
    detailLon: longitude.toFixed(3),
    zoom: "8",
    overlay: "radar",
    product: "radar",
    level: "surface",
    marker: "true",
    metricTemp: imperial ? "°F" : "°C",
    metricWind: imperial ? "mph" : "km/h",
    metricRain: imperial ? "in" : "mm",
  });
  return (
    <iframe
      className="wx-radar"
      title="Rain radar"
      src={`https://embed.windy.com/embed.html?${params}`}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
