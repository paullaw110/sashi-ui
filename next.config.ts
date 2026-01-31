import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Tauri builds
  ...(process.env.NEXT_PUBLIC_API_URL && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
