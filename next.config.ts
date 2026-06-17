import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  serverExternalPackages: ["pg"],
};

export default nextConfig;
