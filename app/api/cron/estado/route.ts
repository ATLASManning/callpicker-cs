import { NextResponse } from 'next/server'
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
  return NextResponse.json({
    cronSecretConfigurado: configurado,
    puedenCorrer: configurado,
    nota: configurado
      ? 'Las tareas programadas pueden autenticarse.'
      : 'CRON_SECRET no está configurado en Vercel: el middleware bloquea todo cron, ' +
        'a propósito. Configúralo en Settings → Environment Variables y vuelve a desplegar.',
    tareas: [
      { ruta: '/api/cron/generar-semana', horario: '0 14 * * 1', descripcion: 'Lote semanal de actividades, lunes 08:00 de México' },
      { ruta: '/api/cron/refresh-tenure', horario: '0 12 1 * *', descripcion: 'Refresco de antigüedad, día 1 de cada mes' },
    ],
    ahoraEnMexico: `${fechaLocal(hoy)} (${selloMexico()})`,
  })
}
