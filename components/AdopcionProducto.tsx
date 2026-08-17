'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Edit3, Save, X, ChevronDown, ChevronUp,
  AlertTriangle, Clock, CheckCircle2, ShieldCheck, Copy, Check,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════════════════════════════ */
export const PRODUCTOS = [
  'Voz CE',
  'Voz VyC',
  'Callpicker Chat',
  'Integración API',
  'Pago Automático',
  'IA de Voz',
  'IA de Chat',
  'Uso del Panel Administrador',
] as const

type Nivel = 'alto' | 'medio' | 'bajo' | 'no_aplica'

const NIVEL_CFG: Record<Nivel, {
  label: string; color: string; bg: string; border: string; dot: string
}> = {
  alto:      { label: 'Alto',      dot: '#22c55e', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  medio:     { label: 'Medio',     dot: '#f59e0b', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  bajo:      { label: 'Bajo',      dot: '#ef4444', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  no_aplica: { label: 'No Aplica', dot: '#9ca3af', color: '#4b5563', bg: '#f9fafb', border: '#e5e7eb' },
}

const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS adopcion_producto (
  id          bigserial    PRIMARY KEY,
  cuenta_id   uuid         NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  producto    text         NOT NULL,
  nivel       text         NOT NULL CHECK (nivel IN ('alto','medio','bajo','no_aplica')),
  fecha       date         NOT NULL DEFAULT CURRENT_DATE,
  asesor      text,
  notas       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_id ON adopcion_producto(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_producto
  ON adopcion_producto(cuenta_id, producto, created_at DESC);
ALTER TABLE adopcion_producto ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'adopcion_producto' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON adopcion_producto FOR ALL USING (true)';
  END IF;
END $$;`

/* ══════════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════════ */
interface AdopcionRow {
  id: number
  cuenta_id: number
  producto: string
  nivel: Nivel
  fecha: string
  asesor: string | null
  notas: string | null
  created_at: string
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════ */
function fmtFecha(d: string) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function diasDesde(d: string): number {
  return Math.floor((Date.now() - new Date(d + 'T12:00:00').getTime()) / 86_400_000)
}

/* ══════════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════════════ */
function NivelBadge({ nivel }: { nivel: Nivel }) {
  const c = NIVEL_CFG[nivel]
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

function NivelSelect({ value, onChange }: {
  value: Nivel; onChange: (v: Nivel) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {(Object.keys(NIVEL_CFG) as Nivel[]).map(n => {
        const c   = NIVEL_CFG[n]
        const sel = value === n
        return (
          <button key={n} type="button" onClick={() => onChange(n)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all"
            style={sel
              ? { background: c.bg, color: c.color, border: `1.5px solid ${c.dot}`, boxShadow: `0 0 0 1px ${c.dot}44` }
              : { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }
            }>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sel ? c.dot : '#d1d5db' }} />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function AdopcionProducto({
  cuentaId,
  asesor,
}: {
  cuentaId: string
  asesor: string
}) {
  const [rows, setRows]           = useState<AdopcionRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [needsSetup, setNeedsSetup]     = useState(false)
  const [migrating, setMigrating]       = useState(false)
  const [migrationSql, setMigrationSql] = useState('')
  const [copied, setCopied]             = useState(false)

  const [editVals, setEditVals] = useState<Record<string, { nivel: Nivel; notas: string }>>({})

  /* ── Cargar datos ──────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/adopcion?cuentaId=${cuentaId}`)
    const data = await res.json()
    if (data.error && (data.error.includes('adopcion_producto') || data.error.includes('PGRST205'))) {
      setNeedsSetup(true)
      setRows([])
    } else {
      setRows(data.rows ?? [])
    }
    setLoading(false)
  }, [cuentaId])

  useEffect(() => { load() }, [load])

  /* ── Estado actual (último registro por producto) ──────────────── */
  const current = useMemo(() => {
    const map: Record<string, AdopcionRow> = {}
    for (const r of rows) {
      if (!map[r.producto] || r.created_at > map[r.producto].created_at) {
        map[r.producto] = r
      }
    }
    return map
  }, [rows])

  /* ── Alerta mensual ─────────────────────────────────────────────── */
  const lastFecha = useMemo(() => {
    if (!rows.length) return null
    return rows.reduce((max, r) => r.fecha > max ? r.fecha : max, rows[0].fecha)
  }, [rows])

  const diasDesdeReview = lastFecha ? diasDesde(lastFecha) : null
  const isOverdue = diasDesdeReview === null || diasDesdeReview > 30

  /* ── Abrir modal de edición ─────────────────────────────────────── */
  function openEdit() {
    const init: Record<string, { nivel: Nivel; notas: string }> = {}
    for (const p of PRODUCTOS) {
      init[p] = {
        nivel: current[p]?.nivel ?? 'no_aplica',
        notas: current[p]?.notas ?? '',
      }
    }
    setEditVals(init)
    setSaveError(null)
    setEditing(true)
  }

  /* ── Guardar ────────────────────────────────────────────────────── */
  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/adopcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta_id: cuentaId,
          asesor,
          fecha: new Date().toISOString().slice(0, 10),
          productos: PRODUCTOS.map(p => ({
            producto: p,
            nivel: editVals[p]?.nivel ?? 'no_aplica',
            notas: editVals[p]?.notas || null,
          })),
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        const msg: string = data.error ?? `Error ${res.status}`
        // Detectar tabla faltante
        if (msg.includes('adopcion_producto') || msg.includes('PGRST205') || msg.includes('schema cache')) {
          setEditing(false)
          setNeedsSetup(true)
        } else {
          setSaveError(msg)
        }
        setSaving(false)
        return
      }

      await load()
      setSaving(false)
      setEditing(false)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error de conexión')
      setSaving(false)
    }
  }

  /* ── Auto-migración ─────────────────────────────────────────────── */
  async function runMigration() {
    setMigrating(true)
    setMigrationSql('')
    try {
      const res  = await fetch('/api/admin/migrate', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setNeedsSetup(false)
        await load()
      } else {
        // No se pudo auto-migrar — mostrar SQL para copiar
        setMigrationSql(data.sql || MIGRATION_SQL)
      }
    } catch {
      setMigrationSql(MIGRATION_SQL)
    }
    setMigrating(false)
  }

  /* ── Copiar SQL ─────────────────────────────────────────────────── */
  function copySql() {
    navigator.clipboard.writeText(migrationSql || MIGRATION_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Historial por producto ─────────────────────────────────────── */
  function getHistory(producto: string): AdopcionRow[] {
    return rows
      .filter(r => r.producto === producto)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6)
  }

  /* ── Resumen visual ──────────────────────────────────────────────── */
  const altoCount  = PRODUCTOS.filter(p => current[p]?.nivel === 'alto').length
  const medioCount = PRODUCTOS.filter(p => current[p]?.nivel === 'medio').length
  const sinDatos   = !rows.length

  /* ══════════════════════════════════════════════════════════════════
     RENDER — SETUP REQUERIDO
  ══════════════════════════════════════════════════════════════════ */
  if (needsSetup) {
    return (
      <div className="cp-card">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
            Adopción de Producto
          </h3>
        </div>

        <div className="rounded-xl border border-amarillo/30 bg-amarillo/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amarillo">
            <AlertTriangle size={14} /> Setup requerido
          </div>
          <p className="text-[11px] text-textMid">
            La tabla <code className="bg-surface px-1 rounded">adopcion_producto</code> aún
            no existe en Supabase. Haz clic en el botón para crearla automáticamente.
          </p>

          <button
            onClick={runMigration}
            disabled={migrating}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-60"
            style={{ background: '#1B3FCC' }}>
            {migrating
              ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando tabla…</>
              : '⚡ Crear tabla automáticamente'
            }
          </button>

          {/* Si falla la auto-migración, mostrar SQL */}
          {(migrationSql) && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-textMid">
                La creación automática no funcionó. Copia este SQL y ejecútalo en{' '}
                <a
                  href="https://supabase.com/dashboard/project/zhgqdytsmczeexqhvliz/sql"
                  target="_blank" rel="noopener noreferrer"
                  className="text-cp underline">
                  Supabase → SQL Editor
                </a>:
              </p>
              <div className="relative">
                <pre className="text-[9px] bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-40 font-mono leading-relaxed">
                  {MIGRATION_SQL}
                </pre>
                <button
                  onClick={copySql}
                  className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors">
                  {copied ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER NORMAL
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
            Adopción de Producto
          </h3>
          {!sinDatos && (
            <span className="text-[10px] font-semibold text-cp bg-cp/10 px-1.5 py-0.5 rounded-full">
              {altoCount} alto · {medioCount} medio
            </span>
          )}
        </div>
        <button
          onClick={openEdit}
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: '#1B3FCC10', color: '#1B3FCC' }}>
          <Edit3 size={11} />
          {sinDatos ? 'Registrar' : 'Actualizar'}
        </button>
      </div>

      {/* Alerta mensual */}
      {isOverdue && (
        <div className="mb-3 flex items-center gap-2 text-[11px] px-2.5 py-2 rounded-lg"
          style={{ background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' }}>
          <AlertTriangle size={12} />
          {sinDatos
            ? 'Sin revisión registrada — tarea mensual pendiente'
            : `Última revisión hace ${diasDesdeReview} días — actualizar este mes`
          }
        </div>
      )}
      {!isOverdue && lastFecha && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-textLow">
          <CheckCircle2 size={11} className="text-verde" />
          Revisado el {fmtFecha(lastFecha)}
        </div>
      )}

      {/* Lista de productos */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 bg-surface rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {PRODUCTOS.map(p => {
            const c       = current[p]
            const nivel   = c?.nivel ?? null
            const history = getHistory(p)
            const isOpen  = expanded === p

            return (
              <div key={p} className="rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between py-1.5 px-2 cursor-pointer rounded-lg hover:bg-surface/60 transition-colors"
                  onClick={() => history.length > 1 ? setExpanded(isOpen ? null : p) : undefined}>
                  <div className="flex items-center gap-2 min-w-0">
                    {history.length > 1 && (
                      <button className="text-textLow flex-shrink-0">
                        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    )}
                    <span className="text-xs text-textMid truncate">{p}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c?.fecha && (
                      <span className="text-[10px] text-textLow hidden sm:block">
                        {fmtFecha(c.fecha)}
                      </span>
                    )}
                    {nivel ? (
                      <NivelBadge nivel={nivel} />
                    ) : (
                      <span className="text-[10px] text-textLow">—</span>
                    )}
                  </div>
                </div>

                {isOpen && history.length > 0 && (
                  <div className="ml-5 mb-1 pl-2 border-l-2 border-border space-y-1">
                    {history.map((h, i) => (
                      <div key={h.id} className="flex items-center gap-2 py-0.5">
                        <span className="text-[10px] text-textLow w-20 flex-shrink-0">
                          {fmtFecha(h.fecha)}
                        </span>
                        <NivelBadge nivel={h.nivel} />
                        {h.asesor && <span className="text-[10px] text-textLow">{h.asesor}</span>}
                        {h.notas && (
                          <span className="text-[10px] text-textLow truncate max-w-[120px]" title={h.notas}>
                            · {h.notas}
                          </span>
                        )}
                        {i === 0 && (
                          <span className="text-[9px] text-cp bg-cp/10 px-1 py-0.5 rounded-full ml-auto">actual</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL DE EDICIÓN ──────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="cp-light bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ color: '#0F172A' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Actualizar Adopción de Producto</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Revisión mensual · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })} · {asesor}
                </p>
              </div>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Leyenda */}
              <div className="flex gap-3 flex-wrap text-[11px]">
                {(Object.entries(NIVEL_CFG) as [Nivel, typeof NIVEL_CFG[Nivel]][]).map(([n, c]) => (
                  <span key={n} className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{ background: c.bg, color: c.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    <strong>{c.label}</strong>
                  </span>
                ))}
              </div>

              {/* Error */}
              {saveError && (
                <div className="flex items-center gap-2 text-xs text-rojo bg-rojo/10 border border-rojo/20 px-3 py-2 rounded-lg">
                  <AlertTriangle size={13} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Productos */}
              {PRODUCTOS.map(p => {
                const prev = current[p]
                return (
                  <div key={p} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-800">{p}</span>
                          {prev && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={9} /> anterior: <NivelBadge nivel={prev.nivel} />
                            </span>
                          )}
                        </div>
                        <NivelSelect
                          value={editVals[p]?.nivel ?? 'no_aplica'}
                          onChange={n => setEditVals(v => ({ ...v, [p]: { ...v[p], nivel: n } }))}
                        />
                      </div>
                    </div>
                    <textarea
                      value={editVals[p]?.notas ?? ''}
                      onChange={e => setEditVals(v => ({ ...v, [p]: { ...v[p], notas: e.target.value } }))}
                      placeholder="Notas opcionales…"
                      rows={1}
                      className="mt-2 w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-600 placeholder-gray-300"
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Clock size={11} />
                Se guardará como revisión del {new Date().toLocaleDateString('es-MX', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-60"
                  style={{ background: '#1B3FCC' }}>
                  {saving
                    ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando…</>
                    : <><Save size={12} /> Guardar revisión</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
