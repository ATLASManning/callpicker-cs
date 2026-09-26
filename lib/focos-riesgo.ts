/**
 * lib/focos-riesgo.ts — los focos que obligan actividad SAC.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * Primero: «seguimiento a las cuentas que tienen auditoría y están en riesgo,
 * con actividades SAC. Objetivo prevenir churn.»
 * Después, al medir el bajo consumo: «Todas, son focos que deben atenderse. Son
 * cuentas que tienen un riesgo y ellos son los responsables.»
 * Y el límite: «Solo sigue cumpliéndose la regla: churn confirmado NO aplica
 * para actividad SAC.»
 *
 * Nace de ALTERNET: auditoría en junio, baja en septiembre, y CERO actividades
 * SAC en toda su historia. Una auditoría que no se convierte en trabajo
 * asignado es un documento, no una intervención.
 *
 * CUATRO FOCOS, NO UNO — porque no son el mismo problema
 * ------------------------------------------------------
 *   sin_corte       La cuenta ESTÁ ACTIVA, aparecía en cortes anteriores y
 *                   DESAPARECIÓ del último. Es la señal más fuerte de las
 *                   cuatro: el consumo bajo dice «usa poco»; desaparecer del
 *                   corte puede significar que ya ni se le factura. Al medirlo
 *                   el 25 sep salieron 19, con Alianza Multimarca ($26,049) y
 *                   LINEACEL ($13,802) entre ellas.
 *   auditoria       Auditoría entregada y la cuenta en riesgo. 22 cuentas.
 *   consumo_cero    Consumo de voz en 0% contra una base medible.
 *   consumo_bajo    Por debajo del umbral, con base medible.
 *
 * LO QUE NUNCA ENTRA
 * ------------------
 * Churn confirmado y cancelación reportada. Es regla expresa y NO se toca: a
 * una cuenta ya perdida no se le pide trabajo de retención — lo que le
 * corresponde es la Aclaración de baja, que es otra cosa y va por su lado.
 * Estas tareas se saltan `evaluarElegibilidad` a propósito (igual que las
 * aclaraciones: que la cuenta esté en riesgo ES el motivo), así que el candado
 * de churn se pone aquí explícitamente o no se pone en ningún lado.
 *
 * LA TRAMPA DEL CHAT, QUE ESTE TABLERO YA PISÓ
 * --------------------------------------------
 * 46 de las 222 cuentas tienen chat activo. Su consumo de VOZ puede ser cero y
 * el servicio estar vivísimo: HomiRent salió marcada «Sin uso» teniendo 163,063
 * mensajes. Por eso la cuenta con chat SÍ genera foco —dirección dijo todas—
 * pero el texto de la tarea NO afirma que no use el servicio: dice que la voz
 * está en cero y que hay que verificar el chat antes de concluir. Mismo foco
 * atendido, sin una afirmación falsa que le quite credibilidad al tablero.
 * Ver [[feedback-servicios-no-inferir]].
 */
import { todosLosCortes, ultimoMesDeCorte, type CorteCuenta } from './cortes-cuenta'
import { bloqueoComercialDeCuenta } from './elegibilidad'
import { auditadasEnRiesgo } from './seguimiento-auditoria'
import { normalizarNombre } from './elegibilidad'

export const TIPO_FOCO = 'foco_riesgo' as const

/** Por debajo de esto se considera consumo bajo. Sobre la base REAL de minutos. */
export const UMBRAL_CONSUMO_BAJO = 20

export type ClaseFoco = 'sin_corte' | 'auditoria' | 'consumo_cero' | 'consumo_bajo'

/**
 * El orden en que se drenan. `sin_corte` primero porque es la señal más fuerte
 * y la más reversible: si la cuenta dejó de facturarse, cada semana cuenta.
 */
export const ORDEN_FOCO: ClaseFoco[] = ['sin_corte', 'auditoria', 'consumo_cero', 'consumo_bajo']

export interface CuentaParaFoco {
  id: string
  cid: string | null
  consecutivo: string | null
  empresa: string
  asesor: string | null
  estado: string | null
  health_score: number | null
  facturacion: number | null
  tiene_chat_activo?: boolean | null
}

export interface Foco {
  cuenta: CuentaParaFoco
  clase: ClaseFoco
  /** Una línea para el asunto y los listados. */
  titulo: string
  /** El cuerpo de la actividad: qué se sabe y qué hay que hacer. */
  detalle: string
  /** Para ordenar dentro de la misma clase: primero lo que más factura. */
  peso: number
}

function pct(c: CorteCuenta): number | null {
  return c.base && c.base > 0 ? (100 * c.cons) / c.base : null
}

/**
 * Los focos de una cartera. Se pasan las cuentas ya leídas para no consultar
 * Supabase desde aquí: esta función es pura salvo por la lectura cacheada del
 * Excel de cortes.
 */
export async function focosDeRiesgo(cuentas: CuentaParaFoco[]): Promise<Foco[]> {
  const mapa = await todosLosCortes()
  const ultimoMes = await ultimoMesDeCorte()

  const auditadas = new Set(auditadasEnRiesgo().map(a => normalizarNombre(a.nombre)))
  const out: Foco[] = []

  for (const c of cuentas) {
    /* CANDADO DE CHURN. Regla expresa de dirección, y va primero que todo lo
       demás: una cuenta con churn confirmado o cancelación reportada NO recibe
       actividad SAC, le toca la Aclaración de baja. */
    const bloqueo = bloqueoComercialDeCuenta(c as never)
    if (bloqueo.codigos.includes('churn_grc') || bloqueo.codigos.includes('cancelacion')) continue

    // Tampoco las que ya no son cartera viva: dormidas y canceladas.
    const estado = String(c.estado ?? '').trim()
    if (estado === 'cancelado' || estado === 'hibernacion') continue

    const fact = Number(c.facturacion ?? 0)
    const cid = String(c.cid ?? '').trim()
    const cortes = cid ? (mapa.get(cid) ?? []) : []
    const chat = Boolean(c.tiene_chat_activo)

    /* ── 1. Desapareció del último corte ──────────────────────────────
       Solo cuenta si ANTES sí aparecía: una cuenta que nunca ha estado en
       ningún corte es un problema de cruce de CID, no una señal de negocio, y
       mezclarlas ahogaría la señal real. Al medirlo, 44 activas no aparecen
       nunca y 19 sí aparecían y dejaron de hacerlo: son estas 19. */
    if (cortes.length > 0 && ultimoMes && cortes[cortes.length - 1].mes < ultimoMes) {
      out.push({
        cuenta: c, clase: 'sin_corte', peso: fact,
        titulo: `Desapareció del corte de ${ultimoMes}`,
        detalle:
          `La cuenta está ACTIVA y venía apareciendo en los cortes de facturación ` +
          `—el último suyo es de ${cortes[cortes.length - 1].mes}— pero NO aparece en el de ` +
          `${ultimoMes}.\n\n` +
          `Esto es más fuerte que un consumo bajo: puede significar que el servicio dejó de ` +
          `facturarse. Verifica con facturación si sigue activa y con el cliente si hubo un ` +
          `cambio que no nos avisaron. Si ya no hay servicio, hay que documentarlo; si sí lo ` +
          `hay, el corte tiene un hueco que corregir.`,
      })
      continue   // una cuenta, un foco: el más grave manda
    }

    /* ── 2. Auditoría entregada y en riesgo ───────────────────────── */
    if (auditadas.has(normalizarNombre(c.empresa))) {
      continue   // lo cubre construirSeguimientosAuditoria, que ya trae los hallazgos
    }

    /* ── 3 y 4. Consumo ───────────────────────────────────────────── */
    const ultimo = cortes.length ? cortes[cortes.length - 1] : null
    if (!ultimo || ultimo.mes !== ultimoMes) continue
    const p = pct(ultimo)
    if (p === null) continue      // sin base medible: no es 0%, es no medible

    if (p < 0.0001) {
      out.push({
        cuenta: c, clase: 'consumo_cero', peso: fact,
        titulo: chat ? 'Cero consumo de VOZ (tiene chat activo)' : 'Cero consumo',
        detalle: chat
          ? `En el corte de ${ultimoMes} esta cuenta registra CERO minutos de voz sobre una ` +
            `base de ${ultimo.base} (plan «${ultimo.plan}»).\n\n` +
            `OJO ANTES DE LLAMAR: esta cuenta tiene CHAT ACTIVO. Cero voz NO significa que no ` +
            `use el servicio — puede estar operando todo por chat. Verifica su uso de chat ` +
            `primero y lleva ese dato a la conversación. Si el chat también está bajo, ahí sí ` +
            `hay un problema de adopción que atender.`
          : `En el corte de ${ultimoMes} esta cuenta registra CERO minutos consumidos sobre una ` +
            `base de ${ultimo.base} (plan «${ultimo.plan}»).\n\n` +
            `Paga y no usa. Averigua por qué: ¿cambió el proceso, se fueron los usuarios, hay ` +
            `una falla técnica que nadie reportó? Una cuenta que paga sin usar es la que menos ` +
            `resistencia pone a cancelar.`,
      })
      continue
    }

    if (p < UMBRAL_CONSUMO_BAJO) {
      out.push({
        cuenta: c, clase: 'consumo_bajo', peso: fact,
        titulo: `Consumo al ${p.toFixed(0)}% de su plan`,
        detalle:
          `En el corte de ${ultimoMes} consumió ${Math.round(ultimo.cons)} minutos de una base ` +
          `de ${ultimo.base} (plan «${ultimo.plan}»): ${p.toFixed(1)}%.` +
          (chat ? ` La cuenta también tiene CHAT ACTIVO, así que parte de su operación puede ` +
                  `estar ahí — revísalo antes de concluir.` : '') +
          `\n\nUn plan muy por encima del uso es una conversación de renovación perdida antes ` +
          `de empezar. Verifica si el plan quedó grande, si hay usuarios que dejaron de usarlo, ` +
          `o si el volumen se fue a otro canal. Trae una propuesta, no solo el dato.`,
      })
    }
  }

  return out
}

/** Reparto por asesor y clase, para poder decir el tamaño antes de generarlo. */
export function repartoFocos(focos: Foco[]): Record<string, Record<string, number>> {
  const r: Record<string, Record<string, number>> = {}
  for (const f of focos) {
    const a = f.cuenta.asesor || '[sin asesor]'
    r[a] = r[a] ?? {}
    r[a][f.clase] = (r[a][f.clase] ?? 0) + 1
  }
  return r
}

/**
 * Ordena el acervo: primero la clase más grave, y dentro de ella lo que más
 * factura. Es el orden en que se irán entregando.
 */
export function ordenarFocos(focos: Foco[]): Foco[] {
  return focos.slice().sort((a, b) => {
    const ia = ORDEN_FOCO.indexOf(a.clase)
    const ib = ORDEN_FOCO.indexOf(b.clase)
    if (ia !== ib) return ia - ib
    return b.peso - a.peso
  })
}

/** El texto que va en la actividad. */
export function descripcionFoco(f: Foco): string {
  return [
    `[FOCO·${f.clase.toUpperCase()}] ${f.titulo} — ${f.cuenta.empresa}`,
    '',
    f.detalle,
    '',
    'QUÉ HAY QUE DEJAR REGISTRADO:',
    '  · Con quién hablaste: nombre, puesto y por qué vía.',
    '  · Qué se acordó, con fecha. Si no hubo acuerdo, cuál es el siguiente paso.',
    '',
    'Esta actividad NO vence y NO se vuelve a generar. Tampoco ocupa uno de los ' +
    'cuatro lugares semanales.',
  ].join('\n')
}
