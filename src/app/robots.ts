import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/mockups", "/invite/"],
      },
    ],
    sitemap: "https://withsempre.com/sitemap.xml",
  };
}
