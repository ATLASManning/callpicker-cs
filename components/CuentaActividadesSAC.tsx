'use client'
import { useState } from 'react'
import type { ActividadSAC } from '@/lib/supabase'
import { CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'

/* ── Metadatos por tipo ──────────────────────────────────────────────────── */
const TIPO_META: Record<string, { label: string; emoji: string; color: string }> = {
  llamada:    { label: 'Llamada',             emoji: '📞', color: '#3B82F6' },
  reunion:    { label: 'Reunión',             emoji: '📊', color: '#6366F1' },
  analisis:   { label: 'Análisis / Reporte',  emoji: '📈', color: '#8B5CF6' },
  kam:        { label: 'Seguimiento KAM',     emoji: '📝', color: '#0EA5E9' },
  upsell:     { label: 'Propuesta Expansión', emoji: '🚀', color: '#22C55E' },
  validacion: { label: 'Completar Perfil',    emoji: '⚠️', color: '#DC2626' },
  tickets:    { label: 'Análisis Tickets',    emoji: '🎫', color: '#F97316' },
  pagos:      { label: 'Comportamiento Pago', emoji: '💳', color: '#F59E0B' },
}

const PRIO_COLOR: Record<string, string> = {
  alta:  '#EF4444',
  media: '#F97316',
  baja:  '#3B82F6',
}

function fmtFecha(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function semanaLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  return `Semana del ${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

/* ── Row individual ─────────────────────────────────────────────────────── */
function ActividadRow({ act, canEdit }: { act: ActividadSAC; canEdit: boolean }) {
  const [expanded,  setExpanded]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [resultado, setResultado] = useState(act.resultado ?? '')
  const [estado,    setEstado]    = useState(act.estado)
  const [saved,     setSaved]     = useState(false)

  const meta  = TIPO_META[act.tipo] ?? { label: act.tipo, emoji: '📋', color: '#6B7280' }
  const pcomp = estado === 'completada'
  const pbloc = estado === 'bloqueada'

  async function completar() {
    if (!resultado.trim()) return
    setSaving(true)
    try {
      const r = await fetch(`/api/actividades/${act.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: true, estado: 'completada', resultado }),
      })
      if (r.ok) { setEstado('completada'); setSaved(true) }
    } finally { setSaving(false) }
  }

  return (
    <div
      className="border border-gray-100 rounded-xl overflow-hidden transition-all"
      style={{ opacity: pbloc ? 0.6 : 1 }}
    >
      {/* Cabecera de la actividad */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/70 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Emoji tipo */}
        <span className="text-base flex-shrink-0">{meta.emoji}</span>

        {/* Info central */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: `${meta.color}15`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                color: PRIO_COLOR[act.prioridad] ?? '#6B7280',
                borderColor: `${PRIO_COLOR[act.prioridad] ?? '#6B7280'}40`,
                background: `${PRIO_COLOR[act.prioridad] ?? '#6B7280'}0D`,
              }}
            >
              {act.prioridad}
            </span>
            <span className="text-[10px] text-gray-400">{semanaLabel(act.semana_inicio)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{fmtFecha(act.fecha_programada)}</p>
        </div>

        {/* Estado badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pcomp && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} /> Completada
            </span>
          )}
          {pbloc && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <XCircle size={10} /> Bloqueada
            </span>
          )}
          {estado === 'pendiente' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Clock size={10} /> Pendiente
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40 space-y-3">

          {/* Descripción completa */}
          <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Descripción de la actividad</p>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{act.descripcion}</p>
          </div>

          {/* Resultado registrado */}
          {pcomp && act.resultado && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">Resultado registrado</p>
              <p className="text-xs text-emerald-800 leading-relaxed">{act.resultado}</p>
            </div>
          )}

          {/* Completar actividad — solo si pendiente y puede editar */}
          {!pcomp && !pbloc && canEdit && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Registrar resultado</p>
              <textarea
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                placeholder="¿Qué ocurrió? Resultado de la llamada, reunión o análisis..."
                rows={3}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
              />
              <button
                onClick={completar}
                disabled={saving || !resultado.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: saved ? '#22C55E' : '#1B3FCC' }}
              >
                <CheckCircle2 size={12} />
                {saving ? 'Guardando…' : saved ? '¡Completada!' : 'Marcar como completada'}
              </button>
            </div>
          )}

          {/* Vencimiento */}
          <p className="text-[11px] text-gray-400">
            Vence: <span className="font-medium">{fmtFecha(act.fecha_vencimiento)}</span>
            {' · '}HS cuenta: <span className="font-medium">{act.hs_cuenta}</span>
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────────────────── */
interface Props {
  actividades: ActividadSAC[]
  canEdit:     boolean
}

export default function CuentaActividadesSAC({ actividades, canEdit }: Props) {
  const total      = actividades.length
  const completadas = actividades.filter(a => a.estado === 'completada').length
  const pendientes  = actividades.filter(a => a.estado === 'pendiente').length
  const bloqueadas  = actividades.filter(a => a.estado === 'bloqueada').length

  const pct = total > 0 ? Math.round(completadas / total * 100) : 0

  if (total === 0) {
    return (
      <div className="cp-card">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={14} className="text-textLow" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Actividades SAC</h3>
        </div>
        <p className="text-xs text-textLow text-center py-6 italic">
          No hay actividades SAC registradas para esta cuenta.
        </p>
      </div>
    )
  }

  return (
    <div className="cp-card space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-textLow" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Actividades SAC</h3>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">{total}</span>
        </div>
        <span className="text-[11px] text-gray-400">{pct}% completado</span>
      </div>

      {/* KPIs resumen */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center rounded-lg border border-emerald-100 bg-emerald-50 py-2">
          <p className="text-lg font-bold text-emerald-600">{completadas}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Completadas</p>
        </div>
        <div className="text-center rounded-lg border border-amber-100 bg-amber-50 py-2">
          <p className="text-lg font-bold text-amber-600">{pendientes}</p>
          <p className="text-[10px] text-amber-500 font-medium">Pendientes</p>
        </div>
        <div className="text-center rounded-lg border border-red-100 bg-red-50 py-2">
          <p className="text-lg font-bold text-red-500">{bloqueadas}</p>
          <p className="text-[10px] text-red-400 font-medium">Bloqueadas</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 70 ? '#22C55E' : pct >= 40 ? '#F97316' : '#EF4444' }}
        />
      </div>

      {/* Lista de actividades */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
        {actividades.map(a => (
          <ActividadRow key={a.id} act={a} canEdit={canEdit} />
        ))}
      </div>
    </div>
  )
}
