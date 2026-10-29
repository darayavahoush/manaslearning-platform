import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{source: '/api/milo/:path*', destination: `${process.env.MILO_BACKEND_URL}/api/:path*`}]
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
