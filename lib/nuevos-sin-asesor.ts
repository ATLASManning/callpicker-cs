import path from 'path'
import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { fechaDeXlsx } from '@/lib/fecha-xlsx'

/**
 * lib/nuevos-sin-asesor.ts — CLIENTES GRANDES QUE NADIE ESTÁ ATENDIENDO
 *
 * Encargo de dirección, 16 oct 2026: «cada que identifiques un nuevo cliente
 * que facture arriba de $3,500, sea en Activaciones 2.0 o en facturación,
 * genera una alerta en el Dashboard… con la leyenda: se pide revisar si a esta
 * cuenta se le asigna un Asesor».
 *
 * ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR ESTO ────────────────────────────────
 * `scripts/mide-nuevos-sin-asesor.py`, sobre los datos reales:
 *
 *   FACTURACIÓN (GRC)   149 CID por encima del umbral · 0 sin asesor
 *   ACTIVACIONES        143 por encima del umbral · 72 sin cuenta
 *
 * Y de esos 72, por antigüedad de su primer pago:
 *
 *   últimos 90 días ....  1      ← esto es la alerta
 *   hasta 180 días .....  2
 *   hasta un año .......  5
 *   más viejos ......... 64      ← esto es un pasivo, no una novedad
 *
 * Por eso la alerta mira una VENTANA y no el histórico: 72 avisos en un globo
 * no son un aviso, son una lista que nadie abre. Los antiguos no se esconden
 * —el panel dice cuántos hay— pero no compiten con el que acaba de entrar.
 *
 * ── POR QUÉ EL CRUCE ES DELICADO ──────────────────────────────────────────
 * El .xlsx de activaciones NO trae CID: su columna `ID` es el folio de la
 * activación, no el del cliente. Así que el cruce con la cartera sólo puede
 * ser por NOMBRE, y el nombre cambia entre sistemas: «FINSUS CRÉDITO AL
 * CONSUMO» en activaciones es «Finsus Growth» en la cartera, con asesora
 * asignada. Cruzando el nombre entero salía como huérfana y no lo es.
 *
 * De ahí los tres intentos de `cruzar()` y, sobre todo, la tercera categoría:
 * `parecida` no afirma que esté, dice que se parece a una que está. Un aviso
 * que acusa de huérfana a una cuenta atendida se aprende a ignorar, y entonces
 * deja de servir para la que sí lo está.
 */

/** Por encima de esto, dirección quiere saberlo. */
export const UMBRAL_NUEVO = 3500

/** La ventana de «nuevo». 90 días es un trimestre: lo que cabe en una
 *  conversación de seguimiento sin que suene a arqueología. */
export const DIAS_NUEVO = 90

export interface ClienteSinAsesor {
  /** De dónde salió: decide qué significa el importe. */
  fuente: 'activacion' | 'facturacion'
  cliente: string
  /** En activaciones es el PRIMER PAGO; en facturación, el MRR del GRC.
   *  No son lo mismo y la pantalla lo rotula distinto. */
  importe: number
  /** Fecha del primer pago. `null` cuando el archivo no la trae. */
  fecha: string | null
  dias: number | null
  cid: string | null
  /** `sin_cuenta`  no cruza con nada de la cartera.
   *  `sin_asesor`  cruza, pero su campo `asesor` está vacío.
   *  `parecida`    se parece a una cuenta existente: hay que confirmarlo. */
  veredicto: 'sin_cuenta' | 'sin_asesor' | 'parecida'
  /** Con qué cuenta se parece, cuando `veredicto` es `parecida`. */
  seParece?: string
}

export interface NuevosSinAsesor {
  /** Los de la ventana. Es lo que se muestra. */
  nuevos: ClienteSinAsesor[]
  /** Cuántos quedan fuera de la ventana, para decirlo sin listarlos. */
  antiguos: number
  /** Cuántos se parecen a una cuenta existente y hay que confirmar. */
  porConfirmar: number
  umbral: number
  dias: number
  /** Qué se pudo leer. Si una fuente falla se DICE, no se calla: un cero
   *  silencioso aquí se lee como «no hay ninguno». */
  leyó: { activaciones: boolean; facturacion: boolean }
}

/* ── Normalización de nombres ──────────────────────────────────────────── */

function norm(s: string | null | undefined): string {
  let t = String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  for (const ruido of [' SA DE CV', ' S A DE C V', ' SAPI', ' S DE RL', ' SRL',
                       ' DE CV', ' SA', '.', ',', '-']) {
    t = t.split(ruido).join(' ')
  }
  return t.split(/\s+/).filter(Boolean).join(' ')
}

/** Palabras que no distinguen a nadie: casi toda razón social las lleva. */
const VACIAS = new Set(['GRUPO', 'SERVICIOS', 'COMERCIALIZADORA', 'CORPORATIVO',
  'MEXICO', 'INTERNACIONAL', 'NACIONAL', 'SOLUCIONES', 'DEL', 'LOS', 'LAS'])

function tokens(s: string | null | undefined): string[] {
  return norm(s).split(' ').filter(t => t.length > 3 && !VACIAS.has(t))
}

/**
 * La fecha del primer pago, venga como venga.
 *
 * ── POR QUÉ HAY TRES FORMAS ───────────────────────────────────────────────
 * Medido sobre las 143 activaciones por encima del umbral: **94 traen una
 * fecha de verdad y 49 la traen como TEXTO** en formato `10-Dec-2025`. La
 * primera versión sólo entendía el número de serie de Excel, así que esas 49
 * se quedaban sin fecha — y como «sin fecha» entraba en la ventana por no
 * poder descartarla, el globo anunciaba 32 clientes nuevos donde había UNO.
 *
 * Un aviso que multiplica por treinta lo que pasa es peor que no tenerlo: se
 * lee una vez, se comprueba, y ya nadie lo vuelve a mirar.
 *
 * LA FUNCIÓN YA NO VIVE AQUÍ: la necesitaba también el módulo de Activaciones
 * y se movió entera a `lib/fecha-xlsx.ts`. Copiarla habría sido la segunda
 * versión de algo que ya se equivocó una vez.
 */
const fechaDe = fechaDeXlsx

function diasDesde(iso: string | null, hoy: string): number | null {
  if (!iso) return null
  const f = iso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null
  const a = Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10))
  const b = Date.UTC(+hoy.slice(0, 4), +hoy.slice(5, 7) - 1, +hoy.slice(8, 10))
  return Math.round((b - a) / 86400000)
}

/* ── El detector ───────────────────────────────────────────────────────── */

export async function nuevosSinAsesor(): Promise<NuevosSinAsesor> {
  const hoy = hoyEnMexico()
  const vacio: NuevosSinAsesor = {
    nuevos: [], antiguos: 0, porConfirmar: 0,
    umbral: UMBRAL_NUEVO, dias: DIAS_NUEVO,
    leyó: { activaciones: false, facturacion: false },
  }

  /* La cartera, para cruzar. */
  let cuentas: { empresa: string | null; cid: string | null; asesor: string | null }[] = []
  try {
    cuentas = await traerPorPaginas<{ empresa: string | null; cid: string | null; asesor: string | null }>(
      (d, h) => supabaseAdmin.from('cuentas').select('empresa, cid, asesor').range(d, h))
  } catch {
    /* Sin cartera no se puede decir quién está huérfano, y decir que hay cero
       sería afirmar lo contrario de lo que se sabe. Se devuelve vacío con las
       dos fuentes en `false`, y la pantalla dice que no se pudo medir. */
    return vacio
  }

  const porCid = new Map<string, typeof cuentas[number]>()
  const porNombre = new Map<string, typeof cuentas[number]>()
  const porToken = new Map<string, typeof cuentas[number]>()
  for (const c of cuentas) {
    const k = String(c.cid ?? '').trim()
    if (k) porCid.set(k, c)
    porNombre.set(norm(c.empresa), c)
    for (const t of tokens(c.empresa)) if (!porToken.has(t)) porToken.set(t, c)
  }

  const cruzar = (cid: string | null, nombre: string):
      { veredicto: ClienteSinAsesor['veredicto'] | 'atendida'; seParece?: string } => {
    const k = String(cid ?? '').trim()
    const c = (k && porCid.get(k)) || porNombre.get(norm(nombre))
    if (c) {
      return { veredicto: String(c.asesor ?? '').trim() ? 'atendida' : 'sin_asesor' }
    }
    for (const t of tokens(nombre)) {
      const p = porToken.get(t)
      if (p) return { veredicto: 'parecida', seParece: String(p.empresa ?? '') }
    }
    return { veredicto: 'sin_cuenta' }
  }

  const todos: ClienteSinAsesor[] = []
  let porConfirmar = 0
  const leyó = { activaciones: false, facturacion: false }

  /* ── FACTURACIÓN: el MRR institucional del GRC ────────────────────────
     Aquí el cruce SÍ es por CID, así que es fiable. Medido el 16 oct: 149
     por encima del umbral y ninguno sin asesor — la alerta nace en cero por
     esta vía, y eso está bien: significa que hoy la cartera los cubre. */
  try {
    const fs = (await import('fs')).default
    const p = path.join(process.cwd(), 'data', 'grc-zoho.json')
    if (fs.existsSync(p)) {
      const J = JSON.parse(fs.readFileSync(p, 'utf8')) as {
        filas?: { cid?: string | number; cliente?: string; empresa?: string
                  mrrIni?: number; mrrFin?: number; verificacion?: string }[]
      }
      const acum = new Map<string, { mrr: number; cliente: string }>()
      for (const f of J.filas ?? []) {
        const cid = String(f.cid ?? '').trim()
        if (!cid) continue
        let v = Number(f.mrrFin ?? 0)
        if (!(v > 0) && f.verificacion === 'sigue_viva') v = Number(f.mrrIni ?? 0)
        if (!(v > 0)) continue
        const r = acum.get(cid) ?? { mrr: 0, cliente: String(f.cliente ?? f.empresa ?? '') }
        r.mrr += v
        acum.set(cid, r)
      }
      for (const [cid, r] of acum) {
        if (r.mrr < UMBRAL_NUEVO) continue
        const { veredicto, seParece } = cruzar(cid, r.cliente)
        if (veredicto === 'atendida') continue
        if (veredicto === 'parecida') { porConfirmar++; continue }
        todos.push({ fuente: 'facturacion', cliente: r.cliente, importe: r.mrr,
                     fecha: null, dias: null, cid, veredicto })
      }
      leyó.facturacion = true
    }
  } catch { /* se queda en false y la pantalla lo dice */ }

  /* ── ACTIVACIONES: el PRIMER PAGO ────────────────────────────────────
     Sin CID en el archivo, así que el cruce es por nombre con sus tres
     intentos. El importe es con lo que ENTRÓ, no lo que vale hoy, y el
     panel lo rotula así. [[activaciones-fuente]] */
  try {
    const fs = (await import('fs')).default
    const p = path.join(process.cwd(), 'data', 'activaciones.xlsx')
    if (fs.existsSync(p)) {
      const xlsx = (await import('xlsx')).default
      const wb = xlsx.readFile(p)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: true })
      for (const r of filas) {
        const monto = Number(r['1er Pago'] ?? 0)
        if (!(monto >= UMBRAL_NUEVO)) continue
        const cliente = String(r['Cliente'] ?? '').trim()
        if (!cliente) continue
        const { veredicto, seParece } = cruzar(null, cliente)
        if (veredicto === 'atendida') continue
        if (veredicto === 'parecida') { porConfirmar++; continue }
        const iso = fechaDe(r['Fecha 1er Pago'])
        todos.push({ fuente: 'activacion', cliente, importe: monto,
                     fecha: iso, dias: diasDesde(iso, hoy), cid: null,
                     veredicto, seParece })
      }
      leyó.activaciones = true
    }
  } catch { /* idem */ }

  /* ── QUÉ ENTRA EN LA VENTANA ──────────────────────────────────────────
   *
   * Sólo lo que TIENE fecha y cae dentro. Lo que llega de facturación no la
   * tiene —el GRC da un MRR vigente, no una fecha de alta— y ésos sí entran
   * siempre: que una cuenta grande no tenga asesor es noticia el día que se
   * detecta, no cuando empezó.
   *
   * Lo que viene de ACTIVACIONES sin fecha legible NO entra, y aquí está la
   * lección: la primera versión las metía «por no poder descartarlas» y el
   * globo decía 32 donde había 1. Prudencia mal entendida: ante la duda, no
   * se infla el aviso, se cuenta aparte. Van con los antiguos. */
  const dentro = todos.filter(c =>
    c.fuente === 'facturacion' || (c.dias !== null && c.dias <= DIAS_NUEVO))
  const fuera = todos.length - dentro.length

  dentro.sort((a, b) => b.importe - a.importe)
  return { nuevos: dentro, antiguos: fuera, porConfirmar,
           umbral: UMBRAL_NUEVO, dias: DIAS_NUEVO, leyó }
}
