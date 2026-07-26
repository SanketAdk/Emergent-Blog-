import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 60,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
