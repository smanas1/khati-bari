// src/lib/siteConfig.ts

/**
 * Returns the reliable canonical base URL for the site.
 * Filters out unconfigured or broken domains (such as smanas.net) and ensures
 * that Vercel or custom production domains are properly used for OpenGraph and SEO.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !envUrl.includes("smanas.net")) {
    return envUrl.replace(/\/$/, "");
  }
  return "https://khatibari.vercel.app";
}
