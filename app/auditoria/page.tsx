'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
/* `FolderOpen`, `ChevronDown` y `ChevronRight` salieron con el acordeón: la
   barra ya no abre ni cierra carpetas, el estado se elige arriba. */
import { Plus, Trash2 } from 'lucide-react'
import type { AuditoriaCase, EstadoAuditoria } from './types'
import { STATIC_CASES, STATIC_CASE_IDS } from './cases'
import AuditoriaDetail from './AuditoriaDetail'
import AuditoriaForm from './AuditoriaForm'
import { tonoSobreClaro, tonoSobreFondo, tonoSobreTinte } from '@/lib/contraste'

const LS_KEY = 'auditoria_casos'

/** El fondo REAL de esta página: `bg-gray-50`, no blanco. Todo tono que caiga
 *  aquí se calcula contra esto — ver `tonoSobreTinte` en `lib/contraste.ts`. */
const FONDO_PAGINA_AUDITORIA = '#F9FAFB'

const ESTADO_COLOR: Record<string, string> = {
  en_riesgo:      '#ef4444',
  en_recuperacion:'#f59e0b',
  rescatable:     '#22c55e',
  activo:         '#6366f1',
  recuperado:     '#3b82f6',
  perdido:        '#6b7280',
}

const ESTADO_LABEL: Record<string, string> = {
  en_riesgo:      'En Riesgo',
  en_recuperacion:'En Recuperación',
  rescatable:     'Rescatable',
  activo:         'Activo',
  recuperado:     'Recuperado',
  perdido:        'Perdido',
}

const ESTADO_ORDER: EstadoAuditoria[] = ['en_riesgo', 'en_recuperacion', 'rescatable', 'activo', 'recuperado', 'perdido']

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

  /* FILTRO, no acordeón: siempre hay exactamente un estado elegido.
     Volver a pulsar el activo no lo apaga — una barra vacía no es un estado
     útil, y antes se podía llegar a ella sin querer. */
  const elegirEstado = (estado: string) => setOpenFolder(estado)

  /* El estado que se está viendo, y sus casos. Si el elegido se queda sin
     casos —se borró el último— cae al primero que tenga, en vez de dejar la
     barra vacía con un rótulo que promete contenido. */
  const estadoActivo = grouped.some(g => g.estado === openFolder)
    ? openFolder
    : grouped[0]?.estado ?? null
  const casosVisibles = grouped.find(g => g.estado === estadoActivo)?.cases ?? []
  const colorActivo = ESTADO_COLOR[estadoActivo ?? ''] ?? '#6366f1'

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
      {/* ── LOS ESTADOS, EN HORIZONTAL Y FRENTE AL TÍTULO ───────────────
       *
       * Instrucción de dirección, 9 oct 2026: «colócalas de manera horizontal
       * frente al título, para que se aproveche toda la página y permita verse
       * mejor la información».
       *
       * Vivían apiladas dentro de la barra de 256px, cada una como carpeta de
       * acordeón. Eso costaba dos cosas: cinco renglones de alto antes de ver
       * un solo caso, y que el reparto de la cartera auditada —23 · 1 · 1 · 6
       * · 3— sólo se pudiera leer barriendo la columna de arriba abajo. En
       * fila se lee de un vistazo y la barra queda para lo que es, la lista de
       * casos del estado elegido.
       *
       * Dejan de ser acordeón y pasan a ser FILTRO: uno a la vez. Antes dos
       * grupos podían estar abiertos y la barra se volvía una lista larga sin
       * saber a qué estado pertenecía cada fila al llegar a la mitad. */}
      <PageHeader
        title="Auditoría Cuentas"
        subtitle="Análisis estratégico de cuentas complejas · Uso exclusivo Dirección General"
        actions={
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {grouped.map(({ estado, cases }) => {
              const color  = ESTADO_COLOR[estado] ?? '#6366f1'
              const activo = openFolder === estado
              return (
                <button
                  key={estado}
                  onClick={() => elegirEstado(estado)}
                  title={`${cases.length} ${cases.length === 1 ? 'caso' : 'casos'} en ${ESTADO_LABEL[estado] ?? estado}`}
                  className="flex items-center gap-1.5 rounded-lg transition-all"
                  style={{
                    padding: '6px 10px',
                    /* El tinte del seleccionado es el DOBLE del de reposo, no
                       un color distinto: así la fila entera se lee como una
                       sola escala y el elegido no parece de otra familia. */
                    background: activo ? `${color}22` : `${color}10`,
                    border: `1px solid ${activo ? color : `${color}33`}`,
                    boxShadow: activo ? `0 0 0 2px ${color}22` : 'none',
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                    /* El punto NO va con el color crudo: medido el 9 oct, el
                       ámbar daba 2.06:1 contra el `#F9FAFB` de la página y el
                       verde 2.18:1, cuando un objeto gráfico pide 3:1. Se
                       oscurece lo justo; el relleno de la pastilla conserva el
                       tono original, que es lo que comunica. */
                    background: tonoSobreFondo(color, FONDO_PAGINA_AUDITORIA, 3),
                  }} />
                  <span className="text-[11.5px] font-semibold"
                    style={{ color: activo ? '#122E5E' : '#334155' }}>
                    {ESTADO_LABEL[estado] ?? estado}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${color}22`,
                      /* Contra el fondo REAL —el tinte sobre el gris de la
                         página—, no contra blanco. Las seis salían entre 4.32
                         y 4.43:1 con el cálculo anterior. */
                      color: tonoSobreTinte(color, 0.094 + 0.133, FONDO_PAGINA_AUDITORIA),
                    }}>
                    {cases.length}
                  </span>
                </button>
              )
            })}
          </div>
        }
      />

      {/* ── Layout de dos columnas ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Sidebar izquierdo: navegador de casos ─────────────────── */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">

          {/* Cabecera del sidebar: ya no dice «Casos auditados» a secas, dice
              DE QUÉ ESTADO son los que están debajo. Con el filtro arriba, la
              barra enseña un subconjunto y callarlo haría que 7 casos se
              leyeran como toda la cartera auditada. El total sigue visible. */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span style={{
              width: 9, height: 9, borderRadius: 999, flexShrink: 0,
              background: tonoSobreFondo(colorActivo, '#FFFFFF', 3),
            }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: tonoSobreClaro(colorActivo, 0) }}>
              {ESTADO_LABEL[estadoActivo ?? ''] ?? 'Casos auditados'}
            </span>
            <span className="ml-auto text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {casosVisibles.length} de {allCases.length}
            </span>
          </div>

          {/* Los casos del estado elegido. La lista ya no se anida bajo una
              carpeta: el estado lo dice la cabecera de arriba y el filtro del
              encabezado, así que la sangría sólo quitaba ancho al nombre de la
              cuenta, que es lo único que hay que leer aquí. */}
          <div className="flex-1 overflow-y-auto py-1">
            {casosVisibles.map(c => {
              const active = selectedId === c.id
              const isUser = !STATIC_CASE_IDS.has(c.id)

              return (
                <div key={c.id} className="relative group pr-2">
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors rounded-r-lg"
                    style={active
                      ? { background: '#1B3FCC12', borderLeft: '3px solid #1B3FCC' }
                      : { borderLeft: '3px solid transparent' }
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
                      <span className="text-[10px] text-gray-500">{c.fecha_auditoria}</span>
                    </div>
                  </button>

                  {isUser && (
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id) }}
                      className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-0.5 rounded"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              )
            })}

            {!casosVisibles.length && (
              <p className="px-4 py-6 text-xs text-gray-500">
                No hay casos auditados en este estado.
              </p>
            )}
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
                /* `bg-red-500` con letra blanca mide 3.76:1 — por debajo de AA
                   y en el botón que borra, que es donde menos conviene dudar
                   de lo que se lee. El `-600` da 4.83:1. */
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
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
