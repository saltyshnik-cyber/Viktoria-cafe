import type { MetadataRoute } from "next";

// Punycode-форма домена кафе-виктория.рф — надёжнее для XML и роботов,
// чем кириллический IDN (эквивалентна ему, проверено через new URL()).
const BASE_URL = "https://xn----7sbhkraif0buus6m.xn--p1ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/menu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
