// src/app/page.tsx
import type { Metadata } from "next";
import { getOrInitTenant } from "@/app/actions";
import { getSiteUrl } from "@/lib/siteConfig";
import StorefrontClient from "./[tenantSlug]/StorefrontClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getSiteUrl();
  const title = "খাঁটি বাড়ি — প্রাকৃতিক মধু, রাজশাহীর আম ও খাঁটি গুড়ের বিশ্বস্ত প্রতিষ্ঠান";
  const description =
    "গ্রাম-বাংলার প্রাকৃতিক মৌচাক থেকে সংগৃহীত খাঁটি চাকের মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড় কিনুন সরাসরি মৌয়াল ও বাগান থেকে। সারাদেশে ক্যাশ অন ডেলিভারি।";

  return {
    metadataBase: new URL(baseUrl),
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
      "আম্রপালি",
      "খাঁটি খেজুরের গুড়",
      "khejur gur online bd",
      "পাটালি গুড়",
      "ঝোলা গুড়",
      "প্রাকৃতিক খাদ্য",
      "organic food bd",
      "খাঁটি বাড়ি",
      "khati bari",
      "khatibari",
      "khatibari.vercel.app",
    ],
    authors: [{ name: "খাঁটি বাড়ি (Khati Bari)", url: baseUrl }],
    creator: "খাঁটি বাড়ি",
    publisher: "খাঁটি বাড়ি",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: "খাঁটি বাড়ি",
      locale: "bn_BD",
      type: "website",
      images: [
        {
          url: `${baseUrl}/khati-bari-og.jpg`,
          secureUrl: `${baseUrl}/khati-bari-og.jpg`,
          width: 1376,
          height: 768,
          type: "image/jpeg",
          alt: "খাঁটি বাড়ি - প্রাকৃতিক মধু, রাজশাহীর আম ও খাঁটি গুড়",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/khati-bari-og.jpg`],
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

export default async function HomePage() {
  const tenant = await getOrInitTenant("khatibari");

  return <StorefrontClient tenant={tenant} />;
}
