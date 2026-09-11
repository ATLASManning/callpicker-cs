/**
 * Módulo de Callpicker Chat dentro de la ficha de cuenta.
 *
 * ── QUÉ HACE Y QUÉ NO ──────────────────────────────────────────────────────
 * La voz no se toca. Lo que la ficha ya muestra hoy —plan vigente, minutos,
 * consumo, monto— sigue igual y sale de donde siempre salió. Este módulo SOLO
 * agrega Chat a las cuentas que lo tienen contratado, y le da un peso en la
 * salud del cliente.
 *
 * No deduce el servicio a partir del nombre del plan: lo lee. La factura dicta
 * el nombre («5 Agentes CP Chat», «CP Chat QR Básico 5 Agentes») y su monto. La
 * hoja de Callpicker Chat lo dicta en tres columnas que ya se llaman contrato:
 * `contracted_inboxes_count`, `contracted_agents` y `contracted_messages_monthly`.
 * Nada se infiere de patrones.
 *
 * ── POR QUÉ DOS FUENTES Y NO SOLO LA FACTURA ───────────────────────────────
 * El archivo de cortes trae UNA sola línea de plan por CID y por mes. De las
 * 129 cuentas con tráfico de chat, la factura solo nombra un plan de chat en
 * 20: PVnube factura «Visibilidad y Control 400 minutos» y mueve 342,362
 * mensajes de chat. Si el contrato se leyera solo de la factura, 114 cuentas
 * quedarían fuera. Por eso también cuenta lo que la hoja de chat reporta como
 * contratado.
 *
 * ── LOS VÍNCULOS QUE NO SON LO MISMO ───────────────────────────────────────
 * Medido sobre las 220 cuentas de cartera: 48 tocan chat.
 *   · contratado            46 — 37 con medición que sí pondera, 9 sin medición
 *   · trafico_sin_contrato   2 — mueven mensajes sin nada contratado
 * Solo el primero pondera la salud. El segundo se publica como hallazgo
 * comercial: no se le castiga la salud a quien no compró el servicio.
 *
 * Contar solo las bandejas habría dejado fuera a 33 clientes —Vanzar Link con
 * 8 agentes contratados y 76,428 mensajes entre ellos—, porque su contrato
 * está en `contracted_agents` y no en `contracted_inboxes_count`.
 */
import { CHAT_CLIENTES } from '@/app/callpicker-chat/chat-data'
import type { CorteCuenta } from './cortes-cuenta'

export type VinculoChat = 'contratado' | 'trafico_sin_contrato'

export interface CuentaChatwoot {
  nombre:      string
  id:          number | null
  agentes:     number | null
  bolsa:       number | null
  pctBolsa:    number | null
  mensajes:    number
  tendencia:   string | null
  crecimiento: number | null
}

export interface ChatDeCuenta {
  vinculo: VinculoChat
  /** De dónde consta el contrato, en palabras. */
  origen:  string

  /** Literal de la factura, cuando la factura nombra un plan de chat. */
  planFacturado:  string | null
  montoFacturado: number | null
  mesFactura:     string | null

  periodo:       string
  semaforo:      string
  motivos:       string[]
  mensajes:      number
  conversaciones: number
  cuentas:       CuentaChatwoot[]

  bandejasContratadas:   number
  bandejasConTrafico:    number
  contratadasMuertas:    number
  sinContratoConTrafico: number
  bandejasConError:      number

  /** Ponderación del chat, 0–100. null cuando no hay con qué medirlo. */
  score:      number | null
  razones:    string[]
  hsOficial:  number
  /** Health Score con el chat ponderado. null si no aplica. */
  hsAjustado: number | null
}

/**
 * Peso del chat en la salud del cliente.
 *
 * El Health Score es columna GENERATED ALWAYS en Postgres (ver lib/supabase.ts)
 * y sigue siendo el oficial: 0.35 actividad + 0.30 adopción + 0.20 pago +
 * 0.15 relacional. Esta capa no lo reescribe, lo recompone encima:
 *
 *     HS ajustado = 0.80 · HS oficial + 0.20 · score de chat
 *
 * Así una cuenta sin chat queda exactamente igual que hoy —ni un punto de
 * diferencia— y una cuenta con chat responde también por el chat. Es la
 * traducción de «entre más servicios tenga, mayor la exigencia al asesor».
 */
export const PESO_CHAT = 0.20

/** Punto de partida según el semáforo que ya calcula el módulo de chat.
 *  `sin_medicion` es null a propósito: sin medición no se ajusta nada. */
const BASE: Record<string, number | null> = {
  intenso:      90,
  saludable:    85,
  bajo:         45,
  sin_uso:      10,
  suspendida:    0,
  sin_medicion: null,
}

/** Una línea de la factura es de chat cuando la factura lo dice. */
function esPlanDeChat(plan: string): boolean {
  return /chat/i.test(plan)
}

function ponderar(c: Record<string, unknown>, cuentas: CuentaChatwoot[]): { score: number | null; razones: string[] } {
  const semaforo = String(c.semaforo)
  const base = BASE[semaforo]
  if (base === null || base === undefined) {
    return { score: null, razones: ['Sin medición de uso en el periodo: el chat no mueve el Health Score.'] }
  }

  const razones: string[] = [`Semáforo de uso «${semaforo}»: ${base} de base.`]
  let score = base

  // Los castigos solo aplican donde hay uso que juzgar. En `sin_uso` y
  // `suspendida` el semáforo ya cobró todo — encimar penalizaciones sería
  // cobrar dos veces la misma falla.
  if (base >= 45) {
    const muertas = Number(c.contratadosMuertos ?? 0)
    if (muertas > 0) {
      const castigo = Math.min(muertas * 6, 24)
      score -= castigo
      razones.push(`${muertas} bandeja(s) contratada(s) sin un solo mensaje: −${castigo}.`)
    }
    const ociosa = cuentas.find(x => (x.bolsa ?? 0) > 0 && x.pctBolsa !== null && x.pctBolsa < 15)
    if (ociosa) {
      score -= 10
      razones.push(`Consume ${ociosa.pctBolsa!.toFixed(0)}% de su bolsa de mensajes — plan sobredimensionado: −10.`)
    }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), razones }
}

/**
 * Resuelve el módulo de chat de una cuenta.
 * Devuelve null cuando la cuenta no tiene nada de chat que mostrar.
 *
 * @param cortes los cortes que la ficha ya cargó — no se relee el archivo.
 */
export function chatDeCuenta(
  cid: string | null | undefined,
  healthScore: number | null | undefined,
  cortes: CorteCuenta[] = [],
): ChatDeCuenta | null {
  const id = String(cid ?? '').trim()
  if (!id) return null

  const c = CHAT_CLIENTES.find(x => x.cid === id) as unknown as Record<string, unknown> | undefined
  const corteChat = [...cortes].reverse().find(x => esPlanDeChat(x.plan)) ?? null

  // Sin registro en la hoja y sin línea de chat en la factura: no hay módulo.
  if (!c && !corteChat) return null

  const cuentas: CuentaChatwoot[] = (((c?.cuentas ?? []) as Record<string, unknown>[])).map(x => ({
    nombre:      String(x.cuenta ?? '—'),
    id:          (x.cuentaId as number | null) ?? null,
    agentes:     (x.agentes as number | null) ?? null,
    bolsa:       (x.bolsaMensajes as number | null) ?? null,
    pctBolsa:    (x.pctBolsa as number | null) ?? null,
    mensajes:    Number(x.mensajes ?? 0),
    tendencia:   (x.tendencia as string | null) ?? null,
    crecimiento: (x.crecimientoPct as number | null) ?? null,
  }))

  const bandejasContratadas = Number(c?.inboxesContratados ?? 0)
  const agentesContratados  = cuentas.reduce((t, x) => t + (x.agentes ?? 0), 0)
  const bolsaContratada     = cuentas.reduce((t, x) => t + (x.bolsa ?? 0), 0)
  const mensajes            = Number(c?.mensajes ?? 0)

  // Contratado = la factura nombra el plan, o alguna de las tres columnas de
  // contrato de la hoja trae algo. Ninguna se deduce: las tres se llaman así.
  const porFactura = corteChat !== null
  const porHoja    = bandejasContratadas > 0 || agentesContratados > 0 || bolsaContratada > 0
  const contratado = porFactura || porHoja

  if (!contratado && mensajes === 0) return null   // en la hoja, pero en ceros

  const loContratado = [
    bandejasContratadas > 0 && `${bandejasContratadas} bandeja(s)`,
    agentesContratados > 0  && `${agentesContratados} agente(s)`,
    bolsaContratada > 0     && `bolsa de ${bolsaContratada.toLocaleString('es-MX')} mensajes`,
  ].filter(Boolean).join(', ')

  const origen = porFactura && porHoja
      ? `La factura nombra el plan; la hoja reporta ${loContratado} en contrato`
    : porFactura ? 'La factura nombra el plan de chat'
    : porHoja    ? `La hoja de Callpicker Chat reporta ${loContratado} en contrato`
    :              'Tráfico observado en la hoja, sin nada contratado'

  const hsOficial = Number(healthScore ?? 0)
  const { score, razones } = c
    ? ponderar(c, cuentas)
    : { score: null, razones: ['La cuenta se factura con plan de chat pero no aparece en la hoja de uso: no hay con qué medirlo.'] }

  const aplicaPonderacion = contratado && score !== null
  if (!aplicaPonderacion && !contratado) {
    razones.push('Tráfico sin contrato: no pondera la salud — no se castiga un servicio que el cliente no compró.')
  }

  return {
    vinculo: contratado ? 'contratado' : 'trafico_sin_contrato',
    origen,
    planFacturado:  corteChat?.plan ?? null,
    montoFacturado: corteChat?.monto ?? null,
    mesFactura:     corteChat?.mes ?? null,
    periodo:        String(c?.periodo ?? corteChat?.mes ?? '—'),
    semaforo:       String(c?.semaforo ?? 'sin_medicion'),
    motivos:        (c?.motivos as string[] | undefined) ?? [],
    mensajes,
    conversaciones: Number(c?.conversaciones ?? 0),
    cuentas,
    bandejasContratadas,
    bandejasConTrafico:    Number(c?.inboxesConTrafico ?? 0),
    contratadasMuertas:    Number(c?.contratadosMuertos ?? 0),
    sinContratoConTrafico: Number(c?.sinContratoConTrafico ?? 0),
    bandejasConError:      Number(c?.inboxesConError ?? 0),
    score,
    razones,
    hsOficial,
    hsAjustado: aplicaPonderacion
      ? Math.round(hsOficial * (1 - PESO_CHAT) + score! * PESO_CHAT)
      : null,
  }
}
