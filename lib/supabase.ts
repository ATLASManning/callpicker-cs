import { createClient } from '@supabase/supabase-js'
import type { Cuenta, Seguimiento, Oportunidad, Ticket, SemaforoAsesor } from './types'
import { getSemaforo, getSemaforoCuenta } from './types'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

// Bypass Next.js 14 data cache — every query must hit Supabase fresh
const noStoreConfig = {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: 'no-store' }),
  },
}

// Public client (browser-safe)
export const supabase = createClient(URL, ANON, noStoreConfig)

// Admin client (server-only — bypasses RLS + Next.js data cache)
export const supabaseAdmin = SERVICE
  ? createClient(URL, SERVICE, noStoreConfig)
  : supabase

// ── Cuentas ─────────────────────────────────────────────────────────────────

/**
 * Solo los CID de un asesor. Existe para ordenar por riesgo sin pagar el
 * `select('*')` + enriquecimiento de Zoho de getCuentas(): la ficha necesita
 * saber en qué lugar de la cola va esta cuenta, no los datos de las otras.
 */
export async function getCidsDeAsesor(asesor: string | null | undefined): Promise<string[]> {
  if (!asesor) return []
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('cid')
    .eq('asesor', asesor)
    .not('cid', 'is', null)
  if (error) throw error
  return (data ?? [])
    .map(r => String((r as { cid: unknown }).cid ?? '').trim())
    .filter(Boolean)
}

export async function getCuentas(filters?: {
  asesor?: string
  semaforo?: string
  estado?: string
  search?: string
}): Promise<Cuenta[]> {
  let q = supabaseAdmin
    .from('cuentas')
    .select('*')
    .order('facturacion', { ascending: false })

  if (filters?.asesor)  q = q.eq('asesor', filters.asesor)
  if (filters?.estado)  q = q.eq('estado', filters.estado)
  if (filters?.search)  q = q.ilike('empresa', `%${filters.search}%`)

  const { data, error } = await q
  if (error) throw error

  let result = (data ?? []) as Cuenta[]

  if (filters?.semaforo) {
    // Mismo criterio que pinta la tabla: si el filtro usara solo el HS, buscar
    // "Verde" seguiría devolviendo cuentas canceladas con HS alto.
    result = result.filter(c => getSemaforoCuenta(c) === filters.semaforo)
  }

  // Regla 30 Ago 2026 (fuente única): la facturación visible SIEMPRE es la viva
  // de Zoho — la columna guardada envejece (GRUPO FRISA: $1,622 guardados vs
  // $16,539 reales con subcuentas). Se sobreescribe aquí, en el hub, para que
  // todas las ventanas que consumen cuentas queden alimentadas en automático.
  /* EL ULTIMO CONTACTO, DERIVADO, EN EL MISMO HUB QUE LA FACTURACION.
     `dias_sin_actividad` vale 0 en las 222 cuentas —se siembra al alta y nadie
     la sincroniza—, y es la columna con la que /seguimiento decide la urgencia
     y la portada pinta «Dias sin act.». Aqui se calcula de verdad, para que
     toda ventana que consuma cuentas quede alimentada sin repetir la logica.

     Se SUMAN dos fuentes y no se toma solo la viva, y esta medido: 21 cuentas
     sin ningun seguimiento SI traen `ultimo_contacto`, y en 32 el valor
     guardado es mas nuevo que el ultimo seguimiento. La columna no es un
     espejo desfasado: tiene informacion que ninguna fuente viva tiene. Se
     toma la fecha MAYOR de las dos, que nunca pierde.

     `dias_sin_contacto` es `null` cuando NUNCA hubo contacto —63 de las 192
     cuentas vivas—, nunca 0: un cero ahi significaria «hablamos hoy» y mandaria
     esas cuentas al final de cualquier orden por urgencia.

     `dias_sin_actividad` se deja intacta como columna de base; lo que cambia es
     que ya nadie DECIDE con ella. */
  try {
    const { ultimoContactoPorCuenta, diasSinContacto } = await import('./contacto-cuenta')
    const guardado = new Map(result.map(c => [String(c.id), c.ultimo_contacto ?? null]))
    const contacto = await ultimoContactoPorCuenta(guardado)
    for (const c of result) {
      const dia = contacto.get(String(c.id)) ?? null
      c.ultimo_contacto = dia
      c.dias_sin_contacto = diasSinContacto(dia)
      /* Y `dias_sin_actividad` —la que leen los quince consumidores que ya
         existen— pasa a traer el numero de verdad, para que empiecen a
         funcionar sin tocarlos uno por uno.

         Para las que NUNCA tuvieron contacto va la ANTIGUEDAD de la cuenta, que
         no es un centinela: es literalmente cuanto lleva siendo cliente sin un
         contacto registrado. Medido: son 42 cuentas vivas, las 42 tienen
         `activo_desde`, la minima lleva 163 dias — asi que las 42 quedan por
         encima de cualquier cuenta contactada, cuyo maximo son 139 dias. Es
         exactamente el orden que hace falta.

         Lo que NO se puede hacer es dejarlas en 0, que es lo que habia: eso las
         manda al FINAL de cualquier orden por urgencia. Para la pantalla la
         diferencia se conserva en `dias_sin_contacto`, que vale `null`. */
      const desdeAlta = diasSinContacto(c.activo_desde)
      c.dias_sin_actividad = c.dias_sin_contacto ?? desdeAlta ?? 0
    }
  } catch { /* si falla, se queda lo guardado: mejor viejo que inventado */ }

  try {
    const { enrichCuentasWithZoho } = await import('./zoho-enrich')
    const enriched = await enrichCuentasWithZoho(result)
    /* `factura_mensual_zoho` YA NO sobreescribe el importe. Venía de una
       búsqueda difusa por nombre que suma todo lo que coincida, y era la razón
       de que Tech People saliera con $55,098 aquí y con $86,737 en Alertas.
       Se conserva el resto del enriquecimiento —semáforo, segmento— y el
       importe lo resuelve la única puerta: el MRR Final del GRC, por CID. */
    const { resolverImportes } = await import('./facturacion-cuenta')
    const conImporte = await resolverImportes(enriched)
    conImporte.sort((a, b) => (b.facturacion ?? 0) - (a.facturacion ?? 0))
    return conImporte
  } catch {
    return result // sin Zoho configurado: se conserva el dato guardado
  }
}

export async function getCuentaById(id: string): Promise<Cuenta | null> {
  // Intentar primero por UUID id
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return data as Cuenta

  // Si no existe por UUID, intentar por consecutivo (para URLs tipo /cuentas/C52)
  const { data: data2, error: error2 } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('consecutivo', id)
    .single()

  if (error2) return null
  return data2 as Cuenta
}

export async function getCuentaByConsecutivo(consecutivo: string): Promise<Cuenta | null> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('consecutivo', consecutivo)
    .single()
  if (error) return null
  return data as Cuenta
}

// Helper: normaliza cualquier id (UUID o consecutivo) al UUID real
export async function normalizeCuentaId(id: string): Promise<string | null> {
  const cuenta = await getCuentaById(id)
  if (!cuenta) return null
  return cuenta.id
}

// Campos que NO existen en la tabla DB (computed por la API o enriquecidos en runtime)
const NON_DB_FIELDS = [
  'health_score',          // GENERATED ALWAYS — Supabase lo rechaza si se envía
  'zoho_tickets',          // enriched por la API, no almacenado
  'mrr_zoho',              // enriched por la API
  'factura_mensual_zoho',  // enriched por la API
  'semaforo_zoho',         // enriched por la API
  'segmento_zoho',         // enriched por la API
] as const

// Columnas JSONB que pueden no existir si la migración 20260716 aún no se ejecutó en Supabase.
// updateCuenta las incluye por defecto y hace fallback automático si el schema las rechaza.
const JSON_MIGRATION_FIELDS = ['contactos_json', 'servicios_json'] as const

function stripNonDbFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj }
  for (const f of NON_DB_FIELDS) delete out[f]
  return out
}

function stripJsonMigrationFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj }
  for (const f of JSON_MIGRATION_FIELDS) delete out[f]
  return out
}

export async function upsertCuenta(cuenta: Partial<Cuenta>): Promise<Cuenta> {
  const payload = stripNonDbFields(cuenta as Record<string, unknown>)
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .upsert(payload, { onConflict: 'consecutivo' })
    .select()
    .single()
  if (error) throw new Error(error.message ?? JSON.stringify(error))
  return data as Cuenta
}

export async function updateCuenta(id: string, changes: Partial<Cuenta>): Promise<Cuenta> {
  const payload = stripNonDbFields(changes as Record<string, unknown>)

  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  // Si el error es por columnas JSONB que aún no existen (migración pendiente),
  // reintenta sin ellas para no bloquear al usuario.
  if (error) {
    const msg = error.message ?? JSON.stringify(error)
    const isMissingJsonCol = JSON_MIGRATION_FIELDS.some(f => msg.includes(f))
    if (isMissingJsonCol) {
      const fallback = stripJsonMigrationFields(payload)
      const { data: d2, error: e2 } = await supabaseAdmin
        .from('cuentas')
        .update(fallback)
        .eq('id', id)
        .select()
        .single()
      if (e2) throw new Error(e2.message ?? JSON.stringify(e2))
      return d2 as Cuenta
    }
    throw new Error(msg)
  }
  return data as Cuenta
}

export async function deleteCuenta(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cuentas')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message ?? JSON.stringify(error))
}

// ── KPIs / Dashboard ────────────────────────────────────────────────────────

/**
 * Los KPIs de la portada, de TODA la cartera o de la de una asesora.
 *
 * El filtro no estaba, y por eso la portada de una asesora mezclaba dos
 * universos sin decirlo: `getCuentas({ asesor })` le daba sus 68 cuentas y
 * `getKPIs()` leía las 192 de la empresa. En la misma pantalla convivían «su»
 * listado y «el» total de facturación, sin una etiqueta que los separara, y las
 * barras de distribución de su cartera sumaban un tercio del alto.
 *
 * EL PREDICADO NO ES EL MISMO QUE EL DE `getCuentas`, y es a propósito.
 * Aquí y en `getSemaforoByAsesor` se mira la cartera VIVA —`activo` y
 * `en_riesgo`, 192 cuentas—, porque un KPI de facturación sobre cuentas
 * canceladas no mide nada. `getCuentas` devuelve TODAS salvo que se le pida un
 * estado: una cuenta dormida o cancelada sigue necesitando seguimiento, es la
 * que hay que recuperar, y se distingue por su semáforo gris, no por su
 * ausencia (ver el comentario de app/seguimiento/page.tsx, 9 sep 2026).
 *
 * Por eso `kpis.total` y `allCuentas.length` no cuadran en la portada, y no
 * deben: uno cuenta cartera viva y el otro todo lo asignado.
 */
export async function getKPIs(filtro?: { asesor?: string }) {
  let q = supabaseAdmin
    .from('cuentas')
    .select('empresa, facturacion, health_score, estado, asesor, notas')
    .in('estado', ['activo', 'en_riesgo'])
  if (filtro?.asesor) q = q.eq('asesor', filtro.asesor)
  const { data } = await q

  // Facturación viva desde Zoho (regla fuente única — ver getCuentas)
  let cuentas = (data ?? []) as Array<{ empresa: string; facturacion: number | null; health_score: number; notas: string | null; factura_mensual_zoho?: number | null }>
  try {
    const { enrichCuentasWithZoho } = await import('./zoho-enrich')
    cuentas = await enrichCuentasWithZoho(cuentas)
  } catch { /* sin Zoho: dato guardado */ }
  /* Mismo criterio que getCuentas y que las alertas: una sola cifra. */
  try {
    const { resolverImportes } = await import('./facturacion-cuenta')
    cuentas = await resolverImportes(cuentas)
  } catch { /* sin GRC: se queda lo que haya */ }
  const total = cuentas.length
  const facturacionTotal = cuentas.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const enRiesgo = cuentas.filter(c => c.health_score < 40).length
  const facturacionRiesgo = cuentas
    .filter(c => c.health_score < 40)
    .reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const saludables = cuentas.filter(c => c.health_score >= 60).length
  const faltaTC = cuentas.filter(c => c.notas?.includes('[FALTA_TC]')).length
  const faltaHS = cuentas.filter(c => c.notas?.includes('[FALTA_HS]')).length

  return { total, facturacionTotal, enRiesgo, facturacionRiesgo, saludables, faltaTC, faltaHS }
}

export async function getSemaforoByAsesor(): Promise<SemaforoAsesor[]> {
  const { data } = await supabaseAdmin
    .from('cuentas')
    .select('empresa, asesor, health_score, facturacion')
    .in('estado', ['activo', 'en_riesgo'])

  // Facturación viva desde Zoho (regla fuente única — ver getCuentas)
  let rows = (data ?? []) as Array<{ empresa: string; asesor: string; health_score: number | null; facturacion: number | null; factura_mensual_zoho?: number | null }>
  try {
    const { enrichCuentasWithZoho } = await import('./zoho-enrich')
    rows = await enrichCuentasWithZoho(rows)
    for (const c of rows) {
      if (c.factura_mensual_zoho != null) c.facturacion = c.factura_mensual_zoho
    }
  } catch { /* sin Zoho: dato guardado */ }

  const map: Record<string, SemaforoAsesor> = {}
  for (const c of rows) {
    if (!map[c.asesor]) {
      map[c.asesor] = {
        asesor: c.asesor,
        verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0,
        total: 0, facturacion_total: 0, facturacion_en_riesgo: 0,
      }
    }
    const m = map[c.asesor]
    const hs = c.health_score ?? 50
    const fac = c.facturacion ?? 0
    m.total++
    m.facturacion_total += fac
    if (hs >= 80)                   m.verde++
    else if (hs >= 60)              m.azul++
    else if (hs >= 40)              m.amarillo++
    else if (hs >= 20)              m.naranja++
    else                            m.rojo++
    if (hs < 40) m.facturacion_en_riesgo += fac
  }
  return Object.values(map).sort((a, b) => b.facturacion_total - a.facturacion_total)
}

// ── Seguimientos ─────────────────────────────────────────────────────────────

export async function getSeguimientos(cuentaId: string): Promise<Seguimiento[]> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as Seguimiento[]
}

/* El tipo vive en lib/anexos.ts, junto al catálogo de temas y la validación de
   formatos; aquí sólo se re-exporta para no duplicar la forma de la fila. */
export type AnexoRow = import('./anexos').Anexo

/**
 * ¿El error dice que la TABLA no existe?
 *
 * SON DOS CÓDIGOS, NO UNO, y confundirlos ya costó una vez. `42P01` es lo que
 * contesta Postgres, pero a través de PostgREST casi nunca se ve: el que llega
 * es **`PGRST205`** — «Could not find the table 'public.X' in the schema
 * cache» — porque PostgREST resuelve la tabla contra su caché de esquema antes
 * de llegar a la base.
 *
 * Comprobado en producción el 1 oct 2026 con la tabla `anexos` sin crear: el
 * código que sólo miraba `42P01` devolvió un 500 en vez del aviso «falta
 * ejecutar la migración», y la pantalla no pudo explicarlo.
 *
 * El repositorio ya conocía `PGRST205` en el Buzón, el Radar y Adopción, cada
 * uno con su propia comprobación suelta. Ésta es la compartida.
 *
 * `42703` (columna inexistente) NO entra aquí: ése sí llega tal cual y
 * significa otra cosa — la tabla existe pero le falta una columna.
 */
export function esTablaInexistente(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code === '42P01' || e.code === 'PGRST205') return true
  return /schema cache/i.test(e.message ?? '')
}

export interface ReunionCuenta {
  id: string
  fecha: string
  titulo: string
  tipo: string | null
  participantes: string | null
  resumen: string | null
  acuerdos: string | null
  proximos_pasos: string | null
}

/**
 * Reuniones de una cuenta, por VÍNCULO REAL (cuenta_id).
 *
 * Devuelve TODAS las vinculadas, no sólo las de tipo `cliente`: una junta de
 * estrategia sobre esta cuenta es contexto que el KAM necesita ver en la ficha.
 * Por eso se trae `tipo` — para que el panel diga cuál fue CON el cliente y
 * cuál fue SOBRE él, en vez de presentarlas todas como reuniones con él.
 *
 * Devuelve [] mientras la migración scripts/migracion-reuniones-cuenta.sql no
 * se haya ejecutado: se prefiere no mostrar nada antes que mostrar reuniones
 * de otro cliente por una coincidencia de nombre. El error 42703 (columna
 * inexistente) se trata como "aún no hay vínculo", no como fallo.
 */
export async function getReunionesDeCuenta(
  cuentaId: string,
): Promise<{ rows: ReunionCuenta[]; vinculoDisponible: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('reuniones')
    .select('id, fecha, titulo, tipo, participantes, resumen, acuerdos, proximos_pasos')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false })
    .limit(50)
  if (error) {
    // 42703 = la columna cuenta_id no existe → migración pendiente.
    // 42P01 = la tabla no existe. En ambos casos NO hay vínculo posible, y la
    // UI debe decirlo en vez de mostrar un "sin reuniones" que parece un dato.
    const sinVinculo = error.code === '42703' || esTablaInexistente(error)
    return { rows: [], vinculoDisponible: !sinVinculo }
  }
  return { rows: (data ?? []) as ReunionCuenta[], vinculoDisponible: true }
}

/**
 * Documentos anexados a una cuenta, por VÍNCULO REAL (cuenta_id).
 *
 * Mismo contrato que `getReunionesDeCuenta`: si la tabla todavía no existe se
 * devuelve `tablaExiste: false` para que la ficha lo DIGA, en vez de pintar un
 * «sin anexos» que se lee como un dato cuando en realidad es un módulo sin
 * instalar.
 */
export async function getAnexosDeCuenta(
  cuentaId: string,
): Promise<{ rows: AnexoRow[]; tablaExiste: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('anexos')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('creado_en', { ascending: false })
    .limit(100)
  if (error) {
    // Dos codigos posibles: ver `esTablaInexistente`.
    return { rows: [], tablaExiste: !esTablaInexistente(error) }
  }
  return { rows: (data ?? []) as AnexoRow[], tablaExiste: true }
}

export async function updateSeguimientoResultado(id: string, resultado: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('seguimientos')
    .update({ resultado })
    .eq('id', id)
  if (error) throw error
}

export async function addSeguimiento(s: Omit<Seguimiento, 'id' | 'created_at'>): Promise<Seguimiento> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data as Seguimiento
}

// ── Oportunidades ────────────────────────────────────────────────────────────

export async function getOportunidades(cuentaId: string): Promise<Oportunidad[]> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as Oportunidad[]
}

export async function upsertOportunidad(o: Partial<Oportunidad>): Promise<Oportunidad> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .upsert(o)
    .select()
    .single()
  if (error) throw error
  return data as Oportunidad
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export async function getTickets(cuentaId: string): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as Ticket[]
}

export async function addTicket(t: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data as Ticket
}

// ── Health Score Snapshot ─────────────────────────────────────────────────────

export async function saveHealthSnapshot(cuentaId: string, cuenta: Cuenta) {
  await supabaseAdmin.from('health_score_historial').insert({
    cuenta_id: cuentaId,
    health_score: cuenta.health_score,
    score_actividad: cuenta.score_actividad,
    score_adopcion: cuenta.score_adopcion,
    score_pago: cuenta.score_pago,
    score_relacional: cuenta.score_relacional,
    semaforo: getSemaforo(cuenta.health_score),
  })
}

export async function getHealthHistorial(cuentaId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('health_score_historial')
      .select('fecha, health_score, semaforo')
      .eq('cuenta_id', cuentaId)
      .order('fecha', { ascending: true })
      .limit(12)
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

/**
 * Cuántos registros de adopción tiene la cuenta. Sirve para distinguir
 * "sin módulos activados" de "nadie ha capturado los módulos": el Health
 * Score no debe penalizar la segunda.
 */
export async function getConteoAdopcion(cuentaId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('adopcion_producto')
      .select('id')
      .eq('cuenta_id', cuentaId)
    if (error) return 0
    return data?.length ?? 0
  } catch {
    return 0
  }
}

export type AdopcionRow = {
  cuenta_id: string
  producto: string
  nivel: 'alto' | 'medio' | 'bajo' | 'no_aplica'
  created_at: string
}

/**
 * PostgREST devuelve MIL FILAS COMO MÁXIMO por petición, pase lo que pase y sin
 * avisar: no hay error, no hay bandera, simplemente llegan menos datos de los
 * que hay y el cálculo sigue adelante como si estuviera completo.
 *
 * Ya mordió tres veces. La última, medida el 30 de septiembre de 2026:
 * `adopcion_producto` tiene 1,121 filas y la lectura devolvía 1,000 — 121 filas
 * perdidas en cada carga del tablero, 84 pares cuenta×producto invisibles y 14
 * cuentas con su nivel viejo en pantalla.
 *
 * Por eso esto vive aquí y no dentro de una ruta: el fallo no es de una
 * consulta, es de todas las que no paginan.
 */
export const TOPE_POSTGREST = 1000

/** Tope de seguridad: 50 páginas son 50,000 filas. Si una tabla lo rebasa, el
 *  problema no es la paginación — es que esa consulta no debería traerlo todo. */
const MAX_PAGINAS = 50

/**
 * Trae una tabla entera por páginas, y DICE si no pudo.
 *
 * **Nunca devuelve un resultado parcial.** Un hueco silencioso es peor que un
 * vacío declarado: con la mitad de las filas nadie nota nada y el porcentaje
 * sale mal para siempre.
 *
 * Pero vaciar no basta. Una pantalla que recibe `[]` no sabe si la tabla está
 * vacía o si la lectura reventó, y las dos cosas se ven igual: «sin registros».
 * Eso convierte un fallo de base en un dato falso —«esta persona no usa el
 * tablero»— que es la misma clase de mentira silenciosa que la paginación vino
 * a cerrar. Por eso el motivo sale junto con las filas, y quien tiene a quién
 * decírselo lo dice.
 *
 * Agotar las 50 páginas también cuenta como fallo: 50,000 filas truncadas son
 * un resultado parcial, y esta función no devuelve parciales callados.
 */
export async function traerPaginasConFallo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ filas: T[]; fallo: string | null }> {
  const todo: T[] = []
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const desde = p * TOPE_POSTGREST
    const { data, error } = await pagina(desde, desde + TOPE_POSTGREST - 1)
    if (error) {
      const msg = (error as { message?: string })?.message
      return { filas: [], fallo: msg ?? String(error) }
    }
    if (!data?.length) return { filas: todo, fallo: null }
    todo.push(...data)
    if (data.length < TOPE_POSTGREST) return { filas: todo, fallo: null }
  }
  return {
    filas: [],
    fallo: `se agotaron las ${MAX_PAGINAS} páginas (${MAX_PAGINAS * TOPE_POSTGREST} filas): esta consulta no debería traerlo todo`,
  }
}

/**
 * Lo mismo, tragándose el motivo. Para quien no tiene dónde decirlo —una
 * función que alimenta un render y cuya firma es `Promise<T[]>`.
 *
 * Preferir `traerPaginasConFallo` siempre que haya una respuesta HTTP que
 * pueda llevar el error, o una pantalla que pueda distinguir «vacío» de «se
 * rompió». Usar ésta es aceptar que un fallo se verá como una tabla vacía.
 */
export async function traerPorPaginas<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  return (await traerPaginasConFallo(pagina)).filas
}

/**
 * Todos los registros de adopción (todas las cuentas). Usado por el Dashboard
 * para calcular tasas de adopción reales por asesor — reemplaza los flags
 * booleanos de `cuentas` (tiene_chat_activo, etc.) que nunca se capturan.
 */
export async function getAdopcionProductoAll(): Promise<AdopcionRow[]> {
  try {
    return await traerPorPaginas<AdopcionRow>((desde, hasta) =>
      supabaseAdmin
        .from('adopcion_producto')
        .select('cuenta_id, producto, nivel, created_at')
        .range(desde, hasta),
    )
  } catch {
    return []
  }
}

// ── Junta Semanal — tipos extendidos ─────────────────────────────────────────

export type CuentaMin = {
  id: string
  empresa: string
  consecutivo: string
  asesor: string
  facturacion: number
}

export type SeguimientoConCuenta = Seguimiento & { cuentas: CuentaMin | null }
export type OportunidadConCuenta = Oportunidad & { cuentas: CuentaMin | null }
export type TicketConCuenta      = Ticket       & { cuentas: CuentaMin | null }

// Queries sin FK-join — join manual con el mapa de cuentas que pasa el caller
export async function getSeguimientosRango(desde: string, hasta: string): Promise<Seguimiento[]> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
  if (error) throw error
  return (data ?? []) as Seguimiento[]
}

// Actividades SAC — conteo semanal por asesor (tabla `actividades`)
/**
 * Actividades para el medidor de Cumplimiento SAC.
 *
 * Trae `tipo` porque el medidor tiene que SEPARAR el lote rutinario de lo que
 * va fuera de él. Los seguimientos por foco de riesgo son diez por semana y las
 * aclaraciones de baja no tienen tope: sumarlos contra una meta de cuatro haría
 * que el lunes marcara 14 de 4, que no significa nada.
 */
export async function getActividadesSAC(desdeSemanainicio: string): Promise<{ asesor: string; semana_inicio: string; completada: boolean; tipo: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('actividades')
    .select('asesor, semana_inicio, completada, tipo')
    .gte('semana_inicio', desdeSemanainicio)
  if (error) throw error
  return (data ?? []) as { asesor: string; semana_inicio: string; completada: boolean; tipo: string }[]
}

// Actividades SAC por cuenta — para el panel de historial en /cuentas/[id]
export interface ActividadSAC {
  id:               string
  tipo:             string
  descripcion:      string
  prioridad:        string
  fecha_programada: string
  fecha_vencimiento:string
  semana_inicio:    string
  estado:           string
  completada:       boolean
  resultado:        string | null
  asesor:           string
  hs_cuenta:        number
  semaforo_cuenta:  string
}

export async function getActividadesByCuenta(cuentaId: string): Promise<ActividadSAC[]> {
  const { data, error } = await supabaseAdmin
    .from('actividades')
    .select('id, tipo, descripcion, prioridad, fecha_programada, fecha_vencimiento, semana_inicio, estado, completada, resultado, asesor, hs_cuenta, semaforo_cuenta')
    .eq('cuenta_id', cuentaId)
    .order('fecha_programada', { ascending: false })
    .limit(100)
  // Si la tabla no existe, retornar array vacío en lugar de fallar
  if (error) return []
  return (data ?? []) as ActividadSAC[]
}

export async function getOportunidadesActivasRaw(): Promise<Oportunidad[]> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .select('*')
    .in('estado', ['identificada', 'en_proceso'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Oportunidad[]
}

export async function getTicketsAbiertosRaw(): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .in('estado', ['abierto', 'en_proceso'])
    .order('dias_abierto', { ascending: false })
  if (error) throw error
  return (data ?? []) as Ticket[]
}
