import type { MetadataRoute } from "next";

const BASE_URL = "https://www.umnosiswa.my";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/daftar", "/privacy"],
      disallow: [
        "/admin/",
        "/api/",
        "/dashboard/",
        "/login/",
        "/portal/",
        "/verify/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
