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
  /* null = todo contraído (estado inicial) */
  const [openFolder, setOpenFolder]       = useState<string | null>(null)

  useEffect(() => {
    const loaded = loadFromLS()
    setUserCases(loaded)
    const caso = new URLSearchParams(window.location.search).get('caso')
    if (caso) {
      setSelectedId(caso)
      /* Auto-abrir la carpeta del caso enlazado via URL */
      const allLoaded = [...STATIC_CASES, ...loaded]
      const target = allLoaded.find(c => c.id === caso)
      if (target) setOpenFolder(target.estado)
    }
  }, [])

  const allCases: AuditoriaCase[] = [...STATIC_CASES, ...userCases]
  const currentCase = allCases.find(c => c.id === selectedId) ?? STATIC_CASES[0]

  /* Agrupar por estado y ordenar alfabéticamente */
  const grouped = ESTADO_ORDER.reduce<{ estado: EstadoAuditoria; cases: AuditoriaCase[] }[]>((acc, estado) => {
    const grp = allCases
      .filter(c => c.estado === estado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    if (grp.length > 0) acc.push({ estado, cases: grp })
    return acc
  }, [])

  const toggleFolder = (estado: string) => {
    setOpenFolder(prev => (prev === estado ? null : estado))
  }

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

  /* Casos del folder actualmente abierto */
  const openGroup = grouped.find(g => g.estado === openFolder) ?? null

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

          {/* Botones de estado — horizontales, coloridos */}
          <div className="flex flex-wrap gap-2.5 px-4 py-3">
            {grouped.map(({ estado, cases }) => {
              const isOpen = openFolder === estado
              const color  = ESTADO_COLOR[estado] ?? '#6366f1'
              const label  = ESTADO_LABEL[estado]  ?? estado

              return (
                <button
                  key={estado}
                  onClick={() => toggleFolder(estado)}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background:  color,
                    boxShadow:   isOpen ? `0 4px 16px ${color}55` : '0 1px 3px rgba(0,0,0,0.12)',
                    transform:   isOpen ? 'translateY(-1px)' : undefined,
                  }}
                >
                  <span className="uppercase tracking-wide">{label}</span>
                  <span
                    className="flex items-center justify-center rounded-lg font-extrabold text-sm min-w-[26px] h-6 px-1.5"
                    style={{ background: 'rgba(255,255,255,0.28)', color: 'white' }}
                  >
                    {cases.length}
                  </span>
                  {isOpen
                    ? <ChevronDown  size={15} className="opacity-80" />
                    : <ChevronRight size={15} className="opacity-80" />
                  }
                </button>
              )
            })}
          </div>

          {/* Panel de casos del folder abierto */}
          {openGroup && (
            <div
              className="border-t border-gray-100 px-4 pb-3 pt-2.5"
              style={{ background: `${ESTADO_COLOR[openGroup.estado] ?? '#6366f1'}07` }}
            >
              <div className="flex overflow-x-auto gap-1.5 pb-0.5">
                {openGroup.cases.map(c => {
                  const active = selectedId === c.id
                  const isUser = !STATIC_CASE_IDS.has(c.id)
                  return (
                    <div key={c.id} className="relative group flex-shrink-0">
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className="flex flex-col items-start px-3 py-2 rounded-lg transition-all min-w-[155px] max-w-[215px] text-left"
                        style={active
                          ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' }
                          : { border: '1px solid #E5E7EB', background: 'white' }
                        }
                      >
                        <p
                          className="text-xs font-semibold truncate w-full"
                          style={{ color: active ? '#1B3FCC' : '#1e293b' }}
                        >
                          {c.nombre.length > 26 ? c.nombre.slice(0, 26) + '…' : c.nombre}
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
            </div>
          )}
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
