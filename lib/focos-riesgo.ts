/**
 * lib/focos-riesgo.ts — TODAS las cuentas vivas reciben seguimiento, por turno.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Necesito que se dé seguimiento a TODAS, si es por tickets, si es por falla,
 * si es por downgrade, si es por bajo consumo, etc., pero todas deben tener
 * seguimiento.» Y el límite que se mantiene: «churn confirmado NO aplica para
 * actividad SAC.»
 *
 * POR QUÉ ESTE DISEÑO Y NO EL QUE TENÍA ANTES
 * -------------------------------------------
 * La primera versión SELECCIONABA las cuentas «en riesgo» con umbrales que yo
 * inventé: consumo bajo 20%, tantos tickets, tantas fallas. Se probó contra el
 * churn que ya ocurrió —52 bajas de 222 cuentas— y el resultado fue demoledor:
 * **el puntaje compuesto no separaba mejor que el azar** (en el top 10 cazaba 1
 * de 52 cuando el azar daría 5%). Ver scripts/valida-riesgo.py.
 *
 * Así que en vez de inventar otro puntaje se midió, señal por señal, la tasa de
 * baja CON y SIN esa señal (scripts/senales-que-predicen.py, corte de julio):
 *
 *   sin seguimiento registrado   28% vs 13%   ×2.25  <- la más fuerte
 *   más de 60 días sin contacto  28% vs 14%   ×2.02
 *   uso por debajo del 40%       28% vs 18%   ×1.55
 *   health score < 60            24% vs 22%   ×1.08  <- casi no distingue
 *   15 o más tickets             25% vs 23%   ×1.07  <- no predice
 *   consumo en 0%                23% vs 23%   ×0.98  <- no predice
 *   2 o más fallas               12% vs 25%   ×0.46  <- predice AL REVÉS
 *   desapareció del corte         0% vs 26%   ×0.00  <- predice AL REVÉS
 *
 * Dos lecciones que cambiaron el código:
 *
 *   1. **Lo que más predice la baja es no tener seguimiento registrado.** No es
 *      burocracia: es el mejor indicador disponible. Por eso la regla ya no
 *      selecciona un subconjunto «en riesgo» — cubre a TODAS por turno, que es
 *      exactamente lo que apaga esa señal en la cartera entera.
 *
 *   2. **Una cuenta que reporta fallas se va MENOS.** Tiene sentido de negocio:
 *      el que reclama todavía habla contigo; el que se va en silencio es el
 *      peligroso. Las fallas y los tickets siguen siendo motivo de conversación
 *      —dirección lo pidió— pero NO mandan en el orden, porque no predicen.
 *
 * Con la honestidad debida: es correlación, no causa. Puede ser que no se
 * registre sobre cuentas que ya venían muriendo. Pero en cualquiera de las dos
 * lecturas es el mejor dato que hay, y medir cada mes es barato.
 *
 * LA CADENCIA
 * -----------
 * Son 135 cuentas vivas: Dan 54, Fátima 45, Claudia 36. Y el punto de partida
 * mide el problema: **Dan tiene 27 de sus 54 sin un solo seguimiento en toda su
 * historia**, Fátima 10 de 45 y Claudia 9 de 36.
 *
 * El objetivo es que ninguna pase de 60 días sin contacto registrado, así que
 * el tamaño del lote se calcula por cartera en vez de ser un número fijo: una
 * cartera de 54 necesita más por semana que una de 36 para dar la misma vuelta.
 */
import { todosLosCortes, ultimoMesDeCorte, type CorteCuenta } from './cortes-cuenta'
import { bloqueoComercialDeCuenta, normalizarNombre } from './elegibilidad'
import { auditadasEnRiesgo } from './seguimiento-auditoria'
import { ticketStatsCuenta } from './tickets-cuenta'

export const TIPO_FOCO = 'foco_riesgo' as const

/** Nadie debe pasar de aquí sin contacto registrado. Medido: ×2.02 de riesgo. */
export const DIAS_SIN_CONTACTO_LIMITE = 60

/** Semanas de la vuelta completa. 60 días redondeados a semanas enteras. */
const SEMANAS_DE_VUELTA = 8

/**
 * El lote NO descuenta las cuatro rutinarias, y es una corrección deliberada.
 *
 * La primera versión restaba 4 suponiendo que el lote rutinario ya cubría
 * cuentas. No las cubre para este fin: las cuatro rutinarias son de COMPLETAR
 * PERFIL Y RADAR —trabajo de dato, no conversación con el cliente— y además su
 * selección es otra, así que no garantizan tocar cuentas distintas. Si se
 * descuentan, la vuelta no cierra: a Claudia le tocarían 2 por semana, 16 en
 * ocho semanas, para 36 cuentas. La mitad se quedaría sin seguimiento.
 */
const MIN_POR_SEMANA = 2
const MAX_POR_SEMANA = 8

/**
 * Las clases, EN EL ORDEN EN QUE SE ATIENDEN.
 *
 * El orden sale de los lifts medidos, no de la intuición. `sin_contacto`
 * primero porque es la señal más fuerte que existe; `sin_corte` casi al final
 * porque de las 22 cuentas que desaparecieron del corte NO se fue ninguna —era
 * mi foco de máxima prioridad y estaba al revés.
 */
export type ClaseFoco =
  | 'nunca_tocada'    // jamás tuvo un seguimiento registrado
  | 'sin_contacto'    // pasó de los 60 días
  | 'uso_bajo'        // por debajo del 40% de su base real
  | 'auditoria'       // auditoría entregada y cuenta en riesgo
  | 'soporte'         // tickets o fallas que conviene conversar
  | 'sin_corte'       // desapareció del último corte
  | 'rotacion'        // le toca su turno y no tiene ninguna señal encendida

export const ORDEN_FOCO: ClaseFoco[] = [
  'nunca_tocada', 'sin_contacto', 'uso_bajo', 'auditoria', 'soporte', 'sin_corte', 'rotacion',
]

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
  titulo: string
  detalle: string
  /** Días desde el último seguimiento registrado. `null` = nunca hubo. */
  diasSinContacto: number | null
  peso: number
}

function uso(c: CorteCuenta): number | null {
  return c.base && c.base > 0 ? (100 * c.cons) / c.base : null
}

/**
 * Cuántos seguimientos por semana necesita esta cartera para que nadie pase de
 * 60 días. Escala con el tamaño: una cartera de 54 no se cubre al mismo ritmo
 * que una de 36.
 *
 * Al 25 sep 2026: Dan 54 vivas -> 7 por semana · Fátima 45 -> 6 · Claudia 36 -> 5.
 *
 * Si ese ritmo resulta insostenible, la palanca correcta NO es recortar el lote
 * —eso deja cuentas sin cubrir y calladamente rompe la instrucción— sino ampliar
 * la ventana: con 90 días en vez de 60, Dan baja a 5, Fátima a 4 y Claudia a 3.
 * Es una decisión de dirección, y se toma mirando este número.
 */
export function loteSemanal(cuentasVivas: number): number {
  const porSemana = Math.ceil(cuentasVivas / SEMANAS_DE_VUELTA)
  return Math.max(MIN_POR_SEMANA, Math.min(MAX_POR_SEMANA, porSemana))
}

/**
 * Los focos de una cartera: TODAS las cuentas vivas, ordenadas por turno.
 *
 * `ultimoSeguimiento` es un mapa cuenta_id -> 'AAAA-MM-DD' del último
 * seguimiento registrado. Se recibe ya leído para no consultar Supabase desde
 * aquí.
 */
export async function focosDeRiesgo(
  cuentas: CuentaParaFoco[],
  ultimoSeguimiento: Map<string, string>,
  hoy: string,
): Promise<Foco[]> {
  const mapa = await todosLosCortes()
  const ultimoMes = await ultimoMesDeCorte()
  const auditadas = new Set(auditadasEnRiesgo().map(a => normalizarNombre(a.nombre)))
  const out: Foco[] = []

  for (const c of cuentas) {
    /* CANDADO DE CHURN, primero que nada. Regla expresa y no se toca: a una
       cuenta ya perdida no se le pide trabajo de retención — le corresponde la
       Aclaración de baja, que va por su lado y fuera de este presupuesto.
       Estas actividades NO pasan por `evaluarElegibilidad` a propósito, así que
       el candado se pone aquí o no se pone en ningún lado. */
    const bloqueo = bloqueoComercialDeCuenta(c as never)
    if (bloqueo.codigos.includes('churn_grc') || bloqueo.codigos.includes('cancelacion')) continue

    const estado = String(c.estado ?? '').trim()
    if (estado !== 'activo' && estado !== 'en_riesgo') continue

    const fact = Number(c.facturacion ?? 0)
    const cid = String(c.cid ?? '').trim()
    const cortes = cid ? (mapa.get(cid) ?? []) : []
    const ultimoCorte = cortes.length ? cortes[cortes.length - 1] : null
    const u = ultimoCorte ? uso(ultimoCorte) : null
    const chat = Boolean(c.tiene_chat_activo)

    const ult = ultimoSeguimiento.get(c.id) ?? ''
    let dias: number | null = null
    if (ult) {
      const ms = new Date(hoy + 'T12:00:00').getTime() - new Date(ult + 'T12:00:00').getTime()
      dias = Math.floor(ms / 86400000)
    }

    const tk = ticketStatsCuenta(c.cid, c.empresa)

    /* ── La razón de la conversación ──────────────────────────────────
       Se elige UNA: la que manda según lo medido. Las demás se mencionan
       dentro del texto, porque todas son motivo de conversación aunque no
       decidan el turno. */
    let clase: ClaseFoco = 'rotacion'
    let titulo = 'Le toca su turno de seguimiento'
    if (!ult) {
      clase = 'nunca_tocada'
      titulo = 'Nunca ha tenido un seguimiento registrado'
    } else if (dias !== null && dias > DIAS_SIN_CONTACTO_LIMITE) {
      clase = 'sin_contacto'
      titulo = `${dias} días sin contacto registrado`
    } else if (u !== null && u < 40) {
      clase = 'uso_bajo'
      titulo = `Usa el ${u.toFixed(0)}% de su plan`
    } else if (auditadas.has(normalizarNombre(c.empresa))) {
      clase = 'auditoria'
      titulo = 'Auditoría entregada y cuenta en riesgo'
    } else if (tk.total >= 15 || tk.fallas >= 2) {
      clase = 'soporte'
      titulo = `${tk.total} tickets · ${tk.fallas} fallas`
    } else if (ultimoCorte && ultimoMes && ultimoCorte.mes < ultimoMes) {
      clase = 'sin_corte'
      titulo = `No aparece en el corte de ${ultimoMes}`
    }

    /* El contexto: todo lo que hay que saber antes de llamar, en un solo sitio,
       para que el asesor no tenga que ir a buscarlo a cuatro pantallas. */
    const ctx: string[] = []
    ctx.push(ult
      ? `Último seguimiento registrado: ${ult} (${dias} días).`
      : 'NUNCA se le ha registrado un seguimiento.')
    if (ultimoCorte) {
      ctx.push(u !== null
        ? `Corte de ${ultimoCorte.mes}: usó ${Math.round(ultimoCorte.cons)} de ${ultimoCorte.base} min (${u.toFixed(0)}%), plan «${ultimoCorte.plan}».`
        : `Corte de ${ultimoCorte.mes}: plan «${ultimoCorte.plan}», sin base de minutos medible.`)
      if (ultimoMes && ultimoCorte.mes < ultimoMes) {
        ctx.push(`OJO: no aparece en el corte de ${ultimoMes}. Verifica con facturación si sigue activa.`)
      }
    } else {
      ctx.push('Sin cortes de facturación cruzados por su CID.')
    }
    if (tk.comoCruzo === 'ninguno') {
      ctx.push('Sin tickets cruzados en el export de Zoho (puede operar con otro CID).')
    } else {
      ctx.push(`Tickets históricos: ${tk.total}, de los cuales ${tk.fallas} marcados como falla.`)
    }
    if (chat) ctx.push('Tiene CHAT activo: su consumo de voz no cuenta toda su operación.')
    if (auditadas.has(normalizarNombre(c.empresa))) {
      ctx.push('Tiene auditoría entregada — ábrela en /auditoria antes de llamar.')
    }

    out.push({
      cuenta: c, clase, titulo, diasSinContacto: dias, peso: fact,
      detalle: ctx.join('\n  · '),
    })
  }

  return out
}

/**
 * El turno. Primero la clase que más predice, y dentro de ella la que lleva más
 * tiempo sin contacto; a igualdad, la que más factura.
 */
export function ordenarFocos(focos: Foco[]): Foco[] {
  return focos.slice().sort((a, b) => {
    const ia = ORDEN_FOCO.indexOf(a.clase)
    const ib = ORDEN_FOCO.indexOf(b.clase)
    if (ia !== ib) return ia - ib
    const da = a.diasSinContacto ?? 99999
    const db = b.diasSinContacto ?? 99999
    if (da !== db) return db - da
    return b.peso - a.peso
  })
}

export function repartoFocos(focos: Foco[]): Record<string, Record<string, number>> {
  const r: Record<string, Record<string, number>> = {}
  for (const f of focos) {
    const a = f.cuenta.asesor || '[sin asesor]'
    r[a] = r[a] ?? {}
    r[a][f.clase] = (r[a][f.clase] ?? 0) + 1
  }
  return r
}

export function descripcionFoco(f: Foco): string {
  return [
    `[SEGUIMIENTO·${f.clase.toUpperCase()}] ${f.titulo} — ${f.cuenta.empresa}`,
    '',
    'LO QUE SE SABE DE ESTA CUENTA HOY:',
    `  · ${f.detalle}`,
    '',
    'QUÉ HAY QUE HACER:',
    '  · Contactar al responsable y conversar lo de arriba.',
    '  · Acordar UNA acción concreta con fecha, no una intención.',
    '',
    'QUÉ HAY QUE DEJAR REGISTRADO:',
    '  · Con quién hablaste: nombre, puesto y por qué vía.',
    '  · Qué se acordó, con fecha. Si no hubo acuerdo, cuál es el siguiente paso.',
    '  · Si no lograste contacto, dilo: cuántas veces lo intentaste y cuándo.',
    '',
    'Por qué importa registrarlo, con números: de las cuentas SIN seguimiento',
    'registrado se dio de baja el 28%; de las que sí lo tienen, el 13%. Es la',
    'señal más fuerte que tenemos — más que el health score, más que los tickets.',
    '',
    'Esta actividad NO vence y NO ocupa uno de los cuatro lugares semanales.',
  ].join('\n')
}
