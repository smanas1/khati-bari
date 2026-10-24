import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khatibari.smanas.net";

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
