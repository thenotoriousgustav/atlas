import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cabinety.space"
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cabinet/", "/share/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
