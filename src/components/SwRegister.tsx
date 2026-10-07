"use client";

import { useEffect } from "react";

// Pages the service worker fetches ahead of time so the guide opens with no signal.
const WARM = ["/", "/schedule", "/team", "/venue", "/more", "/more/packing", "/more/anthem", "/more/links"];
const WARMED_KEY = "guide:warmed";
// Opening the app again within this long doesn't fetch every page again.
const WARM_EVERY_MS = 10 * 60_000;

function dueForWarming(): boolean {
  try {
    if (Date.now() - Number(localStorage.getItem(WARMED_KEY) ?? 0) < WARM_EVERY_MS) return false;
    localStorage.setItem(WARMED_KEY, String(Date.now()));
  } catch {
    // storage blocked: warm anyway
  }
  return true;
}

const enabled = () => process.env.NODE_ENV === "production" && "serviceWorker" in navigator;

export function SwRegister() {
  useEffect(() => {
    if (!enabled() || window.location.pathname.startsWith("/login")) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Offline support is a bonus; the guide works without it.
    });
  }, []);
  return null;
}

/** Saves the guide's pages on the phone ahead of time: the fixed ones, plus `pages` (pages staff added, the game plan). */
export function WarmPages({ pages }: { pages: string[] }) {
  const extra = pages.join("\n");
  useEffect(() => {
    if (!enabled()) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        if (dueForWarming()) reg.active?.postMessage({ type: "warm", urls: [...WARM, ...extra.split("\n").filter(Boolean)] });
      })
      .catch(() => {
        // no service worker: nothing to save into
      });
  }, [extra]);
  return null;
}
