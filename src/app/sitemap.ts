import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khatibari.smanas.net";
  const now = new Date();

  // Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      images: [
        `${baseUrl}/products/honey.jpg`,
        `${baseUrl}/products/mango.jpg`,
        `${baseUrl}/products/gur.jpg`,
      ],
    },
  ];

  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        products: true,
      },
    });

    const invalidSlugs = new Set(["admin", "api", "favicon.ico", "favicon.png", "icon.png", "icon.svg", "apple-icon.png", "manifest.webmanifest", "image"]);
    for (const tenant of tenants) {
      if (
        !tenant.slug ||
        invalidSlugs.has(tenant.slug) ||
        tenant.slug.includes(".") ||
        tenant.slug.includes("\\") ||
        tenant.slug.includes("/")
      ) {
        continue;
      }

      routes.push({
        url: `${baseUrl}/${tenant.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
        images: tenant.products.map((p) =>
          p.image?.startsWith("http") ? p.image : `${baseUrl}${p.image || "/og-image.jpg"}`
        ),
      });
    }
  } catch (err) {
    // Fallback if DB is warming up
    routes.push({
      url: `${baseUrl}/khatibari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  return routes;
}
