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
    /* LOS DOCUMENTOS DE CLIENTE NO SE GUARDAN EN EL NAVEGADOR.
     *
     * El runtimeCaching por omisión de next-pwa guarda las respuestas de
     * `/api/` en Cache Storage con NetworkFirst y 24 h de vida. Para un
     * tablero eso es conveniente; para `/api/anexos/<id>/descargar` significa
     * que un contrato o un análisis de cliente queda en el disco de la
     * máquina y se vuelve a servir desde ahí SIN pasar por el middleware —
     * o sea, después de cerrar sesión, y en un equipo compartido.
     *
     * NetworkOnly, primero en la lista para que gane al patrón genérico. */
    runtimeCaching: [
      { urlPattern: /\/api\/anexos(\/|$)/, handler: 'NetworkOnly' },
    ],
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
