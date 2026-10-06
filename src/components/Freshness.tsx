"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { clearSavedCopy, markSavedCopyUpdating, useSavedCopy } from "./hooks";

// After a refresh that failed (and reloaded the page from the saved copy), wait this long before trying again.
const RETRY_MS = 15_000;
// Coming back to the app after this long (phones keep it open for days) checks for changes.
const RESUME_MS = 5 * 60_000;
const ATTEMPT_KEY = "guide:refreshing";

/**
 * Keeps the page on screen current without making anyone wait for it: a page opened from the
 * saved copy, or reopened after a while, fetches the latest content and swaps it in place.
 * `renderedAt` changes whenever the server renders the layout again, i.e. when a refresh lands.
 */
export function Freshness({ renderedAt }: { renderedAt: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useSavedCopy();
  // When the refresh under way started (0 = none). One that never lands stops blocking after a minute.
  const refreshing = useRef(0);
  const shownAt = useRef(0);

  const refresh = useCallback(() => {
    if (!navigator.onLine || Date.now() - refreshing.current < 60_000) return;
    // If refreshing this page failed and reloaded it from the saved copy, wait for the next
    // chance (signal coming back, reopening the app) rather than trying again in a loop.
    const here = window.location.href;
    try {
      const last = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? "null");
      if (last?.url === here && Date.now() - last.at < RETRY_MS) return;
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ url: here, at: Date.now() }));
    } catch {
      // private mode: refresh anyway
    }
    refreshing.current = Date.now();
    shownAt.current = Date.now();
    markSavedCopyUpdating();
    router.refresh();
  }, [router]);

  // In-app navigation always renders the latest content.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    if (!refreshing.current) return;
    refreshing.current = 0;
    try {
      sessionStorage.removeItem(ATTEMPT_KEY);
    } catch {
      // nothing stored
    }
    clearSavedCopy();
  }, [renderedAt]);

  useEffect(() => {
    if (!saved || saved.updating) return;
    refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, [saved, refresh]);

  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === "visible" && Date.now() - shownAt.current > RESUME_MS) refresh();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [refresh]);

  return null;
}
