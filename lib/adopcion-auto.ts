/**
 * Evaluación automática de ADOPCIÓN DE PRODUCTO a partir de datos duros.
 *
 * Reglas de la casa, en orden de importancia:
 *  1. No se inventa. Si no hay evidencia para un producto, no se emite nada
 *     y el módulo queda como estaba.
 *  2. No se pisa al asesor. El llamador solo inserta en pares (cuenta,
 *     producto) que todavía no tienen evaluación.
 *  3. Cada veredicto viaja con su evidencia en `notas`, para que el KAM
 *     pueda contradecirlo con datos y no de memoria.
 *
 * Fuentes: el nombre del plan de los cortes de facturación (qué está
 * contratado), el % de consumo (qué tanto se usa) y los contadores de
 * secciones del panel (quién entra a operar la herramienta).
 *
 * Lo que NO se evalúa nunca: los flags `tiene_*` de la tabla `cuentas` están
 * en `false` para las 197 cuentas activas — nunca se poblaron y no distinguen
 * "no contratado" de "sin capturar".
 */

export type NivelAdopcion = 'alto' | 'medio' | 'bajo' | 'no_aplica'

export const PRODUCTOS_ADOPCION = [
  'Voz CE', 'Voz VyC', 'Callpicker Chat', 'Integración API',
  'Pago Automático', 'IA de Voz', 'IA de Chat', 'Uso del Panel Administrador',
] as const

/** Un corte con los contadores que interesan para evaluar. */
export interface CorteAdopcion {
  mes:   string
  plan:  string
  pct:   number          // % de la bolsa consumido
  cons:  number          // minutos consumidos
  panel: number          // suma de visitas a secciones del panel
  desarrolladores: number
  pagoExitoso:     number
}

export interface EvaluacionProducto {
  producto: string
  nivel:    NivelAdopcion
  notas:    string
}

/* ── Qué producto nombra el plan ──────────────────────────────────────────
 * Un CID tiene exactamente un plan de voz por corte, así que CE y VyC se
 * excluyen entre sí. Los demás productos solo se afirman cuando el plan los
 * nombra: una cuenta puede tener otros CID que aquí no se ven, de modo que
 * la ausencia NO prueba que no lo tenga.
 */
const RX_CE   = /comunicaci[oó]n\s+empresarial/i
const RX_VYC  = /visibilidad\s+y\s+control/i
const RX_AV   = /(^|\s)av[\s.]|\(av\s+ia\)|agentes?\s+virtual/i
const RX_CHAT = /cp\s*chat|callpicker\s+chat|agentes?\s+cp\s+chat/i
const RX_API  = /minutos\s+api|whatsapp\s+api/i
const RX_SIN_API = /sin\s+api/i

/* ── Umbrales ─────────────────────────────────────────────────────────────
 * Consumo: lectura de negocio — si paga una bolsa y usa 60 % o más, la está
 * aprovechando; por debajo de 20 % está pagando capacidad que no usa.
 * Panel: derivado de la distribución real de la cartera (2,642 CID): la
 * mediana es 0.3 visitas al mes y el percentil 90 son 17.7, así que 10 o más
 * es actividad genuina y 0 es no entrar nunca.
 */
const CONSUMO_ALTO = 60
const CONSUMO_MEDIO = 20
const PANEL_ALTO = 10

function nivelPorConsumo(pct: number): NivelAdopcion {
  if (pct >= CONSUMO_ALTO)  return 'alto'
  if (pct >= CONSUMO_MEDIO) return 'medio'
  return 'bajo'
}

const prom = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
const fmt  = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 })

/**
 * Evalúa lo que los datos permiten. Devuelve SOLO los productos con evidencia;
 * los demás se omiten a propósito para que el módulo los deje intactos.
 */
export function evaluarAdopcion(cortes: CorteAdopcion[]): EvaluacionProducto[] {
  const out: EvaluacionProducto[] = []
  if (!cortes.length) return out

  const ult      = cortes.slice(-3)
  const meses    = ult.map(c => c.mes).join(', ')
  const planes   = Array.from(new Set(ult.map(c => c.plan).filter(Boolean)))
  const planTxt  = planes.join(' / ')
  const pctProm  = prom(ult.map(c => c.pct))
  const consProm = prom(ult.map(c => c.cons))

  const tieneCE   = planes.some(p => RX_CE.test(p))
  const tieneVyC  = planes.some(p => RX_VYC.test(p))
  const tieneAV   = planes.some(p => RX_AV.test(p))
  const tieneChat = planes.some(p => RX_CHAT.test(p))
  const tieneAPI  = planes.some(p => RX_API.test(p))
  const sinAPI    = planes.some(p => RX_SIN_API.test(p))

  const baseVoz = `Plan "${planTxt}" · consumo promedio ${fmt(pctProm)}% ` +
                  `(${fmt(consProm)} min) en los cortes de ${meses}.`

  // ── Voz: CE y VyC se excluyen; el plan del CID dice cuál es ──────────────
  if (tieneCE || tieneVyC) {
    const contratado = tieneCE ? 'Voz CE' : 'Voz VyC'
    const otro       = tieneCE ? 'Voz VyC' : 'Voz CE'
    out.push({ producto: contratado, nivel: nivelPorConsumo(pctProm), notas: baseVoz })
    out.push({
      producto: otro, nivel: 'no_aplica',
      notas: `El plan facturado es "${planTxt}", de la familia ${tieneCE ? 'Comunicación Empresarial' : 'Visibilidad y Control'}. ` +
             `Un CID tiene un solo plan de voz.`,
    })
  }

  // ── IA de Voz: solo si el plan la nombra (AV = Agentes Virtuales) ────────
  if (tieneAV) {
    out.push({
      producto: 'IA de Voz',
      nivel: nivelPorConsumo(pctProm),
      notas: `El plan incluye Agentes Virtuales ("${planTxt}"). ${baseVoz}`,
    })
  }

  if (tieneChat) {
    out.push({
      producto: 'Callpicker Chat',
      nivel: nivelPorConsumo(pctProm),
      notas: `El plan facturado incluye agentes de Chat ("${planTxt}").`,
    })
  }

  // ── Integración API ──────────────────────────────────────────────────────
  const devProm = prom(ult.map(c => c.desarrolladores))
  if (sinAPI) {
    out.push({
      producto: 'Integración API', nivel: 'no_aplica',
      notas: `El plan facturado declara explícitamente que va sin API ni integraciones ("${planTxt}").`,
    })
  } else if (tieneAPI) {
    out.push({
      producto: 'Integración API',
      nivel: devProm > 0 ? 'alto' : 'medio',
      notas: `El plan facturado es de API ("${planTxt}").` +
             (devProm > 0 ? ` Además hay ${fmt(devProm)} visitas promedio a la sección Desarrolladores.` : ''),
    })
  } else if (devProm > 0) {
    out.push({
      producto: 'Integración API', nivel: 'medio',
      notas: `${fmt(devProm)} visitas promedio a la sección Desarrolladores del panel en ${meses}. ` +
             `El plan no es de API, así que probablemente es exploración o integración propia.`,
    })
  }
  // Sin plan de API y sin visitas: no se afirma nada. Que no visiten la
  // sección no prueba que no consuman la API desde su sistema.

  // ── Pago automático: solo evidencia positiva ─────────────────────────────
  if (ult.some(c => c.pagoExitoso > 0)) {
    out.push({
      producto: 'Pago Automático', nivel: 'alto',
      notas: `Cobro automático exitoso registrado en los cortes de ${meses}.`,
    })
  }

  // ── Uso del panel administrador ──────────────────────────────────────────
  const panelProm = prom(ult.map(c => c.panel))
  const nivelPanel: NivelAdopcion =
    panelProm >= PANEL_ALTO ? 'alto' : panelProm > 0 ? 'medio' : 'bajo'
  out.push({
    producto: 'Uso del Panel Administrador',
    nivel: nivelPanel,
    notas: panelProm > 0
      ? `${fmt(panelProm)} visitas promedio al mes a las secciones del panel ` +
        `(configuración, reportes, historial de llamadas, entrantes, salientes, mi extensión) en ${meses}.`
      : `Cero visitas a cualquier sección del panel en los cortes de ${meses}: ` +
        `el servicio opera pero nadie entra a administrarlo.`,
  })

  // 'IA de Chat' nunca se evalúa: no hay ningún dato que la sustente.
  return out
}
