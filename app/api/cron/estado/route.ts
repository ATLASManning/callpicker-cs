import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { ahoraEnMexico, fechaLocal, selloMexico } from '@/lib/fecha-local'

/**
 * app/api/cron/estado — ¿están las tareas programadas en condiciones de correr?
 *
 * POR QUÉ EXISTE
 * --------------
 * El cron mensual de `refresh-tenure` llevaba meses sin correr y nadie se
 * enteró: el middleware lo mandaba al login y el redirect contesta 200 con HTML,
 * así que Vercel lo marcaba como exitoso. Un fallo que se disfraza de éxito no
 * se descubre solo — hace falta un sitio donde preguntarle al sistema si puede.
 *
 * Contesta UNA cosa: si `CRON_SECRET` está configurado. Sin él, el middleware
 * cierra la puerta a propósito (fail-closed) y ningún cron pasa.
 *
 * NO DEVUELVE EL SECRETO, ni un prefijo, ni su longitud exacta redondeada a algo
 * útil para adivinarlo: solo si existe. Es el mínimo que sirve para diagnosticar
 * sin volver el diagnóstico una filtración.
 *
 * Es PÚBLICA a propósito. Saber que un tablero tiene tareas programadas no le
 * sirve de nada a nadie, y en cambio pedirle sesión a la ruta que existe para
 * depurar el acceso sería el mismo círculo que vinimos a romper.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const configurado = Boolean(process.env.CRON_SECRET)
  const hoy = ahoraEnMexico()

  /* Lo que ve el EDGE, que es quien de verdad abre o cierra la puerta.
   *
   * `configurado` de arriba es lo que ve Node, y eso NO basta: el 30 sep 2026
   * decía `true` mientras los crons seguían recibiendo el HTML del login. El
   * middleware deja estas dos cabeceras en la petición (ver middleware.ts) y
   * aquí se publican tal cual. Ninguna revela el secreto.
   *
   * `coincide` solo dice algo si quien pregunta mandó una cabecera
   * `Authorization: Bearer …`; si no, vale 'sin-cabecera'. */
  const h = headers()
  const edgeLoVe = h.get('x-cron-edge') ?? 'desconocido'
  const coincide = h.get('x-cron-match') ?? 'desconocido'
  const deAcuerdo = edgeLoVe === 'si' && configurado

  return NextResponse.json({
    cronSecretConfigurado: configurado,
    edgeTieneLaVariable: edgeLoVe,
    loQueMandasteCoincide: coincide,
    puedenCorrer: deAcuerdo,
    nota: !configurado
      ? 'CRON_SECRET no está configurado en Vercel: el middleware bloquea todo cron, ' +
        'a propósito. Configúralo en Settings → Environment Variables y vuelve a desplegar.'
      : edgeLoVe === 'no'
      ? 'Node ve la variable pero el EDGE no: el middleware sigue con la copia de un ' +
        'build anterior. Vuelve a desplegar — sin eso el cron entra al login y Vercel ' +
        'lo da por exitoso.'
      : coincide === 'no'
      ? 'El Edge tiene la variable, pero NO es la que mandaste. El valor guardado en ' +
        'Vercel y el de .env.local son distintos: vuelve a pegarlo.'
      : 'Las tareas programadas pueden autenticarse.',
    /* ESTA LISTA TIENE QUE SER LA DE `vercel.json`, Y SE REVISA AL TOCARLO.
     *
     * Es el único sitio en línea que contesta qué está programado, y existe
     * porque `refresh-tenure` pasó meses sin correr y nadie se enteró. El 8
     * oct 2026 se retiró el generador SAC y nadie abrió este archivo: siguió
     * anunciando un «lote semanal de actividades» cuyo cron y cuya ruta ya no
     * existían, mientras callaba `snapshot-prediccion`, que sí corre los lunes
     * y sí puede fallar. El diagnóstico mentía en las dos direcciones a la vez
     * — justo la clase de ceguera que esta ruta se construyó para evitar. */
    tareas: [
      { ruta: '/api/cron/snapshot-prediccion', horario: '0 13 * * 1', descripcion: 'Snapshot semanal de predicción, lunes 07:00 de México' },
      { ruta: '/api/cron/refresh-tenure', horario: '0 12 1 * *', descripcion: 'Refresco de antigüedad, día 1 de cada mes' },
    ],
    ahoraEnMexico: `${fechaLocal(hoy)} (${selloMexico()})`,
  })
}
