'use client'
import { useState, useEffect } from 'react'
import {
  Plus, X, Trash2, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle2, XCircle, Clock, BarChart3,
} from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

/* ─── Tipos ──────────────────────────────────────────────── */
type Estado = 'nuevo' | 'seguimiento' | 'propuesta' | 'ganado' | 'perdido'
type TipoLead = 'nuevo' | 'activo'

interface UpsellRegistro {
  id:               string
  consecutivo:      number
  tipo:             TipoLead
  empresa:          string
  contacto:         string
  asesor:           string
  fecha:            string
  estado:           Estado
  producto:         string
  valor_estimado:   number
  notas:            string
  fecha_resolucion?: string
}

/* ─── Configuración de estados ──────────────────────────── */
const ESTADO_CFG: Record<Estado, { label: string; color: string; dot: string }> = {
  nuevo:       { label: 'Nuevo',          color: '#3b82f6', dot: '🔵' },
  seguimiento: { label: 'En Seguimiento', color: '#f97316', dot: '🟠' },
  propuesta:   { label: 'Propuesta',      color: '#8b5cf6', dot: '🟣' },
  ganado:      { label: 'Ganado ✓',       color: '#22c55e', dot: '🟢' },
  perdido:     { label: 'Perdido',        color: '#ef4444', dot: '🔴' },
}

const ESTADOS: Estado[] = ['nuevo', 'seguimiento', 'propuesta', 'ganado', 'perdido']
const ASESORES = ['Fátima', 'Dan', 'Claudia']
const LS_KEY   = 'upsell_registros'

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (n: number) =>
  n ? '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'

function pad(n: number) { return String(n).padStart(3, '0') }

function loadRegistros(): UpsellRegistro[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : [] }
  catch { return [] }
}
function saveRegistros(list: UpsellRegistro[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function emptyForm(): Omit<UpsellRegistro, 'id' | 'consecutivo'> {
  return {
    tipo:           'nuevo',
    empresa:        '',
    contacto:       '',
    asesor:         'Fátima',
    fecha:          new Date().toISOString().slice(0, 10),
    estado:         'nuevo',
    producto:       '',
    valor_estimado: 0,
    notas:          '',
  }
}

/* ─── Componente ─────────────────────────────────────────── */
export default function UpsellRegistros() {
  const [registros, setRegistros] = useState<UpsellRegistro[]>([])
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(emptyForm())
  const [editing,   setEditing]   = useState<string | null>(null)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [delConfirm,setDelConfirm]= useState<string | null>(null)

  useEffect(() => { setRegistros(loadRegistros()) }, [])

  /* Guardar / editar */
  const handleSave = () => {
    if (!form.empresa.trim()) return
    let updated: UpsellRegistro[]
    if (editing) {
      updated = registros.map(r =>
        r.id === editing ? { ...r, ...form } : r
      )
    } else {
      const next = registros.length > 0 ? Math.max(...registros.map(r => r.consecutivo)) + 1 : 1
      const nuevo: UpsellRegistro = {
        ...form,
        id:          crypto.randomUUID(),
        consecutivo: next,
      }
      updated = [nuevo, ...registros]
    }
    setRegistros(updated)
    saveRegistros(updated)
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm())
  }

  /* Cambio rápido de estado */
  const changeEstado = (id: string, estado: Estado) => {
    const updated = registros.map(r =>
      r.id === id
        ? { ...r, estado, fecha_resolucion: (estado === 'ganado' || estado === 'perdido') ? new Date().toISOString().slice(0,10) : undefined }
        : r
    )
    setRegistros(updated)
    saveRegistros(updated)
  }

  /* Eliminar */
  const handleDelete = (id: string) => {
    const updated = registros.filter(r => r.id !== id)
    setRegistros(updated)
    saveRegistros(updated)
    setDelConfirm(null)
    if (expanded === id) setExpanded(null)
  }

  /* Abrir formulario de edición */
  const startEdit = (r: UpsellRegistro) => {
    setForm({ tipo: r.tipo, empresa: r.empresa, contacto: r.contacto, asesor: r.asesor,
              fecha: r.fecha, estado: r.estado, producto: r.producto,
              valor_estimado: r.valor_estimado, notas: r.notas })
    setEditing(r.id)
    setShowForm(true)
  }

  /* Métricas */
  const total      = registros.length
  const ganados    = registros.filter(r => r.estado === 'ganado').length
  const perdidos   = registros.filter(r => r.estado === 'perdido').length
  const enProceso  = registros.filter(r => !['ganado','perdido'].includes(r.estado)).length
  const valorPipe  = registros.filter(r => !['perdido'].includes(r.estado))
                              .reduce((s, r) => s + (r.valor_estimado || 0), 0)

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const inputCls = 'w-full border border-white/10 rounded-lg px-3 py-2 text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-white/20'
  const labelCls = 'block text-[10px] font-semibold text-white/50 uppercase tracking-wide mb-1'

  return (
    <div className="px-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cp" />
          <h3 className="text-sm font-bold text-textHi">Registro de Oportunidades</h3>
          <span className="ml-1 text-[10px] font-semibold bg-white/8 text-textLow px-2 py-0.5 rounded-full border border-white/10">
            {total} registros
          </span>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: '#1B3FCC' }}>
          <Plus size={13} /> Agregar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: BarChart3,    label: 'En proceso',    value: enProceso,   color: '#f97316' },
          { icon: TrendingUp,   label: 'Valor pipeline',value: fmt(valorPipe), color: '#0d9488', isStr: true },
          { icon: CheckCircle2, label: 'Ganados',        value: ganados,     color: '#22c55e' },
          { icon: XCircle,      label: 'Perdidos',       value: perdidos,    color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="cp-card py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-textLow uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: k.color }}>
                  {k.value}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${k.color}15` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de registros */}
      {registros.length === 0 ? (
        <div className="cp-card text-center py-12">
          <p className="text-textLow text-sm">Aún no hay registros.</p>
          <p className="text-textLow/60 text-xs mt-1">Agrega la primera oportunidad con el botón de arriba.</p>
        </div>
      ) : (
        <div className="cp-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/3">
                  {['#', 'Empresa', 'Tipo', 'Asesor', 'Producto', 'Valor Est.', 'Estado', 'Fecha', ''].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.map(r => {
                  const cfg = ESTADO_CFG[r.estado]
                  const isOpen = expanded === r.id
                  return (
                    <>
                      <tr key={r.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : r.id)}>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-cp">
                          #{pad(r.consecutivo)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-textHi max-w-[180px] truncate">
                          {r.empresa}
                          {r.contacto && <span className="block text-[10px] text-textLow font-normal">{r.contacto}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            r.tipo === 'nuevo'
                              ? 'bg-cpTeal/10 text-cpTeal border-cpTeal/20'
                              : 'bg-cp/10 text-cp border-cp/20'
                          }`}>
                            {r.tipo === 'nuevo' ? 'Lead nuevo' : 'Cuenta activa'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-textMid">{r.asesor}</td>
                        <td className="py-3 px-4 text-xs text-textMid max-w-[140px] truncate">{r.producto || '—'}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-cpTeal">{fmt(r.valor_estimado)}</td>
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <CustomSelect
                            value={r.estado}
                            onChange={v => changeEstado(r.id, v as Estado)}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg border bg-transparent focus:outline-none"
                            style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}
                            options={ESTADOS.map(e => ({ value: e, label: `${ESTADO_CFG[e].dot} ${ESTADO_CFG[e].label}` }))}
                          />
                        </td>
                        <td className="py-3 px-4 text-xs text-textLow whitespace-nowrap">{r.fecha}</td>
                        <td className="py-3 px-4">
                          <button onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : r.id) }}
                            className="text-textLow hover:text-textMid p-1">
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </td>
                      </tr>

                      {/* Fila expandida */}
                      {isOpen && (
                        <tr key={`${r.id}-exp`} className="border-b border-white/5 bg-white/2">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="flex items-start justify-between gap-6">
                              <div className="space-y-2 flex-1">
                                {r.notas && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">Notas</p>
                                    <p className="text-xs text-textMid leading-relaxed">{r.notas}</p>
                                  </div>
                                )}
                                {r.fecha_resolucion && (
                                  <p className="text-[10px] text-textLow">
                                    Resolución: <span className="font-semibold text-textMid">{r.fecha_resolucion}</span>
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={e => { e.stopPropagation(); startEdit(r) }}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-textMid hover:bg-white/5">
                                  Editar
                                </button>
                                {delConfirm === r.id ? (
                                  <div className="flex gap-1.5">
                                    <button onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                                      Confirmar
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); setDelConfirm(null) }}
                                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-textLow">
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); setDelConfirm(r.id) }}
                                    className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Header modal */}
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                {editing ? 'Editar Registro' : 'Nueva Oportunidad'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="text-white/50 hover:text-white/80"><X size={18} /></button>
            </div>

            {/* Campos */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo de Lead</label>
                  <CustomSelect value={form.tipo} onChange={v => set('tipo', v as TipoLead)} className={inputCls}
                    options={[
                      { value: 'nuevo', label: 'Lead nuevo' },
                      { value: 'activo', label: 'Cuenta activa' },
                    ]} />
                </div>
                <div>
                  <label className={labelCls}>Asesor</label>
                  <CustomSelect value={form.asesor} onChange={v => set('asesor', v)} className={inputCls}
                    options={ASESORES.map(a => ({ value: a, label: a }))} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Empresa <span className="text-red-400">*</span></label>
                <input value={form.empresa} onChange={e => set('empresa', e.target.value)}
                  placeholder="Nombre de la empresa" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Contacto</label>
                <input value={form.contacto} onChange={e => set('contacto', e.target.value)}
                  placeholder="Nombre del contacto" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Producto de Interés</label>
                  <input value={form.producto} onChange={e => set('producto', e.target.value)}
                    placeholder="ej. CP Chat, Voz, Voicebot…" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor MRR Estimado</label>
                  <input type="number" value={form.valor_estimado || ''}
                    onChange={e => set('valor_estimado', parseFloat(e.target.value) || 0)}
                    placeholder="0" className={inputCls + ' text-right'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Estado</label>
                  <CustomSelect value={form.estado} onChange={v => set('estado', v as Estado)} className={inputCls}
                    options={ESTADOS.map(e => ({ value: e, label: `${ESTADO_CFG[e].dot} ${ESTADO_CFG[e].label}` }))} />
                </div>
                <div>
                  <label className={labelCls}>Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Notas</label>
                <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
                  placeholder="Contexto, acuerdos, siguiente paso…"
                  className={inputCls + ' resize-y min-h-[80px]'} />
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 text-sm text-white/70 hover:bg-white/5 rounded-lg border border-white/10">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!form.empresa.trim()}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-40 transition-colors hover:opacity-90"
                style={{ background: '#1B3FCC' }}>
                {editing ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
