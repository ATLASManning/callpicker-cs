/**
 * lib/catalogo-cuentas.ts — TODAS LAS CUENTAS CON LAS QUE SE PUEDE TRABAJAR.
 *
 * ── EL PROBLEMA ───────────────────────────────────────────────────────────
 * Reuniones y Anexos sólo dejaban elegir cuentas de la **cartera CS**: 224.
 * Callpicker factura a **2,726**. Una cuenta como ProMujer —convenio firmado
 * hasta 2028, $4,983 de MRR— no está en la cartera, así que no se le podía
 * registrar una reunión ni colgarle un documento. El dato no se guardaba mal:
 * no se podía capturar, que es peor, porque no deja ni rastro de que faltó.
 *
 * Instrucción de dirección (José Manuel, 5 nov 2026): «En el apartado de
 * Reuniones y Anexos permite el ingreso de información de todas las cuentas,
 * puedes cruzar con el apartado informe de cortes los CID y nombre de cuentas».
 *
 * ── POR QUÉ ESTO VIVE EN UN SOLO ARCHIVO ──────────────────────────────────
 * Porque son DOS pantallas y DOS rutas de API las que tienen que entender la
 * misma cosa. Cada una armando su propia unión es la receta de las «paletas
 * gemelas» que este repo ya pagó varias veces: dos catálogos que empiezan
 * iguales y divergen en el primer cambio. Aquí viven la unión, la regla de
 * desempate y el formato del valor que viaja en el formulario.
 *
 * ── LAS DOS LLAVES, Y POR QUÉ NO SE MEZCLAN ───────────────────────────────
 * Una cuenta de la cartera se amarra por `cuenta_id` (FK real). Una que sólo
 * existe en los cortes no tiene fila en `cuentas`, así que se amarra por
 * `cid`. El `<select>` manda UNA cadena que dice cuál de las dos es, y el
 * servidor la interpreta con `interpretaValor()` — nunca adivinando por la
 * forma del texto.
 *
 * Lo que NO se hace jamás: amarrar por nombre. «Neruc», «Grupo NERUC» y
 * «Neruc Sede Central» son la misma cuenta y no cruzan entre sí; y al revés,
 * «Centro para la Mujer» y «Promujer» son distintas y un parecido las junta.
 */
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'

export interface OpcionCuenta {
  /** Lo que viaja en el formulario: `cuenta:<uuid>` o `cid:<cid>`. */
  valor:       string
  cuentaId:    string | null
  cid:         string | null
  empresa:     string
  consecutivo: string | null
  asesor:      string | null
  /** ¿La lleva un asesor de CS? De esto depende quién puede ESCRIBIRLE. */
  enCartera:   boolean
}

export interface CatalogoCuentas {
  opciones: OpcionCuenta[]
  meta: {
    enCartera:      number
    soloFacturacion: number
    total:          number
    /** CIDs de los cortes descartados por estar ya en la cartera. */
    deduplicados:   number
    /** CIDs de cortes con más de un nombre escrito. Se elige uno; ver abajo. */
    nombresEnConflicto: number
    origenCortes:   string
    cortesLeidos:   boolean
  }
}

/* ── El valor que viaja en el formulario ──────────────────────────────────── */

export function valorDeCuenta(cuentaId: string): string { return `cuenta:${cuentaId}` }
export function valorDeCid(cid: string): string { return `cid:${cid}` }

/**
 * Parte el valor del formulario en sus dos llaves posibles.
 *
 * Devuelve `null` cuando no reconoce el formato, y el que llama DEBE tratar
 * eso como un 400. Antes de que existiera este prefijo, un `cuenta_id` suelto
 * y un CID se distinguían «porque uno parece UUID»: eso es adivinar, y el día
 * que un CID tenga forma de UUID se amarra el documento a otra cuenta.
 */
export function interpretaValor(valor: string | null | undefined):
  { cuentaId: string; cid: null } | { cuentaId: null; cid: string } | null {
  const v = String(valor ?? '').trim()
  if (v.startsWith('cuenta:')) {
    const id = v.slice(7).trim()
    return id ? { cuentaId: id, cid: null } : null
  }
  if (v.startsWith('cid:')) {
    const cid = v.slice(4).trim()
    return cid ? { cuentaId: null, cid } : null
  }
  return null
}

/* ── Los cortes como catálogo de cuentas ──────────────────────────────────── */

interface DeCortes { cid: string; empresa: string; variantes: number }

/**
 * CID → nombre, desde `data/cortes-facturacion.xlsx`.
 *
 * ── EL DESEMPATE, QUE NO ES UN DETALLE ────────────────────────────────────
 * 28 CIDs traen más de un nombre escrito: «Datasafe» y «datasafe», «The Palm»
 * / «ZD - The Palm» / «ZD - The Palms». Si se deja al azar del recorrido, el
 * mismo cliente aparece un día con un nombre y otro día con otro, y dos
 * capturas del mismo cliente se leen como dos clientes.
 *
 * La regla es: **gana el nombre del corte MÁS RECIENTE**, y entre cortes de
 * la misma fecha, el primero alfabéticamente. Determinista y explicable; no
 * «el último que se leyó».
 */
async function cuentasDeCortes(): Promise<{ filas: DeCortes[]; leido: boolean }> {
  try {
    const xlsx = (await import('xlsx')).default
    const fs   = (await import('fs')).default
    const ruta = path.join(process.cwd(), 'data', 'cortes-facturacion.xlsx')
    if (!fs.existsSync(ruta)) return { filas: [], leido: false }

    const wb  = xlsx.readFile(ruta)
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const raw: Record<string, unknown>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

    /** cid → nombre → el corte más reciente en que aparece ese nombre */
    const por = new Map<string, Map<string, number>>()
    for (const r of raw) {
      const cid = String(r['CID'] ?? '').replace(/\D/g, '').trim()
      const nom = String(r['Nombre del Cliente'] ?? '').trim()
      if (!cid || !nom) continue
      const serial = typeof r['Fecha de corte'] === 'number'
        ? r['Fecha de corte'] as number
        : parseFloat(String(r['Fecha de corte'])) || 0
      const m = por.get(cid) ?? new Map<string, number>()
      m.set(nom, Math.max(m.get(nom) ?? 0, serial))
      por.set(cid, m)
    }

    const filas: DeCortes[] = []
    for (const [cid, nombres] of por) {
      const elegido = [...nombres.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'),
      )[0][0]
      filas.push({ cid, empresa: elegido, variantes: nombres.size })
    }
    return { filas, leido: true }
  } catch {
    /* Un fallo leyendo el Excel NO puede devolver «no hay cuentas»: eso se
       lee igual que «la facturación no tiene a nadie». Se marca `leido:
       false` y la pantalla lo dice. [[feedback-cero-sin-medicion]] */
    return { filas: [], leido: false }
  }
}

/* ── La unión ─────────────────────────────────────────────────────────────── */

export async function catalogoCuentas(): Promise<CatalogoCuentas> {
  const { data: cuentas, error } = await supabaseAdmin
    .from('cuentas')
    .select('id, cid, empresa, consecutivo, asesor')

  if (error || !cuentas) {
    throw new Error(`No se pudo leer la cartera: ${error?.message ?? 'sin datos'}`)
  }

  const opciones: OpcionCuenta[] = []
  const cidsEnCartera = new Set<string>()

  for (const c of cuentas) {
    const empresa = String(c.empresa ?? '').trim()
    if (!c.id || !empresa) continue
    const cid = String(c.cid ?? '').replace(/\D/g, '').trim() || null
    if (cid) cidsEnCartera.add(cid)
    opciones.push({
      valor: valorDeCuenta(String(c.id)),
      cuentaId: String(c.id),
      cid,
      empresa,
      consecutivo: c.consecutivo ?? null,
      asesor: c.asesor ?? null,
      enCartera: true,
    })
  }

  const { filas, leido } = await cuentasDeCortes()
  let deduplicados = 0
  let nombresEnConflicto = 0
  for (const f of filas) {
    if (f.variantes > 1) nombresEnConflicto++
    /* La cartera MANDA sobre los cortes: su nombre es el que mantiene
       dirección y es el que ya aparece en el resto del tablero. Un CID que
       está en las dos no puede salir dos veces o el selector ofrece la misma
       cuenta dos veces y cada captura cae en una. */
    if (cidsEnCartera.has(f.cid)) { deduplicados++; continue }
    opciones.push({
      valor: valorDeCid(f.cid),
      cuentaId: null,
      cid: f.cid,
      empresa: f.empresa,
      consecutivo: null,
      asesor: null,
      enCartera: false,
    })
  }

  opciones.sort((a, b) =>
    Number(b.enCartera) - Number(a.enCartera) ||
    a.empresa.localeCompare(b.empresa, 'es'))

  return {
    opciones,
    meta: {
      enCartera: opciones.filter(o => o.enCartera).length,
      soloFacturacion: opciones.filter(o => !o.enCartera).length,
      total: opciones.length,
      deduplicados,
      nombresEnConflicto,
      origenCortes: 'data/cortes-facturacion.xlsx',
      cortesLeidos: leido,
    },
  }
}
