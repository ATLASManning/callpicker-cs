/**
 * Orquestador del enriquecimiento.
 *
 * GARANTÍA CENTRAL: la única forma de escribir de este módulo es `insertar()`,
 * que rechaza cualquier tabla fuera de TABLAS_PERMITIDAS. `cuentas` no está en
 * esa lista, así que ninguna ruta de código — ni por error ni por descuido —
 * puede alterar el dato capturado por un KAM.
 *
 * En dry-run no se escribe absolutamente nada: se devuelve la vista previa.
 */
import { supabaseAdmin } from '../supabase'
import type {
  CuentaLectura, Candidato, DecisorCandidato, ResultadoRun, ResumenRun,
  MatchingStatus, NivelConfianza,
} from './tipos'
import { construirCandidato, deduplicar } from './comparar'
import { esValorReal } from './normalizar'
import * as provInterno   from './proveedores/interno'
import * as provSitioWeb  from './proveedores/sitioWeb'
import * as provApify     from './proveedores/apify'
import * as provDecisores from './proveedores/decisores'

/** Lista blanca de escritura. `cuentas` NO está y no debe estarse jamás. */
export const TABLAS_PERMITIDAS = [
  'enriquecimiento_runs',
  'enriquecimiento_candidatos',
  'enriquecimiento_decisores',
  'enriquecimiento_auditoria',
] as const
export type TablaPermitida = (typeof TABLAS_PERMITIDAS)[number]

export class EscrituraProhibidaError extends Error {
  constructor(tabla: string) {
    super(`Escritura bloqueada sobre "${tabla}": el módulo de enriquecimiento ` +
          `solo puede escribir en ${TABLAS_PERMITIDAS.join(', ')}.`)
    this.name = 'EscrituraProhibidaError'
  }
}

export function assertTablaPermitida(tabla: string): asserts tabla is TablaPermitida {
  if (!(TABLAS_PERMITIDAS as readonly string[]).includes(tabla)) {
    throw new EscrituraProhibidaError(tabla)
  }
}

/** Único punto de escritura del módulo. Idempotente por dedupe_key. */
async function insertar(tabla: string, filas: Record<string, unknown>[]): Promise<number> {
  assertTablaPermitida(tabla)
  if (!filas.length) return 0
  const conflicto = tabla === 'enriquecimiento_candidatos' || tabla === 'enriquecimiento_decisores'
  const q = conflicto
    ? supabaseAdmin.from(tabla).upsert(filas, { onConflict: 'dedupe_key', ignoreDuplicates: true })
    : supabaseAdmin.from(tabla).insert(filas)
  const { data, error } = await q.select('id')
  if (error) throw new Error(`Insert en ${tabla}: ${error.message}`)
  return data?.length ?? 0
}

export const CAMPOS_LECTURA =
  'id, consecutivo, cid, empresa, asesor, estado, contacto_nombre, contacto_cargo, ' +
  'contacto_tel, contacto_email, contactos_json, giro, tamano_empresa, total_empleados, ' +
  'num_oficinas, pagina_web, direccion_fiscal, observaciones_kam'

export interface OpcionesRun {
  ejecutadoPor: string
  asesor?:      string
  cuentaIds?:   string[]
  limite?:      number
  dryRun?:      boolean
  /** Prioriza las cuentas con más huecos (por defecto sí). */
  priorizarIncompletas?: boolean
}

/** Cuántos campos del alcance le faltan a una cuenta. */
export function huecos(c: CuentaLectura): number {
  const campos = [
    c.contacto_nombre, c.contacto_cargo, c.contacto_tel, c.contacto_email,
    c.giro, c.tamano_empresa, c.total_empleados, c.num_oficinas, c.pagina_web,
  ]
  let n = campos.filter(v => !esValorReal(v)).length
  if ((c.contactos_json?.length ?? 0) < 2) n++
  return n
}

function resumenVacio(): ResumenRun {
  return {
    cuentas_procesadas: 0, candidatos: 0, decisores: 0,
    por_matching: { coincide: 0, complementa: 0, conflicto: 0, nuevo: 0, sin_evidencia: 0 },
    por_confianza: { confirmado: 0, alta: 0, probable: 0, debil: 0 },
    por_campo: {}, conflictos: 0, sin_evidencia: 0,
    campos_no_verificables: [], errores: [],
    proveedores_usados: [], proveedores_no_disponibles: [],
  }
}

export async function ejecutarEnriquecimiento(opts: OpcionesRun): Promise<ResultadoRun> {
  const dryRun  = opts.dryRun !== false          // seguro por defecto
  const limite  = Math.min(Math.max(opts.limite ?? 10, 1), 100)
  const inicio  = new Date().toISOString()
  const resumen = resumenVacio()

  // ── Lectura de cartera (SELECT puro) ──────────────────────────────────────
  let q = supabaseAdmin.from('cuentas').select(CAMPOS_LECTURA)
  if (opts.asesor)             q = q.eq('asesor', opts.asesor)
  if (opts.cuentaIds?.length)  q = q.in('id', opts.cuentaIds)
  else                         q = q.in('estado', ['activo', 'en_riesgo'])

  const { data, error } = await q
  if (error) throw new Error(`Lectura de cuentas: ${error.message}`)

  let cuentas = (data ?? []) as unknown as CuentaLectura[]
  if (opts.priorizarIncompletas !== false && !opts.cuentaIds?.length) {
    cuentas = cuentas.sort((a, b) => huecos(b) - huecos(a))
  }
  cuentas = cuentas.slice(0, limite)

  // ── Registro de la corrida (solo en modo real) ────────────────────────────
  const proveedores = [
    { nombre: provInterno.NOMBRE,  version: provInterno.VERSION,  disponible: true },
    { nombre: provSitioWeb.NOMBRE, version: provSitioWeb.VERSION, disponible: true },
    { nombre: provApify.NOMBRE,    version: provApify.VERSION,    disponible: provApify.disponible() },
    { nombre: provDecisores.NOMBRE, version: provDecisores.VERSION,
      disponible: process.env.ENRIQUECIMIENTO_DECISORES === '1' },
  ]
  resumen.proveedores_usados        = proveedores.filter(p => p.disponible).map(p => p.nombre)
  resumen.proveedores_no_disponibles = proveedores.filter(p => !p.disponible).map(p => p.nombre)

  let runId: string | null = null
  if (!dryRun) {
    const { data: run, error: runErr } = await supabaseAdmin
      .from('enriquecimiento_runs')
      .insert({
        ejecutado_por: opts.ejecutadoPor,
        alcance: { asesor: opts.asesor ?? null, cuenta_ids: opts.cuentaIds ?? null, limite },
        dry_run: false, estado: 'en_curso', proveedores,
      })
      .select('id').single()
    if (runErr) throw new Error(`No se pudo abrir la corrida: ${runErr.message}`)
    runId = run.id as string
  }

  // ── Enriquecimiento por cuenta ────────────────────────────────────────────
  const candidatos: Candidato[] = []
  const decisores:  DecisorCandidato[] = []
  const noVerificables = new Set<string>()

  for (const cuenta of cuentas) {
    // 1. Interno — sin red, máxima confianza
    try {
      for (const h of provInterno.buscar(cuenta)) {
        candidatos.push(construirCandidato(cuenta, h))
      }
    } catch (e) {
      resumen.errores.push({ cuenta: cuenta.empresa, proveedor: 'interno', detalle: String(e) })
    }

    // 2. Sitio oficial
    if (esValorReal(cuenta.pagina_web)) {
      try {
        const r = await provSitioWeb.buscar(cuenta)
        for (const h of r.hallazgos) candidatos.push(construirCandidato(cuenta, h))
        if (r.bloqueado) {
          noVerificables.add(`${cuenta.empresa}: el sitio oficial bloquea el acceso automatizado (no se elude)`)
        }
      } catch (e) {
        resumen.errores.push({ cuenta: cuenta.empresa, proveedor: 'sitio_web', detalle: String(e) })
      }
    } else {
      noVerificables.add(`${cuenta.empresa}: sin sitio web registrado, no hay fuente oficial que consultar`)
    }

    // 3. Apify (si hay credencial)
    if (provApify.disponible()) {
      try {
        for (const h of await provApify.buscar(cuenta)) {
          candidatos.push(construirCandidato(cuenta, h))
        }
      } catch (e) {
        resumen.errores.push({ cuenta: cuenta.empresa, proveedor: 'apify', detalle: String(e) })
      }
    }

    /* 4. Mapa de decisores — DESACTIVADO por medición, no por falta de código.
     * Se midió sobre 35 sitios de la cartera (1 Sep 2026): el 91 % no publica
     * a su equipo, y el 9 % restante solo produjo falsos positivos ("Río
     * Churubusco" como CTO, "Bolsa Mexicana" como fundadora). El add-on de
     * leads de pago de Apify tampoco devolvió personas. Activarlo costaría
     * fetches extra para llenar la ficha de ruido.
     * Para reactivar: `ENRIQUECIMIENTO_DECISORES=1` y revisar el rendimiento
     * antes de una corrida masiva. Ver docs/ENRIQUECIMIENTO.md §10. */
    if (process.env.ENRIQUECIMIENTO_DECISORES === '1' && esValorReal(cuenta.pagina_web)) {
      try {
        decisores.push(...await provDecisores.buscar(cuenta))
      } catch (e) {
        resumen.errores.push({ cuenta: cuenta.empresa, proveedor: 'decisores', detalle: String(e) })
      }
    }

    resumen.cuentas_procesadas++
  }

  // ── Consolidación ─────────────────────────────────────────────────────────
  const finales = deduplicar(candidatos).filter(c => c.matching_status !== 'sin_evidencia')
  for (const c of deduplicar(candidatos)) {
    resumen.por_matching[c.matching_status as MatchingStatus]++
    resumen.por_confianza[c.confianza_nivel as NivelConfianza]++
    resumen.por_campo[c.campo] = (resumen.por_campo[c.campo] ?? 0) + 1
  }
  resumen.candidatos    = finales.length
  resumen.decisores     = decisores.length
  resumen.conflictos    = resumen.por_matching.conflicto
  resumen.sin_evidencia = resumen.por_matching.sin_evidencia
  resumen.campos_no_verificables = Array.from(noVerificables)

  // ── Persistencia (solo modo real) ─────────────────────────────────────────
  if (!dryRun && runId) {
    await insertar('enriquecimiento_candidatos', finales.map(c => ({
      cuenta_id: c.cuenta_id, asesor: c.asesor, run_id: runId, campo: c.campo,
      valor_original_snapshot: c.valor_original_snapshot,
      valor_candidato: c.valor_candidato, valor_normalizado: c.valor_normalizado,
      confianza_score: c.confianza_score, confianza_nivel: c.confianza_nivel,
      estado_verificacion: c.estado_verificacion,
      fuente_tipo: c.fuente_tipo, fuente_nombre: c.fuente_nombre, fuente_url: c.fuente_url,
      evidencia: c.evidencia, consultado_en: c.consultado_en,
      matching_status: c.matching_status, proposed_action: c.proposed_action,
      dedupe_key: c.dedupe_key,
    })))

    if (decisores.length) {
      await insertar('enriquecimiento_decisores', decisores.map(d => ({
        cuenta_id: d.cuenta_id, asesor: d.asesor, run_id: runId,
        persona_nombre: d.persona_nombre, cargo: d.cargo, area: d.area,
        rol_decision: d.rol_decision, tipo_contacto: d.tipo_contacto,
        email: d.email, telefono: d.telefono,
        confianza_score: d.confianza_score, estado_verificacion: d.estado_verificacion,
        fuente_url: d.fuente_url, fuente_nombre: d.fuente_nombre,
        evidencia: d.evidencia, consultado_en: d.consultado_en, dedupe_key: d.dedupe_key,
      })))
    }

    await supabaseAdmin.from('enriquecimiento_runs')
      .update({ terminado_en: new Date().toISOString(), estado: 'completado', resumen })
      .eq('id', runId)
  }

  return {
    run_id: runId, dry_run: dryRun,
    iniciado_en: inicio, terminado_en: new Date().toISOString(),
    ejecutado_por: opts.ejecutadoPor,
    alcance: { asesor: opts.asesor, cuenta_ids: opts.cuentaIds, limite },
    candidatos: finales, decisores, resumen,
  }
}
