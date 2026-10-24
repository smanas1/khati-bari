// src/app/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { getOrInitTenant } from "@/app/actions";
import StorefrontClient from "./StorefrontClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getOrInitTenant(tenantSlug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khatibari.smanas.net";
  const canonicalUrl =
    tenantSlug === "khatibari" || tenantSlug === "khati-bari" || tenantSlug === "khati-shombhar"
      ? baseUrl
      : `${baseUrl}/${tenantSlug}`;

  const title = `${tenant.name} — প্রাকৃতিক মধু, রাজশাহীর আম ও খাঁটি গুড়`;
  const description =
    tenant.tagline ||
    "গ্রাম-বাংলার প্রাকৃতিক মৌচাক থেকে সংগৃহীত খাঁটি চাকের মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড়ের বিশ্বস্ত প্রতিষ্ঠান। সারাদেশে ক্যাশ অন ডেলিভারি।";
  const shareImage = tenant.products[0]?.image || "/og-image.jpg";

  return {
    title,
    description,
    keywords: [
      "খাঁটি মধু",
      "প্রাকৃতিক মধু",
      "প্রাকৃতিক চাকের মধু",
      "চাকের খাঁটি মধু",
      "raw honey bangladesh",
      "pure honey bangladesh",
      "গ্রামের খাঁটি মধু",
      "চাক ভাঙা মধু",
      "রাজশাহীর আম",
      "rajshahi mango online",
      "হিমসাগর আম",
      "ল্যাংড়া আম",
      "খাঁটি খেজুরের গুড়",
      "khejur gur online bd",
      "পাটালি গুড়",
      "প্রাকৃতিক খাদ্য",
      "organic food bd",
      tenant.name,
      "khatibari",
      "khati bari",
      "khatibari.smanas.net",
    ],
    authors: [{ name: tenant.name, url: canonicalUrl }],
    creator: tenant.name,
    publisher: tenant.name,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "bn_BD",
      siteName: tenant.name,
      images: [
        {
          url: shareImage.startsWith("http") ? shareImage : `${baseUrl}${shareImage}`,
          width: 1376,
          height: 768,
          alt: `${tenant.name} — প্রাকৃতিক খাদ্যোপাদান`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage.startsWith("http") ? shareImage : `${baseUrl}${shareImage}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function TenantStorePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getOrInitTenant(tenantSlug);

  return <StorefrontClient tenant={tenant} />;
}
