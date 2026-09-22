/**
 * Resumen de llamadas por cuenta — la versión ligera, para decidir.
 *
 * `lib/llamadas-cuenta.ts` arma la lectura COMPLETA que pinta el panel de una
 * ficha: series por mes, matriz día×hora, destinos. Eso es correcto para una
 * cuenta y caro para doscientas. Aquí solo salen las cuatro cifras que deciden
 * una candidatura, del mismo archivo y con una sola caché de módulo.
 *
 * ── LAS REGLAS DEL MÓDULO, QUE AQUÍ TAMBIÉN VALEN ──────────────────────────
 * 1. Entrante «Lost» y saliente «Lost» NO son lo mismo y jamás se suman. La
 *    entrante es un cliente final al que ninguna extensión contestó; la
 *    saliente es una marcación que no conectó, y eso es normal.
 * 2. `Self_service` NO es una falla: el menú SÍ resolvió la llamada. Va del
 *    lado atendido y nunca en el numerador de lo perdido.
 * 3. El denominador es siempre el total de entrantes.
 * 4. Por debajo de 30 llamadas no se interpreta nada: se devuelve `null`.
 *
 * ── POR QUÉ ESTO Y NO EL «% DE ENTRANTES» DEL CORTE ────────────────────────
 * Porque ese dato se equivoca en las DOS direcciones. Medido el 21 de
 * septiembre de 2026 sobre las 113 cuentas que tienen ambas cifras, **42
 * estaban mal clasificadas**: no veía a Alianza Multimarca —40,935 llamadas
 * sin contestar y un corte que decía 0% de entrantes— y señalaba a Gruas el
 * Toques, que contesta el 96%. Saber cuánto tráfico ENTRA no dice nada sobre
 * si alguien lo está atendiendo.
 */
import path from 'path'

export interface ResumenLlamadas {
  entrantes: number
  /** Entrantes que ninguna extensión contestó. */
  sinContestar: number
  pctSinContestar: number
  /** Resueltas por el menú sin agente. NO son un fallo. */
  menu: number
  pctMenu: number
  buzon: number
  salientes: number
  /** El periodo que de verdad cubre la lectura de esta cuenta. */
  ventana: string
}

interface CuentaCruda {
  cid: string
  corte: string
  ent: { total?: number; tipos?: Record<string, number>; desde?: string; hasta?: string } | null
  sal: { total?: number } | null
}

interface Archivo {
  meta: Record<string, unknown>
  cuentas: Record<string, CuentaCruda>
}

/** Menos de esto en toda la ventana y no hay con qué medir atención. */
export const VOLUMEN_MINIMO = 30

let _cache: Archivo | null = null
let _cargando: Promise<Archivo> | null = null
const VACIO: Archivo = { meta: {}, cuentas: {} }

async function leer(): Promise<Archivo> {
  try {
    const fs = (await import('fs')).default
    const p = path.join(process.cwd(), 'data', 'analisis-llamadas.json')
    if (!fs.existsSync(p)) { _cache = VACIO; return VACIO }
    _cache = JSON.parse(fs.readFileSync(p, 'utf8')) as Archivo
    return _cache
  } catch {
    // Que falte o se corrompa el archivo no puede tumbar el dashboard: sin
    // lectura, las candidaturas que dependen de llamadas simplemente no salen.
    _cache = VACIO
    return VACIO
  }
}

async function cargar(): Promise<Archivo> {
  if (_cache) return _cache
  if (_cargando) return _cargando
  // Carga en vuelo compartida: el dashboard evalúa 221 cuentas en paralelo y
  // sin esto abriría el archivo de 2 MB otras tantas veces.
  _cargando = leer().finally(() => { _cargando = null })
  return _cargando
}

/**
 * Las cifras de una cuenta, o `null` cuando no hay con qué concluir.
 *
 * `null` NO significa que la cuenta atienda bien: significa que no se midió.
 * Quien lo consuma tiene que distinguir las dos cosas.
 */
export async function resumenLlamadas(cid: string | null | undefined): Promise<ResumenLlamadas | null> {
  const k = String(cid ?? '').trim()
  if (!k || k === '0') return null
  const d = await cargar()
  const c = d.cuentas[k]
  if (!c || !c.ent) return null
  const total = c.ent.total ?? 0
  if (total < VOLUMEN_MINIMO) return null
  const t = c.ent.tipos ?? {}
  const perdidas = t.Lost ?? 0
  const menu = t.Self_service ?? 0
  return {
    entrantes: total,
    sinContestar: perdidas,
    pctSinContestar: (100 * perdidas) / total,
    menu,
    pctMenu: (100 * menu) / total,
    buzon: t.Voicemail ?? 0,
    salientes: c.sal?.total ?? 0,
    ventana: `${c.ent.desde ?? '?'} a ${c.ent.hasta ?? '?'}`,
  }
}

/** Cuántas cuentas tienen lectura, para poder decirlo en pantalla. */
export async function cuentasConLectura(): Promise<number> {
  const d = await cargar()
  return Object.keys(d.cuentas).length
}
