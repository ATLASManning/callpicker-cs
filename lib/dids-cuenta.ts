/**
 * DIDs por cuenta — los números que Callpicker le entrega a cada cliente.
 *
 * Lee `data/dids.json`, que genera `scripts/gen-dids.py` desde el export
 * «DIDs en Callpicker.xlsx». El JSON ya viene agrupado por CID y con la
 * codificación reparada, así que aquí no hay que parsear Excel ni adivinar
 * charsets: solo leer, cachear y formatear para pantalla.
 *
 * ── DOS REGLAS QUE NO SE TOCAN ─────────────────────────────────────────────
 *
 * 1. **El CID dice a qué cliente corresponde.** Nunca el nombre. Un cruce por
 *    nombre mezclaría cuentas: hay 660 CIDs con varias etiquetas distintas.
 *
 * 2. **La etiqueta se muestra TAL CUAL.** La columna «CUENTA» del export no es
 *    la razón social: es como el cliente bautizó ESE número —una sede, un
 *    área, una persona, una campaña— y puede diferir a propósito. Instrucción
 *    de dirección (21 sep 2026): no se renombra ni se normaliza.
 */
import path from 'path'

export interface Did {
  /** El número tal como viene: solo dígitos, con lada de país. */
  numero: string
  /** Cómo lo llama el cliente. Puede venir vacío. */
  etiqueta: string
  /** El número listo para leerse en pantalla. */
  display: string
}

interface ArchivoDids {
  totalNumeros: number
  totalCids: number
  etiquetasReparadas: number
  porCid: Record<string, { n: string; e: string }[]>
}

let _cache: ArchivoDids | null = null
let _cacheTime = 0
const CACHE_TTL = 30 * 60 * 1000   // los números cambian poco; media hora sobra

/* Carga en vuelo compartida: sin esto, un Promise.all sobre las 220 cuentas
 * abre el archivo 220 veces. Mismo patrón que lib/cortes-cuenta.ts. */
let _cargando: Promise<ArchivoDids> | null = null

const VACIO: ArchivoDids = { totalNumeros: 0, totalCids: 0, etiquetasReparadas: 0, porCid: {} }

async function leerArchivo(): Promise<ArchivoDids> {
  try {
    const fs = (await import('fs')).default
    const p = path.join(process.cwd(), 'data', 'dids.json')
    if (!fs.existsSync(p)) { _cache = VACIO; _cacheTime = Date.now(); return VACIO }
    const d = JSON.parse(fs.readFileSync(p, 'utf-8')) as ArchivoDids
    _cache = d
    _cacheTime = Date.now()
    return d
  } catch {
    // Que falte o se corrompa el archivo no puede tumbar la ficha de cuenta:
    // el módulo simplemente no pinta números.
    _cache = VACIO
    _cacheTime = Date.now()
    return VACIO
  }
}

async function cargar(): Promise<ArchivoDids> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  if (_cargando) return _cargando
  _cargando = leerArchivo().finally(() => { _cargando = null })
  return _cargando
}

/**
 * Deja el número legible SIN asumir que es mexicano.
 *
 * 149 de los 16,534 no lo son —Panamá (+507), Ecuador (+593), 800 de Estados
 * Unidos—. Forzarles el formato de 52 los escribiría mal, así que solo se
 * agrupa bonito lo que de verdad es `52` + diez dígitos y lo demás se deja
 * con su lada delante.
 */
export function formateaDid(numero: string): string {
  const n = String(numero ?? '').replace(/\D/g, '')
  if (!n) return ''
  if (n.length === 12 && n.startsWith('52')) {
    const r = n.slice(2)
    // CDMX (55), Monterrey (81) y Guadalajara (33) llevan lada de 2 dígitos;
    // el resto del país la lleva de 3.
    return ['55', '81', '33'].includes(r.slice(0, 2))
      ? `+52 ${r.slice(0, 2)} ${r.slice(2, 6)} ${r.slice(6)}`
      : `+52 ${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6)}`
  }
  if (n.length === 11 && n.startsWith('1')) {
    return `+1 ${n.slice(1, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
  }
  return `+${n}`
}

/** Los números de una cuenta, por CID. Orden: el del archivo. */
export async function didsDeCuenta(cid: string | null | undefined): Promise<Did[]> {
  const c = String(cid ?? '').trim()
  if (!c || c === '0') return []
  const d = await cargar()
  const filas = d.porCid[c]
  if (!filas) return []
  return filas.map(f => ({
    numero: f.n,
    etiqueta: f.e ?? '',
    display: formateaDid(f.n),
  }))
}

/* La búsqueda por número —pegar un número entrante y caer en la cuenta— se
   apoyaría en este mismo JSON, pero no se escribe hasta que se pida: una
   función exportada que nadie llama es lastre que se queda sin probar. */
