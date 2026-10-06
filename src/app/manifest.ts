import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // The same app on the home screen from one tournament to the next.
    name: "Ireland Lacrosse Player Guide",
    short_name: "Player Guide",
    description: "The Ireland Lacrosse player guide: schedule, team, venue and travel for each tournament.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f4f8",
    theme_color: "#1a2744",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
