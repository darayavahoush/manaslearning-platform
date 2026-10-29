import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app's own assets live under /web-static so /_next/* can belong to the proxied live site.
  assetPrefix: '/web-static',
  async rewrites() {
    return [{source: '/web-static/_next/:path+', destination: '/_next/:path+'}, {source: '/api/milo/:path*', destination: `${process.env.MILO_BACKEND_URL || 'https://vaakbot-api.nicestone-17f7dcba.eastus2.azurecontainerapps.io'}/api/:path*`}]
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
