import { textoFecha } from '@/lib/fecha-local'
import { ETIQUETA_NIVEL, type Semaforo, type SeveridadSla } from '@/lib/alertas-sla'

/**
 * EL CUERPO DEL AVISO DIARIO — y por que vive en SU PROPIO ARCHIVO
 *
 * Porque `lib/alertas-sla-aviso.ts` importa `resend` y `lib/supabase.ts`, y ese
 * ultimo construye un `RealtimeClient` al cargarse que bajo Node 20 revienta
 * con «Node.js 20 detected without native WebSocket support». Cualquier modulo
 * que lo arrastre deja de poder abrirse fuera de Next: ni la prueba ni el
 * generador de la reproduccion pueden mirarlo.
 *
 * Ya paso en este mismo encargo con `lib/dias-habiles.ts`, y la leccion fue la
 * misma: lo que hay que poder probar no importa la base. Aqui eso significa que
 * el HTML del correo —lo unico que alguien va a LEER de verdad— se puede
 * generar, abrir en un navegador y mirar, sin credenciales y sin red.
 *
 * Tabla y colores en linea, que es lo unico que sobrevive a un cliente de
 * correo: Gmail tira el `<style>` y Outlook tira casi todo. Los tonos son los
 * OSCUROS sobre blanco, no los claros del tablero: un correo es SIEMPRE fondo
 * claro, y el `#F87171` de la pantalla oscura mide 2.80:1 sobre blanco.
 * Medidos en `scripts/mide-tonos-sla.mjs`.
 * [[atlas-dashboard-contrast-architecture]]
 */

/** Escapa lo que va dentro del HTML. Un nombre de cuenta con `&` o `<` no puede
 *  romper el correo, y menos abrir una inyeccion en el cliente de quien lo lee. */
export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const dinero = (n: number | null) =>
  n === null ? 'sin importe'
             : `$${Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`

export interface LineaAviso {
  empresa: string
  consecutivo: string
  condicion: string
  semaforo: Semaforo
  severidad: SeveridadSla
  accion_sugerida: string
  mrr: number | null
  cuenta_id: string
}

const ROJO = '#A4262C'
const AMBAR = '#8A5200'
const TINTA = '#202E3B'
const TENUE = '#667384'
/* El enlace y el botón. Van en constantes y NO escritos dentro del HTML para
   que `scripts/mide-tonos-sla.mjs` los barra: ese guión lee este archivo con
   una expresión regular sobre `const NOMBRE = '#hex'`, así que un tono metido a
   mano en una plantilla se le escaparía — y ésa es exactamente la forma del bug
   que ya costó una ronda (`TT_STYLE`: el color decidible que nadie miraba). */
const AZUL = '#1D6CAA'
const CABECERA = '#0B2D4D'

export function cuerpoDeAviso(
  quien: string,
  lineas: LineaAviso[],
  hoy: string,
  esDireccion = false,
): string {
  const base = process.env.NEXT_PUBLIC_URL || 'https://callpicker-cs.vercel.app'
  const vencidas = lineas.filter(l => l.semaforo.vencida).length

  const filas = lineas.map(l => {
    const color = l.semaforo.nivel === 'rojo_intenso' || l.semaforo.nivel === 'rojo'
      ? ROJO : AMBAR
    return `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #DFE8EF;vertical-align:top">
        <a href="${base}/cuentas/${esc(l.cuenta_id)}"
           style="color:${AZUL};font-weight:700;text-decoration:none;font-size:13px">${esc(l.empresa)}</a>
        <div style="color:${TENUE};font-size:11px">${esc(l.consecutivo)} · ${dinero(l.mrr)} al mes</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #DFE8EF;vertical-align:top">
        <div style="color:${color};font-weight:700;font-size:12px">${esc(ETIQUETA_NIVEL[l.semaforo.nivel])}</div>
        <div style="color:${TENUE};font-size:11px">${esc(l.semaforo.etiqueta)}</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #DFE8EF;vertical-align:top;color:${TINTA};font-size:12px">
        ${esc(l.accion_sugerida)}
      </td>
    </tr>`
  }).join('')

  return `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:720px;margin:0 auto">
    <div style="background:${CABECERA};padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="color:#FFFFFF;font-size:17px;font-weight:700">
        ${esDireccion ? 'Tablero de incumplimientos' : `Tus alertas de hoy, ${esc(quien)}`}
      </div>
      <div style="color:#D7E7F2;font-size:12px;margin-top:4px">
        ${esc(textoFecha(hoy) ?? hoy)} · ${lineas.length} alerta${lineas.length === 1 ? '' : 's'}${vencidas > 0 ? `, ${vencidas} con el plazo vencido` : ''}
      </div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #DFE8EF;border-top:none;border-radius:0 0 12px 12px;padding:4px 16px 16px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <th style="text-align:left;padding:8px;color:${TENUE};font-size:10px;letter-spacing:.4px;border-bottom:2px solid #DFE8EF">CUENTA</th>
          <th style="text-align:left;padding:8px;color:${TENUE};font-size:10px;letter-spacing:.4px;border-bottom:2px solid #DFE8EF">PLAZO</th>
          <th style="text-align:left;padding:8px;color:${TENUE};font-size:10px;letter-spacing:.4px;border-bottom:2px solid #DFE8EF">QUÉ HACER</th>
        </tr>
        ${filas}
      </table>
      <p style="color:${TINTA};font-size:12px;line-height:1.6;margin:16px 0 0">
        La atención se cierra registrando la evidencia EN LA CUENTA —un seguimiento
        por un canal real, una reunión con minuta o una corrección de la ficha—.
        Eso <strong>no apaga la alerta</strong>: la alerta se apaga cuando la
        condición deja de verse en la fuente.
      </p>
      <p style="margin:14px 0 0">
        <a href="${base}/alertas"
           style="display:inline-block;background:${AZUL};color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">
          Abrir la cola de trabajo
        </a>
      </p>
      <p style="color:${TENUE};font-size:10.5px;line-height:1.6;margin:14px 0 0">
        Este resumen sale una vez al día de la corrida automática. Si algo de aquí
        no te corresponde, es que la cuenta cambió de cartera y la ficha todavía no:
        avísale a administración en vez de atenderla.
      </p>
    </div>
  </div>`
}
