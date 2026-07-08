import type { MetadataRoute } from "next"

// PWA manifest — Next.js native convention (Turbopack-д аюулгүй, bundler plugin
// шаардахгүй). /manifest.webmanifest хаягаар автоматаар serve хийгдэж,
// <link rel="manifest"> нь layout-д автоматаар нэмэгдэнэ.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Horom — Хүүхдийн өсөлтийн дурсамж",
    short_name: "Horom",
    description:
      "Хүүхдийнхээ өдөр тутмын өсөлтийг зургаар хадгалж, гайхалтай timelapse дурсамж болгон үзээрэй.",
    lang: "mn",
    // Суулгасан апп нэвтэрсэн хэрэглэгчийг шууд апп руу оруулна;
    // нэвтрээгүй бол middleware /auth/login руу чиглүүлнэ.
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ec",
    theme_color: "#1b6b53",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
