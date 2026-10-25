import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/*/admin", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/*/admin", "/api/"],
      },
      {
        userAgent: "Google-Extended", // Google Gemini / AI Overview Crawler
        allow: "/",
      },
      {
        userAgent: "GPTBot", // OpenAI ChatGPT Web Search
        allow: "/",
      },
      {
        userAgent: "PerplexityBot", // Perplexity AI Search
        allow: "/",
      },
      {
        userAgent: "ClaudeBot", // Anthropic Claude Web Search
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/*/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
