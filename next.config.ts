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
    // Cloudflare Pages에서는 Next.js Image 최적화 대신 unoptimized 사용
    unoptimized: true,
  },
};

export default nextConfig;
