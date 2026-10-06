import type { MetadataRoute } from "next";

// The guide is for the team only.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
