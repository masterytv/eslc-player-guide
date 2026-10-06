import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ESLC 2026 Player Guide",
    short_name: "ESLC Guide",
    description: "Ireland Sixes Lacrosse player guide for ESLC 2026.",
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
