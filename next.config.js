/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Exclude Supabase Edge Functions from Next.js build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'supabase/functions': 'commonjs supabase/functions'
      })
    }
    return config
  },
  // Exclude supabase functions directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig