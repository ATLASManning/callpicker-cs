/**
 * Conciliación de cierre de semana: los módulos de Churn contra la cartera.
 *
 * El problema que resuelve: `cuentas.estado` no se entera de que una cuenta
 * murió. GRC AAA 2026 la marca "Churn confirmado", el corte semanal la reporta
 * cancelada y Zoho la manda a Dormido, pero en la cartera sigue apareciendo
 * Activa: suma a la facturación del asesor, entra en los rankings y compite por
 * una actividad SAC. Caso testigo — Global Digital, "Churn confirmado + Fraude"
 * desde junio 2026, seguía activa el 2 de septiembre con $34,430 de MRR.
 *
 * La política tiene dos regímenes separados por el 31 de agosto de 2026:
 *
 *   Evento HASTA el 31/08/2026 → limpieza de histórico. La cuenta pasa a
 *   Dormida sin pedirle expediente a nadie: son bajas que ocurrieron antes de
 *   que existiera el protocolo.
 *
 *   Evento DESPUÉS del 31/08/2026 → NO se reclasifica sola. Se exige el
 *   expediente del Protocolo de baja (cómo se dio, qué indicios hubo, qué
 *   acciones se tomaron) y el plan de recuperación del ingreso. La cuenta NO
 *   cambia de estatus hasta que eso esté documentado.
 *
 * El generador de actividades ya bloquea estas cuentas al momento de generar
 * (lib/elegibilidad.ts). Esto es lo otro: dejar la cartera diciendo la verdad
 * el resto de la semana, no solo el lunes.
 */
import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import { CLIENTES_CANCELADOS } from './churn-cancelados-data'
import { normalizarNombre } from './elegibilidad'

/** Frontera entre limpieza de histórico y exigencia de expediente. */
export const CORTE_HISTORICO = '2026-08-31'

/** Estado con el que la plataforma representa "Dormida". */
export const ESTADO_DORMIDA = 'hibernacion'

/** Estados que la cartera considera cuenta viva. */
export const ESTADOS_VIVOS = ['activo', 'en_riesgo'] as const

export type FuenteSenal = 'GRC AAA 2026' | 'Churn · Análisis DATA' | 'Zoho · Dormidos'

export interface SenalChurn {
  /** Nombre tal como aparece en la fuente. */
  cliente:    string
  fuente:     FuenteSenal
  /** "Churn confirmado", "Churn confirmado + Fraude", "Cancelación confirmada"… */
  movimiento: string
  /** Mes legible del evento. */
  mes:        string
  /** Fecha ISO del evento (cierre del mes). Vacía si la fuente no la trae. */
  fecha:      string
  /** MRR perdido según la fuente, cuando lo reporta. */
  perdido:    number
}

export interface CuentaConciliable {
  id:           number | string
  consecutivo:  string
  cid:          string | null
  empresa:      string
  asesor:       string | null
  estado:       string | null
  facturacion:  number | null
}

export type AccionConciliacion = 'reclasificar' | 'exige_expediente' | 'sin_cambio'

export interface HallazgoConciliacion {
  cuenta: CuentaConciliable
  senal:  SenalChurn
  accion: AccionConciliacion
  motivo: string
}

export interface ResumenConciliacion {
  /** Evento ≤ corte y cuenta todavía viva: pasa a Dormida. */
  reclasificar:     HallazgoConciliacion[]
  /** Evento > corte y cuenta todavía viva: se exige expediente, NO se toca el estatus. */
  exigeExpediente:  HallazgoConciliacion[]
  /** Señal de churn pero la cuenta ya estaba fuera de activas. */
  sinCambio:        HallazgoConciliacion[]
  /** MRR que la cartera sigue contando y ya no existe. */
  mrrFantasma:      number
  corte:            string
  /** Fuentes que sí pudieron leerse en esta corrida. */
  fuentes:          FuenteSenal[]
}

/* ── Fechas ──────────────────────────────────────────────────────────────── */

/** Quita diacríticos sin meter caracteres combinantes en el fuente. */
function sinAcentos(t: string): string {
  return t.normalize('NFD').split('').filter(ch => {
    const c = ch.codePointAt(0) ?? 0
    return c < 0x0300 || c > 0x036f
  }).join('')
}

const MES_CIERRE: Record<string, string> = {
  enero: '01-31', febrero: '02-28', marzo: '03-31', abril: '04-30',
  mayo: '05-31', junio: '06-30', julio: '07-31', agosto: '08-31',
  septiembre: '09-30', octubre: '10-31', noviembre: '11-30', diciembre: '12-31',
}

/** "Junio" → "2026-06-30". Devuelve '' si el mes no se reconoce. */
export function fechaDeMes(mes: string, anio = 2026): string {
  const k = sinAcentos(mes.trim().toLowerCase())
  const dia = MES_CIERRE[k]
  return dia ? `${anio}-${dia}` : ''
}

/** Extrae el mes de una etiqueta de periodo tipo "Semana 3 · Ago 2026". */
function mesDePeriodo(periodo: string): string {
  const p = sinAcentos(periodo.toLowerCase())
  for (const largo of Object.keys(MES_CIERRE)) {
    if (p.includes(largo) || p.includes(largo.slice(0, 3))) {
      return largo.charAt(0).toUpperCase() + largo.slice(1)
    }
  }
  return ''
}

/* ── Señales estáticas: GRC AAA + cortes semanales ───────────────────────── */

/**
 * Mapa `nombre normalizado → señal más reciente`.
 *
 * Se queda con el evento MÁS RECIENTE, no con el primero: una cuenta que
 * aparece con churn en marzo y vuelve a aparecer en septiembre debe caer del
 * lado de la exigencia de expediente, no del lado de la limpieza de histórico.
 *
 * Los "Downgrade" no entran: siguen siendo cartera viva y facturando — son
 * justamente las que más seguimiento necesitan.
 */
export function senalesEstaticas(): Map<string, SenalChurn> {
  const mapa = new Map<string, SenalChurn>()

  const registrar = (clave: string, s: SenalChurn) => {
    if (!clave) return
    const previa = mapa.get(clave)
    // Sin fecha no puede compararse; una señal fechada siempre gana a una sin fecha.
    if (!previa || (s.fecha && (!previa.fecha || s.fecha > previa.fecha))) mapa.set(clave, s)
  }

  for (const mes of AAA_GRC_2026) {
    for (const r of mes.clientes) {
      if (!r.movimiento.includes('Churn confirmado')) continue
      registrar(normalizarNombre(r.cliente), {
        cliente:    r.cliente,
        fuente:     'GRC AAA 2026',
        movimiento: r.movimiento,
        mes:        mes.mes,
        fecha:      fechaDeMes(mes.mes),
        perdido:    (r.perdido || 0) + (r.perdido2 || 0),
      })
    }
  }

  for (const c of CLIENTES_CANCELADOS) {
    const mes = mesDePeriodo(c.periodo)
    registrar(normalizarNombre(c.cliente), {
      cliente:    c.cliente,
      fuente:     'Churn · Análisis DATA',
      movimiento: 'Cancelación confirmada',
      mes:        mes || c.periodo,
      fecha:      fechaDeMes(mes),
      perdido:    0,
    })
  }

  return mapa
}

/* ── Señal de Zoho · Dormidos ────────────────────────────────────────────── */

export interface FilaZohoDormido {
  cuenta_id:      number | string | null
  matched:        boolean
  nombre?:        string
  ultimaFactura?: string | null
  diasSinFactura?: number | null
  mrr?:           number | null
}

/**
 * Fecha del evento para una cuenta dormida en Zoho.
 *
 * Zoho no dice "esta cuenta murió tal día": dice cuándo facturó por última vez.
 * Esa es la fecha que separa una baja vieja de una reciente, así que es la que
 * se usa. Si no viene, se reconstruye desde los días sin factura.
 */
export function fechaDormidoZoho(f: FilaZohoDormido, hoy = new Date()): string {
  const raw = (f.ultimaFactura ?? '').trim()
  if (raw) {
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const dmy = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  }
  const dias = Number(f.diasSinFactura ?? NaN)
  if (Number.isFinite(dias) && dias >= 0) {
    return new Date(hoy.getTime() - dias * 86400000).toISOString().slice(0, 10)
  }
  return ''
}

/* ── Conciliación ────────────────────────────────────────────────────────── */

/**
 * Cruza la cartera contra las tres fuentes y reparte cada hallazgo.
 *
 * `dormidosZoho` es opcional a propósito: la vista de Zoho puede no responder,
 * y en ese caso la conciliación sigue corriendo con GRC AAA y los cortes
 * semanales en lugar de no correr. Lo que NO puede pasar es lo contrario —
 * generar actividades sin conciliar — y de eso se encarga el generador, que
 * es fail-closed.
 */
export function conciliar(
  cuentas: CuentaConciliable[],
  dormidosZoho?: FilaZohoDormido[] | null,
): ResumenConciliacion {
  const estaticas = senalesEstaticas()
  const fuentes: FuenteSenal[] = ['GRC AAA 2026', 'Churn · Análisis DATA']

  const porZoho = new Map<string, SenalChurn>()
  if (dormidosZoho?.length) {
    fuentes.push('Zoho · Dormidos')
    for (const f of dormidosZoho) {
      if (!f.matched || f.cuenta_id == null) continue
      const fecha = fechaDormidoZoho(f)
      porZoho.set(String(f.cuenta_id), {
        cliente:    f.nombre ?? '',
        fuente:     'Zoho · Dormidos',
        movimiento: 'Dormida en Zoho',
        mes:        fecha ? fecha.slice(0, 7) : 'sin fecha',
        fecha,
        perdido:    Number(f.mrr ?? 0),
      })
    }
  }

  const reclasificar: HallazgoConciliacion[] = []
  const exigeExpediente: HallazgoConciliacion[] = []
  const sinCambio: HallazgoConciliacion[] = []

  for (const c of cuentas) {
    const porNombre = estaticas.get(normalizarNombre(c.empresa))
    const zoho = porZoho.get(String(c.id))

    // Gana la señal más reciente: si Zoho dice que dejó de facturar en
    // septiembre, eso pesa más que un churn de marzo en el GRC.
    let senal: SenalChurn | undefined = porNombre
    if (zoho && (!senal || (zoho.fecha && (!senal.fecha || zoho.fecha > senal.fecha)))) senal = zoho
    if (!senal) continue

    const vivo = (ESTADOS_VIVOS as readonly string[]).includes(String(c.estado ?? ''))
    if (!vivo) {
      sinCambio.push({ cuenta: c, senal, accion: 'sin_cambio', motivo: `Ya está en estatus "${c.estado}".` })
      continue
    }

    // Sin fecha no se puede afirmar que sea histórico. Se manda al lado que
    // pide explicación en vez de al que reclasifica en silencio: equivocarse
    // pidiendo un expediente cuesta trabajo; equivocarse dando por muerta una
    // cuenta viva cuesta la cuenta.
    if (senal.fecha && senal.fecha <= CORTE_HISTORICO) {
      reclasificar.push({
        cuenta: c, senal, accion: 'reclasificar',
        motivo: `${senal.movimiento} en ${senal.mes} según ${senal.fuente}. El evento es anterior al ${CORTE_HISTORICO}: pasa a Dormida como limpieza de histórico.`,
      })
    } else {
      exigeExpediente.push({
        cuenta: c, senal, accion: 'exige_expediente',
        motivo: senal.fecha
          ? `${senal.movimiento} en ${senal.mes} según ${senal.fuente}. Posterior al ${CORTE_HISTORICO}: no cambia de estatus hasta que se documente el expediente de baja y el plan de recuperación del ingreso.`
          : `${senal.movimiento} según ${senal.fuente}, sin fecha de evento. No se reclasifica a ciegas: se pide el expediente para fecharla y documentarla.`,
      })
    }
  }

  const orden = (a: HallazgoConciliacion, b: HallazgoConciliacion) =>
    (b.cuenta.facturacion ?? 0) - (a.cuenta.facturacion ?? 0)

  return {
    reclasificar:    reclasificar.sort(orden),
    exigeExpediente: exigeExpediente.sort(orden),
    sinCambio:       sinCambio.sort(orden),
    mrrFantasma:     [...reclasificar, ...exigeExpediente].reduce((s, h) => s + (h.cuenta.facturacion ?? 0), 0),
    corte:           CORTE_HISTORICO,
    fuentes,
  }
}

/** Lo que se le pide al asesor cuando la baja es posterior al corte. */
export const EXIGENCIA_EXPEDIENTE = [
  'Cómo se dio la baja: fecha, quién la comunicó y por qué canal.',
  'Qué indicios hubo antes y desde cuándo eran visibles (tickets, caída de consumo, falta de pago, cambio de contacto).',
  'Qué acciones se tomaron al detectarlos, con fecha — y si no se tomó ninguna, decirlo.',
  'Quién más de Callpicker intervino y en qué momento se escaló.',
  'Plan o estrategia para recuperar el ingreso perdido, con responsable y fecha de revisión.',
] as const

/** Nota que queda escrita en la cuenta al reclasificarla. */
export function notaReclasificacion(h: HallazgoConciliacion, hoy = new Date()): string {
  const f = hoy.toISOString().slice(0, 10)
  return `[Conciliación ${f}] ${h.motivo}`
}
