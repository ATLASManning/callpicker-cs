'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import type { AuditoriaCase } from './types'
import { ARKANSAS }         from './arkansas-data'
import { FINSUS }           from './finsus-data'
import { AGUA_INMACULADA }  from './agua-inmaculada-data'
import { SALUD_Y_HOGAR }   from './salud-y-hogar-data'
import { SAMALAB }         from './samalab-data'
import { LABSUS }          from './labsus-data'
import { GRUPOFRISA }      from './grupofrisa-data'
import AuditoriaDetail from './AuditoriaDetail'
import AuditoriaForm from './AuditoriaForm'

/* ─── Constantes ─────────────────────────────────────────────────────── */
const LS_KEY = 'auditoria_casos'

const ESTADO_COLOR: Record<string, string> = {
  rescatable: '#22c55e',
  en_riesgo:  '#ef4444',
  recuperado: '#3b82f6',
  perdido:    '#6b7280',
  activo:     '#6366f1',
}

/* ─── Helpers de localStorage ────────────────────────────────────────── */
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

/* ─── Página principal ───────────────────────────────────────────────── */
export default function AuditoriaPage() {
  const [userCases, setUserCases]       = useState<AuditoriaCase[]>([])
  const [selectedId, setSelectedId]     = useState<string>('arkansas')
  const [showForm, setShowForm]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  /* Cargar casos guardados del usuario */
  useEffect(() => {
    setUserCases(loadFromLS())
  }, [])

  /* Lista completa de casos (ARKANSAS siempre primero) */
  const allCases: AuditoriaCase[] = [ARKANSAS, FINSUS, GRUPOFRISA, AGUA_INMACULADA, SALUD_Y_HOGAR, SAMALAB, LABSUS, ...userCases]
  const currentCase = allCases.find(c => c.id === selectedId) ?? ARKANSAS

  /* Guardar nuevo caso */
  const handleSave = (newCase: AuditoriaCase) => {
    // Evitar ID duplicados
    const id = userCases.some(c => c.id === newCase.id)
      ? `${newCase.id}-${Date.now()}`
      : newCase.id
    const updated = [...userCases, { ...newCase, id }]
    setUserCases(updated)
    saveToLS(updated)
    setSelectedId(id)
    setShowForm(false)
  }

  /* Eliminar caso de usuario */
  const handleDelete = (id: string) => {
    const updated = userCases.filter(c => c.id !== id)
    setUserCases(updated)
    saveToLS(updated)
    if (selectedId === id) setSelectedId('arkansas')
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Auditoría Cuentas"
        subtitle="Análisis estratégico de cuentas complejas · Uso exclusivo Dirección General"
      />

      {/* ── Barra de selección de casos ──────────────────────────────── */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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

          {/* Tabs de casos */}
          <div className="flex overflow-x-auto gap-1 p-2">
            {allCases.map(c => {
              const active  = selectedId === c.id
              const eColor  = ESTADO_COLOR[c.estado] ?? '#6366f1'
              const isUser  = !['arkansas', 'finsus', 'grupofrisa', 'agua-inmaculada', 'salud-y-hogar', 'samalab', 'labsus'].includes(c.id)
              return (
                <div key={c.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="flex flex-col items-start px-4 py-2.5 rounded-lg transition-all min-w-[160px] max-w-[220px] text-left"
                    style={active
                      ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' }
                      : { border: '1px solid transparent' }
                    }
                  >
                    {/* Dot de estado */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: eColor }} />
                      <p className="text-xs font-semibold text-gray-800 truncate flex-1"
                        style={{ color: active ? '#1B3FCC' : undefined }}>
                        {c.nombre.length > 24 ? c.nombre.slice(0, 24) + '…' : c.nombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 w-full pl-4">
                      <span className="text-[10px] text-gray-400 truncate">{c.fecha_auditoria}</span>
                      <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded"
                        style={{ background: `${eColor}20`, color: eColor }}>
                        {c.estado}
                      </span>
                    </div>
                  </button>

                  {/* Botón de eliminar — solo para casos de usuario */}
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

            {/* Placeholder si solo hay ARKANSAS */}
            {allCases.length === 1 && (
              <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-400">
                <span>↑ Crea tu primera auditoría con el botón</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Vista detalle del caso seleccionado ──────────────────────── */}
      <AuditoriaDetail caso={currentCase} />

      {/* ── Modal: formulario de nueva auditoría ─────────────────────── */}
      {showForm && (
        <AuditoriaForm
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Modal: confirmar eliminación ─────────────────────────────── */}
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
