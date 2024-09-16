/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['replicate.com', 'replicate.delivery'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
  },
  transpilePackages: ['@clerk/clerk-sdk-node'],
};

module.exports = nextConfig;