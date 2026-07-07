import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  // Landing page-ийн зургууд public/-д. standalone build-д sharp
  // шаардахгүйн тулд optimization-г унтраана (зургууд шууд served).
  images: { unoptimized: true },
};

export default nextConfig;
