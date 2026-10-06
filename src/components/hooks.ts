"use client";

import { useCallback, useSyncExternalStore } from "react";

/* ---------- clock ---------- */

/** The current time, refreshed every `ms`. Null during server render and hydration. */
export function useNow(ms: number): number | null {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, ms);
      return () => clearInterval(t);
    },
    // Rounded so repeated reads within one tick return the same value.
    () => Math.floor(Date.now() / ms) * ms,
    () => null,
  );
}

/* ---------- connectivity ---------- */

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/* ---------- saved copy ---------- */

// public/sw.js answers from the phone's saved copy at once and marks such a page with
// data-saved-copy="<when it was saved>" on <html>. Freshness then refreshes it in place.

export interface SavedCopy {
  /** When the copy was saved (ms), or 0 if unknown. */
  at: number;
  updating: boolean;
}

let savedCopy: SavedCopy | null | undefined;
const savedListeners = new Set<() => void>();

function readSavedCopy(): SavedCopy | null {
  if (savedCopy === undefined) {
    const at = document.documentElement.dataset.savedCopy;
    savedCopy = at == null ? null : { at: Number(at) || 0, updating: false };
  }
  return savedCopy;
}

function setSavedCopy(next: SavedCopy | null): void {
  savedCopy = next;
  if (!next) delete document.documentElement.dataset.savedCopy;
  savedListeners.forEach((l) => l());
}

export function markSavedCopyUpdating(): void {
  const current = readSavedCopy();
  if (current && !current.updating) setSavedCopy({ ...current, updating: true });
}

/** The page now shows the latest content. */
export function clearSavedCopy(): void {
  if (readSavedCopy()) setSavedCopy(null);
}

/** Set while the page on screen came from the saved copy and hasn't been refreshed yet. */
export function useSavedCopy(): SavedCopy | null {
  return useSyncExternalStore(
    (cb) => {
      savedListeners.add(cb);
      return () => savedListeners.delete(cb);
    },
    readSavedCopy,
    () => null,
  );
}

/* ---------- per-phone storage ---------- */

const listeners = new Set<() => void>();
// Used when the browser refuses localStorage (some private modes): works until reload.
const memory = new Map<string, string | null>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** A string saved on this phone only. Null on the server and until set. */
export function useStoredString(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback(
    (next: string | null) => {
      try {
        if (next == null) localStorage.removeItem(key);
        else localStorage.setItem(key, next);
        memory.delete(key);
      } catch {
        memory.set(key, next);
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
