import type { Metadata } from "next";
import { Hind_Siliguri, Geist_Mono } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://khatibari.vercel.app"),
  title: "খাঁটি বাড়ি (Khati Bari) - খাঁটি প্রাকৃতিক মধু, রাজশাহীর আম ও খাঁটি গুড়",
  description:
    "গ্রাম-বাংলার প্রাকৃতিক মৌচাক থেকে সংগৃহীত খাঁটি চাকের মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড়ের বিশ্বস্ত প্রতিষ্ঠান। সারাদেশে ক্যাশ অন ডেলিভারি।",
  openGraph: {
    title: "খাঁটি বাড়ি — খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি গুড়ের বিশ্বস্ত প্রতিষ্ঠান",
    description:
      "গ্রাম-বাংলার প্রাকৃতিক মৌচাক থেকে সংগৃহীত খাঁটি চাকের মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড় সরাসরি বাগান ও মৌয়াল থেকে। সারাদেশে ক্যাশ অন ডেলিভারি।",
    url: "https://khatibari.vercel.app",
    siteName: "খাঁটি বাড়ি",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1376,
        height: 768,
        type: "image/jpeg",
        alt: "খাঁটি বাড়ি - প্রাকৃতিক খাদ্য উপাদান",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "খাঁটি বাড়ি — খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি গুড়ের বিশ্বস্ত প্রতিষ্ঠান",
    description:
      "গ্রাম-বাংলার প্রাকৃতিক মৌচাক থেকে সংগৃহীত খাঁটি চাকের মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড় সরাসরি বাগান ও মৌয়াল থেকে। সারাদেশে ক্যাশ অন ডেলিভারি।",
    images: ["/og-image.jpg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${hindSiliguri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
