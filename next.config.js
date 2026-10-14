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

/* EL TRAZADO VIVE DENTRO DE `experimental` EN NEXT 14 — y estaba en la raíz.
 *
 * Comprobado en `node_modules/next/dist/server/config-shared.d.ts`:
 * `outputFileTracingIncludes` está declarado en `ExperimentalConfig` (línea
 * 215) y NO en `NextConfig`. Pasa a la raíz en Next 15; aquí vamos por 14.2.3.
 *
 * Mientras estuvo arriba, `next build` lo rechazaba en CADA corrida:
 *
 *     ⚠ Invalid next.config.js options detected:
 *     ⚠     Unrecognized key(s) in object: 'outputFileTracingIncludes'
 *
 * O sea que las seis declaraciones de abajo NO se aplicaban y todo dependía de
 * que el trazador adivinara — justo lo que los comentarios que siguen explican
 * que NO se puede dar por supuesto. Y el modo de fallo es el peor de todos: la
 * mesa de ayuda devuelve el estado VACÍO, las alarmas no se emiten, y la
 * ausencia de una alarma es indistinguible de que todo esté bien.
 *
 * Se extrae a una constante para moverlo de sitio SIN tocar ni una línea de los
 * comentarios de abajo, que son los que justifican cada ruta. */
const TRAZADO = {
  /* QUE EL .XLSX VIAJE CON LA LAMBDA QUE LO LEE.
   *
   * `lib/cortes-cuenta.ts` abre el archivo con
   * `path.join(process.cwd(), 'data', 'cortes-facturacion.xlsx')`, y una ruta
   * armada en tiempo de ejecución el trazador de Next NO la puede seguir: decide
   * qué ficheros acompañan a cada función leyendo el código. Con el JSON del GRC
   * esto ya pasó y costó medio día — `/api/grc` lo encontraba y `/api/alertas`
   * devolvía «No se encontró data/grc-zoho.json (cwd=/var/task)», así que 48
   * cuentas aparecían en cero y eso se leía como hallazgo.
   *
   * Ahí se resolvió con un `await import()` de especificador literal, que
   * empaqueta el JSON dentro del bundle. Con un .xlsx no se puede: no es un
   * módulo. Para binarios el mecanismo es éste, declarar la dependencia que el
   * trazador no ve.
   *
   * Las fichas de cuenta y la portada SÍ reciben el archivo hoy —comprobado en
   * producción, GRUPO 2711 publica sus 18,200 minutos—, pero eso es suerte del
   * trazador y no una garantía para una ruta nueva. El cron del snapshot se
   * declara explícito: si el archivo no llegara, `todosLosCortes()` devuelve un
   * mapa vacío EN SILENCIO y el snapshot registraría «sin consumo» en las 192
   * cuentas. Con la regla de dirección del 7 oct —un hueco es una tarea— eso
   * abriría una avalancha de tareas por un hueco que no existe. */
  outputFileTracingIncludes: {
    /* La ruta era `/api/cron/snapshot-prediccion` y DEJÓ DE EXISTIR el 12 oct
     * 2026, cuando el snapshot se fusionó dentro del cron diario. La
     * declaración se quedó apuntando al vacío — invisible, porque la llave
     * entera estaba mal puesta y Next no leía ninguna. */
    '/api/cron/diario': ['./data/**'],

    /* LA MESA DE AYUDA, declarada para las seis rutas que la necesitan desde
     * el 9 oct 2026, cuando el detector de alertas empezó a leerla.
     *
     * Aquí NO cabe confiar en la suerte del trazador, y por una razón más
     * fuerte que la de arriba: `lib/mesa-ayuda.ts` no abre un fichero, abre un
     * DIRECTORIO con `fs.readdirSync` y una ruta armada en tiempo de
     * ejecución. El trazador lee el código para decidir qué acompaña a cada
     * función; un `readdir` no le dice nada de qué hay dentro.
     *
     * Y el modo de fallo es el peor que hay: `cortes()` devolvería la lista
     * vacía, `mesaDeCuenta()` el estado VACÍO, y las tres alarmas de mesa
     * sencillamente no se emitirían. Ni un error, ni un cero: la ausencia de
     * una alarma es indistinguible de que todo esté bien. Por eso además se
     * declara el hueco en `veredictosDeCartera`. */
    '/api/alertas': ['./data/mesa-ayuda/**'],
    '/api/alertas/veredictos': ['./data/mesa-ayuda/**'],
    '/': ['./data/mesa-ayuda/**'],
    '/alertas': ['./data/mesa-ayuda/**'],
    '/asesores': ['./data/mesa-ayuda/**'],
    '/cuentas/[id]': ['./data/mesa-ayuda/**'],
  },
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
    ...TRAZADO,
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
