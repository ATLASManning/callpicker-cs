/**
 * lib/relacionamiento.ts
 * Índice de relacionamiento asesor ↔ cuenta, calculado SIEMPRE de fuentes vivas.
 *
 * POR QUÉ EXISTE: `cuentas.score_relacional` es el 15% del Health Score
 *   HS = actividad·0.35 + adopción·0.30 + pago·0.20 + relacional·0.15
 * pero nadie lo alimentaba: al 8-sep-2026, 172 de las 173 cuentas vivas tenían
 * exactamente el valor 50. Un componente constante no discrimina nada — es
 * como si el Health Score tuviera 15% de relleno.
 *
 * Este módulo lo sustituye por evidencia registrada y verificable:
 *   · Seguimientos capturados            30 pts
 *   · Actividades SAC asignadas y hechas 25 pts
 *   · Reuniones con el cliente           15 pts   ← el vínculo nuevo
 *   · Contactos / stakeholders en ficha  15 pts
 *   · Auditoría de cuenta documentada    10 pts
 *   · Ficha documentada por el KAM        5 pts
 * y sobre ese bruto aplica un factor de RECENCIA, porque una relación que
 * existió hace ocho meses no es una relación viva.
 *
 * LÍMITE QUE HAY QUE TENER PRESENTE: mide lo que está REGISTRADO, no lo que
 * ocurrió. Un asesor que habla seguido con su cliente sin capturarlo aparece
 * bajo. Sirve para detectar falta de trazabilidad — que es justamente lo que
 * el Programa de Crecimiento exige antes de admitir una cuenta.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { AUDITORIA_REFS } from '@/app/auditoria/registry'

export interface DesgloseRelacion {
  seguimientos: number
  actividades:  number
  reuniones:    number
  contactos:    number
  auditoria:    number
  documentacion: number
}

export interface Relacionamiento {
  pct: number
  nivel: 'Sólido' | 'En construcción' | 'Débil' | 'Sin relación registrada'
  desglose: DesgloseRelacion
  evidencia: string[]
  /** Días desde el contacto más reciente; null si no hay ninguna fecha. */
  diasUltimoContacto: number | null
  factorRecencia: number
  conteos: {
    seguimientos: number
    actividades: number
    actividadesCompletadas: number
    reuniones: number
    contactos: number
    tieneAuditoria: boolean
  }
}

const PESOS = {
  seguimientos: 30,
  actividades:  25,
  reuniones:    15,
  contactos:    15,
  auditoria:    10,
  documentacion: 5,
} as const

/** Consecutivos con caso de auditoría documentado. */
const CON_AUDITORIA: ReadonlySet<string> = new Set(
  AUDITORIA_REFS.flatMap(r => r.consecutivos.map(c => c.trim().toUpperCase())),
)

function diasDesde(fecha: string | null | undefined, hoy: Date): number | null {
  if (!fecha) return null
  const d = new Date(String(fecha).slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((hoy.getTime() - d.getTime()) / 86400000)
}

/**
 * Recencia: una relación registrada hace mucho no vale lo mismo que una viva.
 * No anula el puntaje, lo descuenta — la evidencia histórica sigue contando.
 */
function factorPorRecencia(dias: number | null): { factor: number; nota: string } {
  if (dias === null)  return { factor: 0.85, nota: 'sin fecha de contacto registrada' }
  if (dias <= 30)     return { factor: 1.00, nota: `contacto hace ${dias} día${dias === 1 ? '' : 's'}` }
  if (dias <= 60)     return { factor: 0.92, nota: `último contacto hace ${dias} días` }
  if (dias <= 120)    return { factor: 0.80, nota: `último contacto hace ${dias} días` }
  return { factor: 0.65, nota: `último contacto hace ${dias} días` }
}

export interface EntradaRelacion {
  cuentaId: string
  consecutivo?: string | null
  ultimoContacto?: string | null
  contactosJson?: unknown
  observacionesKam?: string | null
  notas?: string | null
}

/** Calcula el relacionamiento de VARIAS cuentas en una sola pasada. */
export async function relacionamientoDeCuentas(
  entradas: EntradaRelacion[],
  hoy = new Date(),
): Promise<Map<string, Relacionamiento>> {
  const ids = entradas.map(e => e.cuentaId).filter(Boolean)
  const salida = new Map<string, Relacionamiento>()
  if (!ids.length) return salida

  const [seg, act, reu] = await Promise.all([
    supabaseAdmin.from('seguimientos').select('cuenta_id, fecha').in('cuenta_id', ids),
    supabaseAdmin.from('actividades').select('cuenta_id, estado, completada').in('cuenta_id', ids),
    // La tabla puede no tener aún la columna cuenta_id (migración pendiente):
    // en ese caso se degrada a 0 reuniones en vez de romper el cálculo.
    supabaseAdmin.from('reuniones').select('cuenta_id, fecha, tipo').in('cuenta_id', ids),
  ])

  const porCuenta = <T extends { cuenta_id?: string | null }>(rows: T[] | null) => {
    const m = new Map<string, T[]>()
    for (const r of rows ?? []) {
      const k = r.cuenta_id
      if (!k) continue
      const arr = m.get(k)
      if (arr) arr.push(r); else m.set(k, [r])
    }
    return m
  }

  const mSeg = porCuenta(seg.data as { cuenta_id: string; fecha: string }[] | null)
  const mAct = porCuenta(act.data as { cuenta_id: string; estado: string; completada: boolean }[] | null)
  const mReu = reu.error ? new Map() : porCuenta(reu.data as { cuenta_id: string; fecha: string; tipo: string }[] | null)

  for (const e of entradas) {
    const seguimientos = mSeg.get(e.cuentaId) ?? []
    const actividades  = mAct.get(e.cuentaId) ?? []
    const reuniones    = (mReu.get(e.cuentaId) ?? []) as { fecha: string; tipo: string }[]

    /* 1 · Seguimientos — rendimientos decrecientes: 6 seguimientos ya es una
           relación activa; el número 20 no vale el triple que el número 7. */
    const nSeg = seguimientos.length
    const pSeg = nSeg ? Math.min(PESOS.seguimientos,
      PESOS.seguimientos * Math.log1p(nSeg) / Math.log1p(6)) : 0

    /* 2 · Actividades SAC — mitad cobertura, mitad cumplimiento. Asignar sin
           completar no construye relación. */
    const nAct  = actividades.length
    const nComp = actividades.filter(a => a.completada || a.estado === 'completada').length
    const pAct  = nAct
      ? PESOS.actividades * (0.5 * Math.min(1, nAct / 4) + 0.5 * (nComp / nAct))
      : 0

    /* 3 · Reuniones con el cliente — la señal más fuerte de relación real:
           implica agenda, asistencia de ambas partes y acuerdos. */
    const nReu = reuniones.length
    const pReu = nReu === 0 ? 0 : nReu === 1 ? 9 : nReu === 2 ? 12 : PESOS.reuniones

    /* 4 · Stakeholders — el programa exige varios contactos activos y no
           depender de una sola persona. */
    let arr: unknown[] = []
    try {
      const cj = e.contactosJson
      arr = Array.isArray(cj) ? cj : (typeof cj === 'string' && cj ? JSON.parse(cj) : [])
    } catch { arr = [] }
    const nCon = Array.isArray(arr) ? arr.length : 0
    const pCon = nCon === 0 ? 0 : nCon === 1 ? 7 : nCon === 2 ? 11 : PESOS.contactos

    /* 5 · Auditoría de cuenta — trabajo profundo y documentado. */
    const tieneAud = !!(e.consecutivo && CON_AUDITORIA.has(e.consecutivo.trim().toUpperCase()))
    const pAud = tieneAud ? PESOS.auditoria : 0

    /* 6 · Ficha documentada por el KAM. */
    const pDoc = ((e.observacionesKam ?? '').trim() ? 3 : 0) + ((e.notas ?? '').trim() ? 2 : 0)

    const bruto = pSeg + pAct + pReu + pCon + pAud + pDoc

    // Recencia: el contacto más reciente entre seguimientos, reuniones y ficha
    const fechas = [
      ...seguimientos.map(s => s.fecha),
      ...reuniones.map(r => r.fecha),
      e.ultimoContacto ?? null,
    ]
    const dias = fechas
      .map(f => diasDesde(f, hoy))
      .filter((d): d is number => d !== null)
    const dUlt = dias.length ? Math.min(...dias) : null
    const { factor, nota } = factorPorRecencia(dUlt)

    const pct = Math.max(0, Math.min(100, Math.round(bruto * factor)))
    const nivel: Relacionamiento['nivel'] =
      pct >= 70 ? 'Sólido' : pct >= 45 ? 'En construcción'
      : pct >= 20 ? 'Débil' : 'Sin relación registrada'

    const evidencia: string[] = []
    if (nSeg)    evidencia.push(`${nSeg} seguimiento${nSeg === 1 ? '' : 's'} registrado${nSeg === 1 ? '' : 's'}`)
    if (nAct)    evidencia.push(`${nComp}/${nAct} actividades SAC completadas`)
    if (nReu)    evidencia.push(`${nReu} reunión${nReu === 1 ? '' : 'es'} con el cliente`)
    if (nCon)    evidencia.push(`${nCon} contacto${nCon === 1 ? '' : 's'} registrado${nCon === 1 ? '' : 's'}`)
    if (tieneAud) evidencia.push('auditoría de cuenta documentada')
    if (pDoc)    evidencia.push('ficha documentada por el KAM')
    if (!evidencia.length) evidencia.push('sin evidencia registrada')
    evidencia.push(nota)

    salida.set(e.cuentaId, {
      pct, nivel,
      desglose: {
        seguimientos: Math.round(pSeg), actividades: Math.round(pAct),
        reuniones: pReu, contactos: pCon, auditoria: pAud, documentacion: pDoc,
      },
      evidencia,
      diasUltimoContacto: dUlt,
      factorRecencia: factor,
      conteos: {
        seguimientos: nSeg, actividades: nAct, actividadesCompletadas: nComp,
        reuniones: nReu, contactos: nCon, tieneAuditoria: tieneAud,
      },
    })
  }

  return salida
}

/** Atajo para una sola cuenta. */
export async function relacionamientoDeCuenta(
  entrada: EntradaRelacion,
  hoy = new Date(),
): Promise<Relacionamiento | null> {
  const m = await relacionamientoDeCuentas([entrada], hoy)
  return m.get(entrada.cuentaId) ?? null
}
