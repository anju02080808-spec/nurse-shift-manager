import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "勤務表 | Nurse Shift Manager",
    short_name: "勤務表",
    description: "看護師のためのシンプルな勤務管理アプリ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f8",
    theme_color: "#173e55",
    lang: "ja",
    categories: ["health", "productivity", "utilities"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
