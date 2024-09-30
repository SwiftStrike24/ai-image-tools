/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.com',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'fluxscaleai.com',
      },
      // Add any other remote patterns as needed
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
  },
  transpilePackages: ['@clerk/clerk-sdk-node'],
  async headers() {
    return [
      {
        source: '/api/webhooks/stripe',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/webhooks/stripe',
        destination: '/api/webhooks/stripe/route',
      },
    ];
  },
};

module.exports = nextConfig;