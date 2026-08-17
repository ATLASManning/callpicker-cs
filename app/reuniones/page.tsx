'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Plus, X, Save, ChevronDown, Users, FileText,
  ArrowLeft, Trash2, RefreshCw, AlertTriangle, CheckCircle2,
  Database, Building2,
} from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'

type TipoReunion = 'junta_semanal' | 'one_on_one' | 'cliente' | 'estrategia' | 'otro'

type Reunion = {
  id: string
  fecha: string
  tipo: TipoReunion
  titulo: string
  participantes: string
  resumen: string
  acuerdos: string
  proximos_pasos: string
  empresa?: string | null
  creado_en: string
}

const TIPOS: Record<TipoReunion, { label: string; color: string; bg: string }> = {
  junta_semanal: { label: 'Junta Semanal',  color: '#0057FF', bg: 'rgba(0,87,255,0.08)' },
  one_on_one:    { label: 'One-on-One',     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  cliente:       { label: 'Con Cliente',    color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  estrategia:    { label: 'Estrategia',     color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  otro:          { label: 'Otro',           color: '#475569', bg: 'rgba(71,85,105,0.08)' },
}

const STORAGE_KEY = 'cp_reuniones'
const hoy = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): Omit<Reunion, 'id' | 'creado_en'> => ({
  fecha: hoy(), tipo: 'junta_semanal',
  titulo: '', participantes: '', resumen: '', acuerdos: '', proximos_pasos: '', empresa: '',
})

/* ══════════════════════════════════════════════════════════════════════
   BANNER: tabla no existe aún
══════════════════════════════════════════════════════════════════════ */
const SQL_CREAR_TABLA = `CREATE TABLE IF NOT EXISTS public.reuniones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'junta_semanal',
  titulo TEXT NOT NULL,
  participantes TEXT DEFAULT '',
  resumen TEXT DEFAULT '',
  acuerdos TEXT DEFAULT '',
  proximos_pasos TEXT DEFAULT '',
  empresa TEXT DEFAULT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Si la tabla ya existe, agregar la columna empresa:
ALTER TABLE public.reuniones ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT NULL;`

function SetupBanner() {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(SQL_CREAR_TABLA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mx-6 mb-5 rounded-2xl border-2 p-5"
      style={{ borderColor: '#FCD34D', background: 'rgba(253,230,138,0.12)' }}>
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="font-bold text-sm" style={{ color: '#92400E' }}>
            Tabla de Reuniones no encontrada en Supabase
          </p>
          <p className="text-xs mt-1" style={{ color: '#78350F' }}>
            Ejecuta este SQL en Supabase Dashboard → SQL Editor para habilitar el almacenamiento compartido.
          </p>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#FCD34D' }}>
        <div className="flex items-center justify-between px-3 py-2"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#92400E' }}>
            <Database size={11} className="inline mr-1" />SQL
          </span>
          <button onClick={copy}
            className="text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors"
            style={{ background: copied ? '#059669' : '#D97706', color: '#fff' }}>
            {copied ? '✓ Copiado' : 'Copiar SQL'}
          </button>
        </div>
        <pre className="text-[11px] px-4 py-3 overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#44403C', fontFamily: 'monospace' }}>
          {SQL_CREAR_TABLA}
        </pre>
      </div>
      <p className="text-[11px] mt-3" style={{ color: '#92400E' }}>
        Después de crear la tabla, recarga la página. Los datos migrados de este dispositivo se cargarán automáticamente.
      </p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════ */
export default function ReunionesPage() {
  const [reuniones,    setReuniones]    = useState<Reunion[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState(emptyForm())
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [mesActivo,    setMesActivo]    = useState(() => hoy().slice(0, 7))
  const [tableExists,  setTableExists]  = useState<boolean | null>(null)
  const [migrated,     setMigrated]     = useState(false)
  const [saveError,    setSaveError]    = useState<string | null>(null)

  /* ── Cargar desde Supabase ──────────────────────────────────────── */
  const loadFromServer = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reuniones')
      const json = await res.json()
      setTableExists(json.tableExists ?? false)
      if (json.tableExists) {
        setReuniones((json.rows ?? []).sort((a: Reunion, b: Reunion) =>
          b.fecha.localeCompare(a.fecha)
        ))
      }
    } catch {
      setTableExists(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFromServer() }, [loadFromServer])

  /* ── Auto-migrar localStorage → Supabase (una sola vez) ────────── */
  useEffect(() => {
    if (tableExists !== true || migrated) return
    setMigrated(true)

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    let local: Reunion[] = []
    try { local = JSON.parse(raw) } catch { return }
    if (!local.length) return

    // Migrar cada reunión local al servidor
    Promise.all(
      local.map(r =>
        fetch('/api/reuniones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fecha: r.fecha, tipo: r.tipo, titulo: r.titulo,
            participantes: r.participantes, resumen: r.resumen,
            acuerdos: r.acuerdos, proximos_pasos: r.proximos_pasos,
          }),
        })
      )
    ).then(() => {
      localStorage.removeItem(STORAGE_KEY)
      loadFromServer()
    }).catch(() => {/* migración parcial — no crítico */})
  }, [tableExists, migrated, loadFromServer])

  /* ── Guardar nueva reunión ──────────────────────────────────────── */
  async function guardar() {
    if (!form.titulo.trim()) return
    if (form.tipo === 'cliente' && !form.empresa?.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/reuniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const j = await res.json(); msg = j.error ?? msg } catch {}
        if (res.status === 401 || res.status === 302) msg = 'Sesión expirada. Recarga la página e ingresa de nuevo.'
        setSaveError(msg)
        return
      }

      const json = await res.json()
      if (json.row) {
        const nueva = json.row as Reunion
        setReuniones(prev => [nueva, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)))
        setExpanded(nueva.id)
        setMesActivo(nueva.fecha.slice(0, 7))
        setShowForm(false)
        setForm(emptyForm())
      } else {
        setSaveError('El servidor no confirmó el guardado. Recarga la página.')
      }
    } catch {
      setSaveError('Error de conexión. Verifica tu red y que la sesión esté activa.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Eliminar reunión ────────────────────────────────────────────── */
  async function eliminar(id: string) {
    await fetch(`/api/reuniones/${id}`, { method: 'DELETE' })
    setReuniones(prev => prev.filter(r => r.id !== id))
    if (expanded === id) setExpanded(null)
  }

  /* ── Meses disponibles ──────────────────────────────────────────── */
  const meses = Array.from(new Set(reuniones.map(r => r.fecha.slice(0, 7)))).sort((a, b) => b.localeCompare(a))
  const reunionesMes = reuniones.filter(r => r.fecha.startsWith(mesActivo))

  function formatFecha(f: string) {
    return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }
  function formatMes(m: string) {
    const [y, mo] = m.split('-')
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('es-MX', {
      month: 'long', year: 'numeric',
    })
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: '#EFF6FF' }}>
      <div className="px-6 pt-5 pb-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs mb-4"
          style={{ color: '#64748b' }}>
          <ArrowLeft size={13} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Reuniones
              </h1>
              {tableExists === true && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                  <Database size={9} /> Supabase
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
              Resúmenes, acuerdos y próximos pasos de cada meeting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadFromServer}
              className="cp-btn cp-btn-ghost"
              title="Recargar">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {tableExists !== false && (
              <button onClick={() => { setShowForm(true); setForm(emptyForm()); setSaveError(null) }}
                className="cp-btn cp-btn-primary">
                <Plus size={15} /> Nueva Reunión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner setup si tabla no existe */}
      {tableExists === false && <SetupBanner />}

      {/* Estado cargando */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={20} className="animate-spin" style={{ color: '#BFDBFE' }} />
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-4"
            style={{ background: '#ffffff', border: '1px solid #BFDBFE', boxShadow: '0 20px 60px rgba(0,87,255,0.15)' }}>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Nueva Reunión</h2>
              <button onClick={() => setShowForm(false)} className="cp-icon-btn">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>Fecha</label>
                <input type="date" value={form.fecha}
                  onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                  className="cp-input w-full" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>Tipo</label>
                <CustomSelect value={form.tipo}
                  onChange={v => setForm(p => ({ ...p, tipo: v as TipoReunion }))}
                  className="cp-select w-full"
                  options={Object.entries(TIPOS).map(([k, v]) => ({ value: k, label: v.label }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>Título / Tema</label>
              <input type="text" placeholder="ej. Revisión semanal KAM · Mayo"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                className="cp-input w-full" />
            </div>

            {form.tipo === 'cliente' && (
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#059669' }}>
                  <Building2 size={12} /> Cuenta / Empresa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" placeholder="ej. Finsus Growth, VAEO, Grupo FRISA…"
                  value={form.empresa ?? ''}
                  onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
                  className="cp-input w-full"
                  style={{ borderColor: !form.empresa?.trim() ? '#fca5a5' : undefined }} />
                <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>
                  Este nombre vincula la reunión con la cuenta en el módulo Cuentas
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                <Users size={12} className="inline mr-1" />Participantes
              </label>
              <input type="text" placeholder="Fátima, Dan, Claudia, ..."
                value={form.participantes}
                onChange={e => setForm(p => ({ ...p, participantes: e.target.value }))}
                className="cp-input w-full" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                <FileText size={12} className="inline mr-1" />Resumen de la reunión
              </label>
              <textarea rows={3} placeholder="¿De qué se habló? Principales temas discutidos..."
                value={form.resumen}
                onChange={e => setForm(p => ({ ...p, resumen: e.target.value }))}
                className="cp-input w-full resize-none" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>Acuerdos / Decisiones</label>
              <textarea rows={2} placeholder="¿Qué se acordó? ¿Qué decisiones se tomaron?"
                value={form.acuerdos}
                onChange={e => setForm(p => ({ ...p, acuerdos: e.target.value }))}
                className="cp-input w-full resize-none" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>Próximos pasos</label>
              <textarea rows={2} placeholder="Tareas y responsables para la próxima semana..."
                value={form.proximos_pasos}
                onChange={e => setForm(p => ({ ...p, proximos_pasos: e.target.value }))}
                className="cp-input w-full resize-none" />
            </div>

            {saveError && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: '#B91C1C' }}>{saveError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={guardar} disabled={saving}
                className="cp-btn cp-btn-primary flex-1 justify-center">
                {saving
                  ? <><RefreshCw size={13} className="animate-spin" /> Guardando...</>
                  : <><Save size={14} /> Guardar Reunión</>
                }
              </button>
              <button onClick={() => { setShowForm(false); setSaveError(null) }} className="cp-btn cp-btn-ghost">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      {!loading && (
        <div className="px-6 pb-6">
          {/* Filtro por mes */}
          {meses.length > 1 && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {meses.map(m => (
                <button key={m} onClick={() => setMesActivo(m)}
                  className="cp-btn text-xs"
                  style={mesActivo === m
                    ? { background: '#0057FF', color: '#fff', border: '1px solid #003db3', boxShadow: '0 2px 8px rgba(0,87,255,0.3)' }
                    : { background: '#fff', color: '#374151', border: '1px solid #BFDBFE' }}>
                  {formatMes(m)}
                </button>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {tableExists !== false && reuniones.length === 0 && (
            <div className="cp-card text-center py-16">
              <Calendar size={40} className="mx-auto mb-3" style={{ color: '#BFDBFE' }} />
              <p className="font-semibold mb-1" style={{ color: '#fff' }}>Sin reuniones registradas</p>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                Documenta el resumen de cada meeting del equipo
              </p>
              <button onClick={() => { setShowForm(true); setForm(emptyForm()); setSaveError(null) }}
                className="cp-btn cp-btn-primary mx-auto">
                <Plus size={14} /> Registrar primera reunión
              </button>
            </div>
          )}

          {/* Lista */}
          {reunionesMes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>
                  {formatMes(mesActivo)} · {reunionesMes.length} reunión{reunionesMes.length !== 1 ? 'es' : ''}
                </p>
                {tableExists && (
                  <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                    <CheckCircle2 size={8} /> sincronizado
                  </span>
                )}
              </div>

              {reunionesMes.map(r => {
                const cfg = TIPOS[r.tipo] ?? TIPOS.otro
                const open = expanded === r.id
                return (
                  <div key={r.id} className="cp-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button onClick={() => setExpanded(open ? null : r.id)}
                      className="w-full flex items-center gap-3 text-left"
                      style={{ padding: '16px 20px' }}>
                      <div className="flex-shrink-0 w-12 text-center rounded-xl py-1.5"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                        <p className="text-[10px] font-semibold uppercase" style={{ color: cfg.color }}>
                          {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' })}
                        </p>
                        <p className="text-lg font-bold leading-tight" style={{ color: cfg.color }}>
                          {new Date(r.fecha + 'T12:00:00').getDate()}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          {r.tipo === 'cliente' && r.empresa && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                              <Building2 size={9} />{r.empresa}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{r.titulo}</p>
                        {r.participantes && (
                          <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>
                            <Users size={10} className="inline mr-1" />{r.participantes}
                          </p>
                        )}
                      </div>

                      <ChevronDown size={16} style={{
                        color: '#94A3B8',
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }} />
                    </button>

                    {open && (
                      <div style={{ borderTop: '1px solid #EFF6FF', padding: '0 20px 20px' }}>
                        <p className="text-[11px] mt-3 mb-3" style={{ color: '#94A3B8' }}>
                          {formatFecha(r.fecha)}
                        </p>

                        {r.resumen && (
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Resumen</p>
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#374151' }}>{r.resumen}</p>
                          </div>
                        )}

                        {r.acuerdos && (
                          <div className="mb-3 p-3 rounded-xl"
                            style={{ background: 'rgba(0,87,255,0.04)', border: '1px solid rgba(0,87,255,0.1)' }}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#0057FF' }}>Acuerdos</p>
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#374151' }}>{r.acuerdos}</p>
                          </div>
                        )}

                        {r.proximos_pasos && (
                          <div className="mb-3 p-3 rounded-xl"
                            style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#059669' }}>Próximos Pasos</p>
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#374151' }}>{r.proximos_pasos}</p>
                          </div>
                        )}

                        <button onClick={() => eliminar(r.id)}
                          className="cp-btn cp-btn-ghost text-xs mt-1"
                          style={{ color: '#EF4444', borderColor: '#FECACA' }}>
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
