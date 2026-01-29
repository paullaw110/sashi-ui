import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack due to @libsql/client compatibility issues
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
