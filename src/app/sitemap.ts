import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1 },
    { path: "/philosophy", priority: 0.8 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/membership", priority: 0.8 },
    { path: "/apply", priority: 0.9 },
    { path: "/contact", priority: 0.5 },
    { path: "/application-status", priority: 0.3 },
    { path: "/sign-in", priority: 0.3 },
  ];
  return pages.map((p) => ({ url: siteUrl(p.path), changeFrequency: "monthly", priority: p.priority }));
}
