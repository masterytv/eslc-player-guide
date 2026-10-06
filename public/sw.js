// Keeps the last copy of the guide on the phone for when there's no signal.
// Pages: network first, falling back to the saved copy. Static files and photos: saved copy first.
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

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

async function savePage(url, res) {
  // A redirect means the login has lapsed: never store the login page as the guide.
  if (!res.ok || res.redirected || res.type === "opaqueredirect") return;
  const cache = await caches.open(PAGES);
  await cache.put(pageKey(url), res);
}

async function networkFirst(request) {
  const url = new URL(request.url);
  try {
    const res = await fetch(request);
    savePage(url, res.clone());
    return res;
  } catch (err) {
    const cache = await caches.open(PAGES);
    const hit = (await cache.match(pageKey(url))) || (await cache.match(url.pathname)) || (await cache.match("/"));
    if (hit) return hit;
    throw err;
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
    event.respondWith(networkFirst(request));
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
