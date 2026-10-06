"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export interface MapImage {
  id: string;
  title: string;
  src: string;
}

/** Map thumbnails that open full screen; tap the map to zoom, pinch works too. */
export function MapTiles({ maps }: { maps: MapImage[] }) {
  const [open, setOpen] = useState<MapImage | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!maps.length) return null;
  return (
    <>
      <div className="tiles">
        {maps.map((m) => (
          <button
            key={m.id}
            className="tile"
            onClick={() => {
              setZoom(false);
              setOpen(m);
            }}
          >
            <span className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.title} loading="lazy" />
            </span>
            <b>
              {m.title}
              <Icon name="chev" size="sm" />
            </b>
          </button>
        ))}
      </div>
      {open ? (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={open.title}>
          <div className="viewer-bar">
            <b>{open.title}</b>
            <button onClick={() => setOpen(null)} autoFocus>
              Close
            </button>
          </div>
          <div className="viewer-scroll">
            <button className="zoom-btn" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Zoom out" : "Zoom in"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.src} alt={open.title} className={zoom ? "zoom" : undefined} />
            </button>
          </div>
          <p className="viewer-hint">Tap the map to zoom in or out</p>
        </div>
      ) : null}
    </>
  );
}
