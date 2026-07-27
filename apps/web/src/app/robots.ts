import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://edustepnow.com/sitemap.xml",
    host: "https://edustepnow.com",
  };
}
