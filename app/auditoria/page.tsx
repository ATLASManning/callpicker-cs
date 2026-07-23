'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'
import type { AuditoriaCase, EstadoAuditoria } from './types'
import { STATIC_CASES, STATIC_CASE_IDS } from './cases'
import AuditoriaDetail from './AuditoriaDetail'
import AuditoriaForm from './AuditoriaForm'

const LS_KEY = 'auditoria_casos'

const ESTADO_COLOR: Record<string, string> = {
  en_riesgo:  '#ef4444',
  rescatable: '#22c55e',
  activo:     '#6366f1',
  recuperado: '#3b82f6',
  perdido:    '#6b7280',
}

const ESTADO_LABEL: Record<string, string> = {
  en_riesgo:  'En Riesgo',
  rescatable: 'Rescatable',
  activo:     'Activo',
  recuperado: 'Recuperado',
  perdido:    'Perdido',
}

const ESTADO_ORDER: EstadoAuditoria[] = ['en_riesgo', 'rescatable', 'activo', 'recuperado', 'perdido']

function loadFromLS(): AuditoriaCase[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as AuditoriaCase[]) : []
  } catch {
    return []
  }
}

function saveToLS(cases: AuditoriaCase[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cases))
}

export default function AuditoriaPage() {
  const [userCases, setUserCases]         = useState<AuditoriaCase[]>([])
  const [selectedId, setSelectedId]       = useState<string>(STATIC_CASES[0].id)
  const [showForm, setShowForm]           = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [closedFolders, setClosedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    setUserCases(loadFromLS())
    const caso = new URLSearchParams(window.location.search).get('caso')
    if (caso) setSelectedId(caso)
  }, [])

  const allCases: AuditoriaCase[] = [...STATIC_CASES, ...userCases]
  const currentCase = allCases.find(c => c.id === selectedId) ?? STATIC_CASES[0]

  /* Auto-expand la carpeta del caso seleccionado */
  useEffect(() => {
    const estado = allCases.find(c => c.id === selectedId)?.estado
    if (estado) {
      setClosedFolders(prev => {
        if (!prev.has(estado)) return prev
        const next = new Set(prev)
        next.delete(estado)
        return next
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const toggleFolder = (estado: string) => {
    setClosedFolders(prev => {
      const next = new Set(prev)
      if (next.has(estado)) next.delete(estado)
      else next.add(estado)
      return next
    })
  }

  /* Agrupar por estado y ordenar alfabéticamente dentro de cada carpeta */
  const grouped = ESTADO_ORDER.reduce<{ estado: EstadoAuditoria; cases: AuditoriaCase[] }[]>((acc, estado) => {
    const grp = allCases
      .filter(c => c.estado === estado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    if (grp.length > 0) acc.push({ estado, cases: grp })
    return acc
  }, [])

  const handleSave = (newCase: AuditoriaCase) => {
    const id = userCases.some(c => c.id === newCase.id)
      ? `${newCase.id}-${Date.now()}`
      : newCase.id
    const updated = [...userCases, { ...newCase, id }]
    setUserCases(updated)
    saveToLS(updated)
    setSelectedId(id)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = userCases.filter(c => c.id !== id)
    setUserCases(updated)
    saveToLS(updated)
    if (selectedId === id) setSelectedId(STATIC_CASES[0].id)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Auditoría Cuentas"
        subtitle="Análisis estratégico de cuentas complejas · Uso exclusivo Dirección General"
      />

      {/* ── Navegador de casos ─────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Barra superior */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <FolderOpen size={15} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Casos auditados
            </span>
            <span className="ml-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {allCases.length}
            </span>
            <div className="ml-auto">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: '#1B3FCC' }}
              >
                <Plus size={13} />
                Nueva Auditoría
              </button>
            </div>
          </div>

          {/* Carpetas por estado */}
          <div>
            {grouped.map(({ estado, cases }) => {
              const isOpen = !closedFolders.has(estado)
              const color  = ESTADO_COLOR[estado] ?? '#6366f1'
              const label  = ESTADO_LABEL[estado]  ?? estado

              return (
                <div key={estado} className="border-b border-gray-50 last:border-b-0">
                  {/* Encabezado de carpeta */}
                  <button
                    onClick={() => toggleFolder(estado)}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50/80 transition-colors text-left"
                  >
                    {isOpen
                      ? <ChevronDown  size={12} className="text-gray-300 flex-shrink-0" />
                      : <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                    }
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
                      {label}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {cases.length}
                    </span>
                    {/* Vista previa cuando está cerrada */}
                    {!isOpen && (
                      <span className="ml-1 text-[10px] text-gray-400 truncate flex-1">
                        {cases.slice(0, 5).map(c => c.nombre.split(/[\s·/]/)[0]).join(' · ')}
                        {cases.length > 5 ? ` · +${cases.length - 5} más` : ''}
                      </span>
                    )}
                  </button>

                  {/* Chips de casos dentro de la carpeta */}
                  {isOpen && (
                    <div
                      className="flex overflow-x-auto gap-1 px-4 pb-2.5 pt-1"
                      style={{ background: `${color}06` }}
                    >
                      {cases.map(c => {
                        const active  = selectedId === c.id
                        const isUser  = !STATIC_CASE_IDS.has(c.id)
                        return (
                          <div key={c.id} className="relative group flex-shrink-0">
                            <button
                              onClick={() => setSelectedId(c.id)}
                              className="flex flex-col items-start px-3 py-2 rounded-lg transition-all min-w-[150px] max-w-[210px] text-left"
                              style={active
                                ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' }
                                : { border: '1px solid transparent', background: 'white' }
                              }
                            >
                              <p
                                className="text-xs font-semibold text-gray-800 truncate w-full"
                                style={{ color: active ? '#1B3FCC' : undefined }}
                              >
                                {c.nombre.length > 24 ? c.nombre.slice(0, 24) + '…' : c.nombre}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-0.5">{c.fecha_auditoria}</span>
                            </button>

                            {/* Eliminar — solo casos de usuario */}
                            {isUser && (
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id) }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Vista detalle ─────────────────────────────────────────── */}
      <AuditoriaDetail caso={currentCase} />

      {/* ── Modal: nueva auditoría ────────────────────────────────── */}
      {showForm && (
        <AuditoriaForm onClose={() => setShowForm(false)} onSave={handleSave} />
      )}

      {/* ── Modal: confirmar eliminación ──────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">¿Eliminar auditoría?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Esta acción eliminará el caso del almacenamiento local del navegador. No se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
