import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/home", "/discover", "/members", "/connections", "/invitations", "/messages", "/profile", "/settings", "/onboarding", "/admin", "/api", "/auth"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
