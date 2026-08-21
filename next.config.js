const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  // Sin esto, el Service Worker nuevo se queda "esperando" a que se cierren
  // TODAS las pestañas abiertas antes de activarse — con el dashboard abierto
  // todo el día, un deploy nuevo nunca llegaba a los usuarios aunque
  // recargaran la página. skipWaiting + clientsClaim lo activa de inmediato.
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
