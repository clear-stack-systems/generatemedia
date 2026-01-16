/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.kie.ai',
      },
      {
        protocol: 'https',
        hostname: '**.kiecdn.com',
      },
    ],
  },
}

module.exports = nextConfig
