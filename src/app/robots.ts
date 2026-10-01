import type { MetadataRoute } from "next";

const BASE_URL = "https://xn----7sbhkraif0buus6m.xn--p1ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
