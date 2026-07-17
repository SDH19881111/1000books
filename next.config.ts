import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/id/**',
      },
      {
        protocol: 'https',
        hostname: 'bookthumb-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: '*.pstatic.net',
      },
    ],
  },
};

export default nextConfig;
