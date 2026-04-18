import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "66.42.57.98",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
