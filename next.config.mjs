/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance and Security Optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client"],
  },
  images: {
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
