import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "খাঁটি বাড়ি — প্রাকৃতিক ও নির্ভেজাল খাদ্যের বিশ্বস্ত প্রতিষ্ঠান",
    short_name: "খাঁটি বাড়ি",
    description:
      "খাঁটি মধু, রাজশাহীর মিষ্টি আম ও ঐতিহ্যবাহী খেজুরের গুড়ের বিশ্বস্ত অনলাইন শপ।",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064e3b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
