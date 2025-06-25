/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 14
  // Disable all caching in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Force dynamic rendering
  experimental: {},
  // Disable build optimization in dev
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
}

module.exports = nextConfig