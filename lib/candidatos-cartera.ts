import { evaluarCandidato, type EntradaCandidatura, type ResultadoCandidato } from '@/lib/candidato-a'
import { cortesDeCuenta } from '@/lib/cortes-cuenta'
import { resumenLlamadas } from '@/lib/llamadas-resumen'
import { didsDeCuenta } from '@/lib/dids-cuenta'
import { soporteDeCuenta } from '@/lib/soporte-cuenta'
import { getAdopcionProductoAll } from '@/lib/supabase'

/**
 * lib/candidatos-cartera.ts — LA CANDIDATURA DE CADA CUENTA, EN UN SOLO SITIO
 *
 * ── POR QUÉ SE EXTRAJO ─────────────────────────────────────────────────────
 *
 * Esto vivía dentro de `app/page.tsx`: setenta líneas que armaban una
 * `EntradaCandidatura` cruzando seis fuentes y se lo pasaban a
 * `evaluarCandidato`. Funcionaba, pero sólo la portada podía usarlo.
 *
 * Y eso dejaba a ALERTAS con un agujero concreto: la situación `oportunidad`
 * del motor de veredictos cuelga de `EstadoCuenta.candidatura`, y ese campo
 * entraba a mano como `null` en `lib/alertas-estado.ts`. O sea que la
 * situación estaba declarada, tenía su mosaico verde en el semáforo y su
 * renglón en `SITUACION` — y NO PODÍA DISPARARSE NUNCA. Un estado inalcanzable
 * que ocupa sitio en pantalla es peor que no tenerlo: entrena a leer el
 * semáforo como si cubriera todo cuando le falta un color.
 *
 * La salida obvia —copiar las setenta líneas al otro módulo— es la que no se
 * toma. Dos copias de la misma derivación empiezan iguales y acaban
 * discrepando, y entonces la portada dice que 54 cuentas tienen candidatura
 * mientras ALERTAS propone crecer en otras. Dirección ya puso la regla: las
 * métricas por cuenta salen de fuentes vivas y de UNA. Ver
 * [[feedback-fuente-unica-cuentas]].
 *
 * ── QUÉ NO HACE ────────────────────────────────────────────────────────────
 *
 * No decide: `evaluarCandidato` decide, y sigue siendo una función pura en
 * `lib/candidato-a.ts` que no sabe de dónde vienen sus datos. Esto sólo los
 * reúne. La escalera de producto se LEE de `adopcion_producto`, no se deduce
 * del nombre del plan. Ver [[crecimiento-escalera-producto]].
 */

/** El % de un DID que delata un canal digital, por su etiqueta en el panel. */
const RX_CANAL_DIGITAL =
  /whats\s*app|\bwa\b|facebook|\bfb\b|instagram|tiktok|linkedin|redes|\bgoogle\b|\bads\b|adwords|campa[nñ]a|landing|marketing|\bmkt\b|publicidad/i
/** Etiquetas que significan «este número no se ha asignado a nada». */
const ETIQUETA_LIBRE = new Set(['available', 'disponible', ''])

/**
 * Lo que hace falta de la ficha para poder juzgar una candidatura.
 *
 * Se declara ancho a propósito —todo opcional y nullable— para que acepte
 * tanto un `Cuenta` completo de `lib/types` como la fila recortada que
 * selecciona `alertas-estado`. Lo que no venga cuenta como ausente, que es la
 * verdad; `evaluarCandidato` ya distingue ausente de cero.
 */
export interface FilaCandidatura {
  id: string | number
  cid?: string | null
  consecutivo?: string | null
  empresa: string
  asesor?: string | null
  estado?: string | null
  facturacion?: number | null
  health_score?: number | null
  activo_desde?: string | null
  dias_sin_contacto?: number | null
  giro?: string | null
  num_oficinas?: string | number | null
  contacto_nombre?: string | null
  contacto_tel?: string | null
  contacto_email?: string | null
  observaciones_kam?: string | null
  contactos_json?: unknown[] | null
}

/**
 * Datos relevantes que le faltan a una cuenta para poder operarla bien.
 *
 * Vivía en `app/page.tsx` y la comparten las Alertas Críticas, el ranking de
 * Top Cuentas y ahora la candidatura. Una sola definición: si mañana se agrega
 * un campo obligatorio, se agrega aquí y los tres lo cuentan igual.
 */
export function faltantesDeFicha(c: FilaCandidatura): string[] {
  const faltantes: string[] = []
  if (!c.contacto_nombre)                      faltantes.push('Contacto')
  if (!c.contacto_tel)                         faltantes.push('Teléfono')
  if (!c.contacto_email)                       faltantes.push('Correo')
  if (!c.activo_desde)                         faltantes.push('Fecha de alta')
  if (!c.giro)                                 faltantes.push('Giro')
  if (!c.cid)                                  faltantes.push('CID Zoho')
  const kam = String(c.observaciones_kam ?? '').trim()
  if (kam === '' || kam === '0')               faltantes.push('Observaciones KAM')
  if ((c.contactos_json?.length ?? 0) < 2)     faltantes.push('Mapa de decisores')
  return faltantes
}

/** `true` si hay por dónde localizar al cliente. El `'0'` es un centinela que
 *  la exportación de Zoho mete donde no hay dato, y leerlo como teléfono
 *  convertía una ficha vacía en una ficha completa. */
function tieneContacto(c: FilaCandidatura): boolean {
  const vale = (v: unknown) => {
    const s = String(v ?? '').trim()
    return s !== '' && s !== '0'
  }
  return vale(c.contacto_email) || vale(c.contacto_tel)
}

const prom = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null

/**
 * La candidatura de cada cuenta de la lista, indexada por su id.
 *
 * Las cuatro fuentes medidas (cortes, llamadas, DIDs, adopción) cachean por
 * módulo, así que las 221 cuentas comparten una sola lectura de cada archivo.
 * La adopción se trae UNA vez para toda la lista en vez de por cuenta.
 */
export async function candidatosDeCartera(
  filas: FilaCandidatura[],
): Promise<Map<string, ResultadoCandidato>> {
  /* La escalera de producto, de su propia tabla y de una sola lectura para toda
     la lista. `getAdopcionProductoAll` ya pagina —la tabla pasa de las mil filas
     que PostgREST devuelve como máximo sin avisar— y ya devuelve `[]` si falla,
     así que un mapa vacío significa «no hay escalera»: `evaluarCandidato` cuenta
     la adopción como señal ausente y no propone ningún escalón, que es lo
     correcto. No se deduce del nombre del plan. */
  /* EL DESEMPATE ES POR `created_at`, Y NO ES OPCIONAL.
     `adopcion_producto` es append-only —no tiene UNIQUE sobre (cuenta, producto)
     y lleva un índice `(cuenta_id, producto, created_at DESC)` puesto justo
     para esto—, y `getAdopcionProductoAll` pagina SIN `order`, así que el orden
     de llegada no lo garantiza nadie. Quedarse con la última fila que llega
     puede dejar un `bajo` rancio tapando un `alto` vigente, y las reglas de
     crecimiento cierran con `adopcion['Callpicker Chat'] !== 'alto'`: el
     tablero propondría un producto que el cliente ya adoptó.
     Hoy ninguno de los 50 pares con historial discrepa, así que no hay cifra
     falsa en pantalla — pero esto se rompe el primer día que un asesor
     recapture un nivel, que es exactamente para lo que se recaptura. La
     portada ya desempataba así; al mudar la derivación se había perdido. */
  const adopMap = new Map<string, Record<string, { nivel: string; cuando: string }>>()
  for (const r of await getAdopcionProductoAll()) {
    const porProd = adopMap.get(r.cuenta_id) ?? {}
    const previo = porProd[r.producto]
    if (!previo || String(r.created_at) > previo.cuando) {
      porProd[r.producto] = { nivel: r.nivel, cuando: String(r.created_at) }
    }
    adopMap.set(r.cuenta_id, porProd)
  }
  /** El nivel VIGENTE por producto, ya desempatado. */
  const adopcionDe = (id: string): Record<string, string> => {
    const porProd = adopMap.get(id)
    if (!porProd) return {}
    const out: Record<string, string> = {}
    for (const [prod, v] of Object.entries(porProd)) out[prod] = v.nivel
    return out
  }

  const resultados = await Promise.all(filas.map(async (c): Promise<[string, ResultadoCandidato]> => {
    const id = String(c.id)
    const cid = c.cid ?? null
    const sop = soporteDeCuenta(cid, String(c.empresa ?? ''))
    const [cortes, llam, nums] = await Promise.all([
      cortesDeCuenta(cid, 6),
      resumenLlamadas(cid),
      didsDeCuenta(cid),
    ])

    const ult3 = cortes.slice(-3)
    const consumoPct = ult3.length ? prom(ult3.map(x => x.pct)) : null
    const mediaPrev = prom(cortes.slice(0, -2).map(x => x.pct))
    const mediaRec  = prom(cortes.slice(-2).map(x => x.pct))
    const caida = (mediaPrev && mediaPrev > 0 && mediaRec !== null)
      ? Math.max(0, ((mediaPrev - mediaRec) / mediaPrev) * 100) : null

    const entrada: EntradaCandidatura = {
      id, consecutivo: c.consecutivo ?? '', empresa: String(c.empresa ?? ''),
      asesor: c.asesor ?? null, estado: c.estado ?? null,
      facturacion: c.facturacion ?? 0, healthScore: c.health_score ?? null,
      activoDesde: c.activo_desde ?? null,
      diasSinContacto: c.dias_sin_contacto ?? null,
      giro: c.giro ?? null,
      numOficinas: c.num_oficinas == null ? null : String(c.num_oficinas),
      tieneContacto: tieneContacto(c),
      faltantesCount: faltantesDeFicha(c).length,
      /* De la fuente COMPLETA, no de la página de 20 filas de la tabla: una
         cuenta con 183 tickets declaraba sólo los que cupieran en pantalla. */
      ticketsTotal: sop.historia.total,
      ticketsFallas: sop.historia.fallas,
      ticketsAbiertos: sop.historia.abiertos ?? 0,
      ticketsVencidos: sop.vencidos.length,
      peorDiasSLA: sop.peorDiasSLA,
      plan: cortes.at(-1)?.plan ?? null,
      consumoPct, caidaConsumo: caida,
      panelPromedio: ult3.length ? prom(ult3.map(x => x.panel)) : null,
      adopcion: adopcionDe(id),

      /* Medidas. `null` cuando no hay lectura, y el evaluador lo distingue: no
         medir no es medir cero. */
      entrantes:       llam?.entrantes ?? null,
      sinContestar:    llam?.sinContestar ?? null,
      pctSinContestar: llam?.pctSinContestar ?? null,
      pctMenu:         llam?.pctMenu ?? null,
      ventanaLlamadas: llam?.ventana ?? null,
      /* Desarrolladores se SUMA sobre los cortes, no se promedia: una visita
         ocurrió o no ocurrió, y promediarla la diluye hasta desaparecer. */
      visitasDesarrolladores: cortes.length
        ? cortes.reduce((s, x) => s + (x.desarrolladores ?? 0), 0) : null,
      extensiones:     cortes.at(-1)?.extensiones ?? null,
      minPorExtension: (() => {
        const u = cortes.at(-1)
        return u?.extensiones ? u.cons / u.extensiones : null
      })(),
      dids:        nums.length,
      didsDigital: nums.filter(d => RX_CANAL_DIGITAL.test(d.etiqueta)).length,
      didsLibres:  nums.filter(d => ETIQUETA_LIBRE.has(d.etiqueta.trim().toLowerCase())).length,
    }

    return [id, evaluarCandidato(entrada)]
  }))

  return new Map(resultados)
}
