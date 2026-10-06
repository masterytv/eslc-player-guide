// Keeps the last copy of the guide on the phone, so it opens at once and still works with no signal.
// Pages: the saved copy straight away while a fresh one downloads; the page then swaps in the
// fresh content itself (src/components/Freshness.tsx). Static files and photos: saved copy first.
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
// How long to wait for the network before showing a nearby saved page instead.
const SLOW_MS = 4000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== PAGES && key !== ASSETS) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

const skip = (url) =>
  url.pathname.startsWith("/api/") ||
  url.pathname.startsWith("/admin") ||
  url.pathname.startsWith("/login") ||
  url.pathname.startsWith("/cal/");

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/img/") ||
  url.pathname.startsWith("/seed/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname === "/crest.png";

const pageKey = (url) => url.pathname + url.search;

// Fresh copies still downloading, by page, so a page reloaded meanwhile waits for it.
const downloading = new Map();

async function savePage(url, res) {
  // A redirect means the login has lapsed: never store the login page as the guide.
  if (!res.ok || res.redirected || res.type === "opaqueredirect") return;
  const headers = new Headers(res.headers);
  headers.set("x-saved-at", String(Date.now()));
  const body = await res.arrayBuffer();
  const cache = await caches.open(PAGES);
  await cache.put(pageKey(url), new Response(body, { status: res.status, statusText: res.statusText, headers }));
}

/** Marks a page answered from the saved copy, with when it was saved, so it can refresh itself. */
async function asSavedCopy(res) {
  const at = Number(res.headers.get("x-saved-at")) || 0;
  const html = await res.text();
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(html.replace(/<html\b/i, `<html data-saved-copy="${at}"`), {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

const slow = () => new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), SLOW_MS));

async function openPage(event) {
  const url = new URL(event.request.url);
  const key = pageKey(url);
  const cache = await caches.open(PAGES);

  // Reloaded while the fresh copy is still on its way (e.g. right after the app updated): wait for it.
  const pending = downloading.get(key);
  if (pending) {
    await Promise.race([pending, slow()]).catch(() => undefined);
    const fresh = await cache.match(key);
    if (fresh && Date.now() - (Number(fresh.headers.get("x-saved-at")) || 0) < 15_000) return fresh;
  }

  const network = fetch(event.request);
  const saving = network.then((res) => savePage(url, res.clone())).catch(() => undefined);
  downloading.set(key, saving);
  saving.finally(() => {
    if (downloading.get(key) === saving) downloading.delete(key);
  });
  event.waitUntil(saving);

  const saved = await cache.match(key);
  if (saved) {
    network.catch(() => undefined);
    return asSavedCopy(saved);
  }
  // Never opened this exact page: wait for it, but show a nearby saved page if the signal is too weak.
  try {
    return await Promise.race([network, slow()]);
  } catch {
    const near = (await cache.match(url.pathname)) || (await cache.match("/"));
    if (near) return asSavedCopy(near);
    return network;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || skip(url)) return;
  if (request.mode === "navigate") {
    event.respondWith(openPage(event));
    return;
  }
  // In-app navigation data: when it fails offline, Next.js falls back to a full
  // page load, which the navigate handler above serves from the saved copy.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  if (isAsset(url)) event.respondWith(cacheFirst(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "warm" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    Promise.all(
      event.data.urls.map(async (path) => {
        try {
          const url = new URL(path, self.location.origin);
          const res = await fetch(url, { credentials: "same-origin" });
          await savePage(url, res);
        } catch {
          // offline right now: try again next time the app opens
        }
      }),
    ),
  );
});
