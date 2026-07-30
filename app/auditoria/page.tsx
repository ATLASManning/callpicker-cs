'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
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

const ASESOR_COLORS: Record<string, string> = {
  'Fátima':  '#A855F7',
  'Dan':     '#0EA5E9',
  'Claudia': '#F97316',
}

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
  const [openFolder, setOpenFolder]       = useState<string | null>('en_riesgo')

  useEffect(() => {
    const loaded = loadFromLS()
    setUserCases(loaded)
    const caso = new URLSearchParams(window.location.search).get('caso')
    if (caso) {
      setSelectedId(caso)
      const allLoaded = [...STATIC_CASES, ...loaded]
      const target = allLoaded.find(c => c.id === caso)
      if (target) setOpenFolder(target.estado)
    }
  }, [])

  const allCases: AuditoriaCase[] = [...STATIC_CASES, ...userCases]
  const currentCase = allCases.find(c => c.id === selectedId) ?? STATIC_CASES[0]

  const grouped = ESTADO_ORDER.reduce<{ estado: EstadoAuditoria; cases: AuditoriaCase[] }[]>((acc, estado) => {
    const grp = allCases
      .filter(c => c.estado === estado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    if (grp.length > 0) acc.push({ estado, cases: grp })
    return acc
  }, [])

  const toggleFolder = (estado: string) =>
    setOpenFolder(prev => (prev === estado ? null : estado))

  const handleSave = (newCase: AuditoriaCase) => {
    const id = userCases.some(c => c.id === newCase.id)
      ? `${newCase.id}-${Date.now()}`
      : newCase.id
    const updated = [...userCases, { ...newCase, id }]
    setUserCases(updated)
    saveToLS(updated)
    setSelectedId(id)
    setOpenFolder(newCase.estado)
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

      {/* ── Layout de dos columnas ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Sidebar izquierdo: navegador de casos ─────────────────── */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">

          {/* Cabecera del sidebar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <FolderOpen size={14} className="text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Casos auditados
            </span>
            <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {allCases.length}
            </span>
          </div>

          {/* Lista scrollable de grupos y casos */}
          <div className="flex-1 overflow-y-auto py-2">
            {grouped.map(({ estado, cases }) => {
              const isOpen = openFolder === estado
              const color  = ESTADO_COLOR[estado] ?? '#6366f1'
              const label  = ESTADO_LABEL[estado] ?? estado

              return (
                <div key={estado}>
                  {/* Grupo de estado */}
                  <button
                    onClick={() => toggleFolder(estado)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}18`, color }}
                    >
                      {cases.length}
                    </span>
                    {isOpen
                      ? <ChevronDown  size={12} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                    }
                  </button>

                  {/* Casos del grupo */}
                  {isOpen && (
                    <div
                      className="ml-5 border-l pb-1"
                      style={{ borderColor: `${color}30` }}
                    >
                      {cases.map(c => {
                        const active = selectedId === c.id
                        const isUser = !STATIC_CASE_IDS.has(c.id)

                        return (
                          <div key={c.id} className="relative group pr-2">
                            <button
                              onClick={() => setSelectedId(c.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors rounded-r-lg ml-px"
                              style={active
                                ? { background: '#1B3FCC12', borderLeft: `2px solid #1B3FCC` }
                                : { borderLeft: '2px solid transparent' }
                              }
                            >
                              {c.asesor && (
                                <div
                                  className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                                  style={{ background: '#0A1628', color: ASESOR_COLORS[c.asesor] ?? '#fff' }}
                                >
                                  {c.asesor[0]}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <p
                                  className="text-xs font-medium truncate"
                                  style={{ color: active ? '#1B3FCC' : '#374151' }}
                                >
                                  {c.nombre}
                                </p>
                                <span className="text-[10px] text-gray-400">{c.fecha_auditoria}</span>
                              </div>
                            </button>

                            {isUser && (
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id) }}
                                className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded"
                              >
                                <Trash2 size={10} />
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

          {/* Nueva Auditoría — pegada al fondo del sidebar */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#1B3FCC' }}
            >
              <Plus size={12} />
              Nueva Auditoría
            </button>
          </div>
        </aside>

        {/* ─── Panel derecho: detalle del caso ───────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
          <AuditoriaDetail caso={currentCase} />
        </main>

      </div>

      {/* ── Modal: nueva auditoría ──────────────────────────────────── */}
      {showForm && (
        <AuditoriaForm onClose={() => setShowForm(false)} onSave={handleSave} />
      )}

      {/* ── Modal: confirmar eliminación ────────────────────────────── */}
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
