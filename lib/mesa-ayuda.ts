/**
 * lib/mesa-ayuda.ts — el estado VIVO de la mesa de ayuda
 *
 * POR QUÉ EXISTE
 * --------------
 * `lib/tickets-data.json` viene del export de Zoho, y ese export SOLO trae
 * tickets CERRADOS: de sus 5,871 filas, dos no tienen fecha de cierre.
 * Mientras tanto la mesa real tiene ~139 abiertos, ~140 en espera y once
 * fuera de SLA.
 *
 * Eso deja al módulo Tickets contando historia y ciego al presente, y deja el
 * KPI `abiertos` de `tickets-cuenta.ts` —que consumen la lista de cuentas, el
 * Radar, el Panel de Asesores y el contexto de Atlas— valiendo cero siempre.
 * Un indicador que nunca cambia enseña a no mirarlo.
 *
 * Aquí entra la otra mitad: los cortes diarios que la tarea «Reporte Diario
 * Mesa de Ayuda» genera de lunes a viernes, extraídos por
 * `scripts/gen-mesa-ayuda.py` a `data/mesa-ayuda/AAAA-MM-DD.json`.
 *
 * LO QUE CUBRE Y LO QUE NO — y esto se dice en pantalla, no solo aquí:
 *   SÍ  los tickets FUERA DE SLA, con días de atraso, días sin actividad,
 *       estado, responsable y canal. Once hoy.
 *   NO  los ~279 abiertos que aún no vencen. Para ésos hace falta que el
 *       export de Zoho deje de filtrar por cerrado.
 *
 * SE CRUZA POR CID, NUNCA POR NOMBRE. El reporte nombra la cuenta como
 * «12283 – GRUPO 2711» y el generador parte el CID. Cruzar por nombre es lo
 * que falló con GRC, donde «GRUPO 2711» y «GRUPO 2711 (BATERIAS SENDERO)» no
 * empataban y la alerta de churn no disparaba nunca.
 */
import fs from 'fs'
import path from 'path'

export interface TicketVencido {
  folio:         string
  asunto:        string
  contacto:      string
  cid:           string
  cuenta:        string
  vence:         string
  diasSLA:       number | null
  ultimaAct:     string
  diasSinMover:  number | null
  estado:        string
  responsable:   string
  canal:         string
}

export interface CorteMesa {
  fecha:           string
  horaCorte:       string | null
  origen:          string
  kpis: {
    abiertos?: number; enEspera?: number; vencidos?: number
    noAsignados?: number; nuevos24h?: number; cerrados24h?: number
  }
  ticketsVencidos: TicketVencido[]
}

const DIR = path.join(process.cwd(), 'data', 'mesa-ayuda')

/** Todos los cortes, del más viejo al más nuevo. */
function leerCortes(): CorteMesa[] {
  let ficheros: string[]
  try {
    ficheros = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort()
  } catch {
    return []          // sin carpeta todavía: la pantalla lo dirá, no fingirá
  }
  const out: CorteMesa[] = []
  for (const f of ficheros) {
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    } catch {
      /* un corte ilegible no tumba el resto */
    }
  }
  return out
}

let _cortes: CorteMesa[] | null = null
function cortes(): CorteMesa[] {
  if (_cortes === null) _cortes = leerCortes()
  return _cortes
}

/** El corte más reciente, o null si no hay ninguno. */
export function ultimoCorte(): CorteMesa | null {
  const c = cortes()
  return c.length ? c[c.length - 1] : null
}

export interface EstadoMesaCuenta {
  vencidos:       TicketVencido[]
  /** En cuántos de los cortes disponibles esta cuenta ha tenido vencidos. */
  cortesConVencidos: number
  /** Cuántos cortes hay en total, para leer el de arriba como fracción. */
  cortesTotales:  number
  /** El peor: más días fuera de SLA. */
  peor:           TicketVencido | null
  /** Fecha del corte del que sale todo esto. NUNCA se omite: un dato sin
   *  fecha se lee como si fuera de hoy, y puede ser del viernes pasado. */
  fechaCorte:     string | null
}

const VACIO: EstadoMesaCuenta = {
  vencidos: [], cortesConVencidos: 0, cortesTotales: 0, peor: null, fechaCorte: null,
}

/**
 * Lo que la mesa de ayuda sabe HOY de una cuenta.
 *
 * `cortesConVencidos` es lo que ninguna otra fuente da: una cuenta que
 * aparece en 13 de 13 cortes no tuvo un mal día — no ha tenido uno bueno.
 * Eso es lo que convierte un ticket en un problema de relación.
 */
export function mesaDeCuenta(cid: string | null | undefined): EstadoMesaCuenta {
  const todos = cortes()
  if (!todos.length || !cid) return { ...VACIO, cortesTotales: todos.length }
  const c = String(cid).trim()
  if (!c) return { ...VACIO, cortesTotales: todos.length }

  const ultimo = todos[todos.length - 1]
  const vencidos = ultimo.ticketsVencidos.filter(t => t.cid === c)
  const conVencidos = todos.filter(x => x.ticketsVencidos.some(t => t.cid === c)).length

  let peor: TicketVencido | null = null
  for (const t of vencidos) {
    if (!peor || (t.diasSLA ?? 0) > (peor.diasSLA ?? 0)) peor = t
  }
  return {
    vencidos, cortesConVencidos: conVencidos, cortesTotales: todos.length,
    peor, fechaCorte: ultimo.fecha,
  }
}

/** Resumen de toda la mesa, para el encabezado del módulo. */
export function resumenMesa() {
  const u = ultimoCorte()
  const todos = cortes()
  if (!u) {
    return {
      hay: false as const,
      cortes: 0, fecha: null, hora: null,
      vencidos: 0, abiertos: null, enEspera: null, noAsignados: null,
      porCuenta: [] as { cid: string; cuenta: string; folios: number; peorDias: number; rachas: number }[],
    }
  }
  const porCid = new Map<string, { cuenta: string; folios: number; peorDias: number }>()
  for (const t of u.ticketsVencidos) {
    const e = porCid.get(t.cid) ?? { cuenta: t.cuenta, folios: 0, peorDias: 0 }
    e.folios++
    e.peorDias = Math.max(e.peorDias, t.diasSLA ?? 0)
    porCid.set(t.cid, e)
  }
  const porCuenta = Array.from(porCid.entries()).map(([cid, e]) => ({
    cid, ...e,
    rachas: todos.filter(x => x.ticketsVencidos.some(t => t.cid === cid)).length,
  })).sort((a, b) => b.peorDias - a.peorDias)

  return {
    hay: true as const,
    cortes: todos.length,
    fecha: u.fecha,
    hora: u.horaCorte,
    vencidos: u.ticketsVencidos.length,
    abiertos: u.kpis.abiertos ?? null,
    enEspera: u.kpis.enEspera ?? null,
    noAsignados: u.kpis.noAsignados ?? null,
    porCuenta,
  }
}
