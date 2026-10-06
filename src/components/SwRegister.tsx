"use client";

import { useEffect } from "react";

// Pages the service worker fetches ahead of time so the guide opens with no signal.
const WARM = ["/", "/schedule", "/team", "/venue", "/more", "/more/packing", "/more/anthem", "/more/links"];

export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    if (window.location.pathname.startsWith("/login")) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.active?.postMessage({ type: "warm", urls: WARM }))
      .catch(() => {
        // Offline support is a bonus; the guide works without it.
      });
  }, []);
  return null;
}
