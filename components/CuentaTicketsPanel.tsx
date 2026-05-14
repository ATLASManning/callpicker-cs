'use client'
import { useState, useEffect, useCallback } from 'react'
import { Ticket, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, SearchX } from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════════ */
interface TicketRow {
  cid: string; num: string; empresa: string; fecha: string
  ticket_id: string; categoria: string; subcategoria: string
  es_falla: string; producto: string; enlace: string
  propietario: string; apertura: string; cierre: string
  duracion: string; prioridad: string
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════ */
const PRIOR_COLOR: Record<string, string> = {
  High:   '#ef4444', Medium: '#f59e0b',
  Low:    '#22c55e', Urgent: '#b91c1c',
}

function PriorBadge({ p }: { p: string }) {
  const color = PRIOR_COLOR[p] ?? '#6b7280'
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {p}
    </span>
  )
}

function fmtFecha(d: string) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch { return d }
}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE
══════════════════════════════════════════════════════════════════════ */
export default function CuentaTicketsPanel({
  cid,
  empresa,
}: {
  cid: string | null
  empresa: string
}) {
  const [rows, setRows]       = useState<TicketRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [searchKey, setSearchKey] = useState('')   // para mostrar qué se buscó

  const load = useCallback(async () => {
    setLoading(true)

    // Intentar 1: match exacto por CID
    if (cid) {
      const trimCid = cid.trim()
      setSearchKey(`CID: ${trimCid}`)
      const d1 = await fetch(`/api/tickets?cid=${encodeURIComponent(trimCid)}&limit=20&page=1`).then(r => r.json())
      if ((d1.total ?? 0) > 0) {
        setRows(d1.rows ?? [])
        setTotal(d1.total ?? 0)
        setLoading(false)
        return
      }
    }

    // Intentar 2: búsqueda por nombre completo de empresa
    const q1 = empresa.trim()
    setSearchKey(`Empresa: ${q1}`)
    const d2 = await fetch(`/api/tickets?q=${encodeURIComponent(q1)}&limit=20&page=1`).then(r => r.json())
    if ((d2.total ?? 0) > 0) {
      setRows(d2.rows ?? [])
      setTotal(d2.total ?? 0)
      setLoading(false)
      return
    }

    // Intentar 3: primera palabra significativa del nombre (para variaciones)
    const palabras = normalize(empresa).split(/\s+/).filter(p => p.length >= 4)
    if (palabras.length > 0) {
      const q2 = palabras[0]
      setSearchKey(`Parcial: "${q2}"`)
      const d3 = await fetch(`/api/tickets?q=${encodeURIComponent(q2)}&limit=20&page=1`).then(r => r.json())
      setRows(d3.rows ?? [])
      setTotal(d3.total ?? 0)
    } else {
      setRows([])
      setTotal(0)
    }

    setLoading(false)
  }, [cid, empresa])

  useEffect(() => { load() }, [load])

  const fallas     = rows.filter(t => t.es_falla === 'Si').length
  const lastFecha  = rows[0]?.fecha ?? ''
  const visible    = expanded ? rows : rows.slice(0, 5)

  const ticketsUrl = cid
    ? `/tickets?cid=${encodeURIComponent(cid)}`
    : `/tickets?q=${encodeURIComponent(empresa)}`

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ticket size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
            Tickets Zoho Desk
          </h3>
          {!loading && (
            <span className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${total > 0 ? 'bg-cp/80' : 'bg-textLow/40'}`}>
              {total}
            </span>
          )}
          {fallas > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-rojo bg-rojo/10 px-1.5 py-0.5 rounded-full">
              <AlertTriangle size={9} /> {fallas} falla{fallas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <a href={ticketsUrl}
          className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver todos <ExternalLink size={10} />
        </a>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-1.5">
          {[1,2,3].map(i => <div key={i} className="h-6 bg-surface rounded animate-pulse" />)}
        </div>
      ) : total === 0 ? (
        /* Estado vacío — siempre visible */
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">Sin tickets en Zoho Desk</p>
          {searchKey && (
            <p className="text-[10px] text-textLow/60 italic">Buscado por {searchKey}</p>
          )}
          {!cid && (
            <p className="text-[10px] text-amarillo/80 bg-amarillo/10 px-2 py-1 rounded">
              Configura el CID en la cuenta para match exacto
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Resumen rápido */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total',       val: total },
              { label: 'Fallas',      val: fallas, color: fallas > 0 ? '#ef4444' : undefined },
              { label: 'Últ. ticket', val: fmtFecha(lastFecha), mono: true },
            ].map(({ label, val, color, mono }) => (
              <div key={label} className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-textLow mb-0.5">{label}</p>
                <p className={`text-xs font-bold ${mono ? 'text-textMid' : 'text-textHi'}`}
                  style={color ? { color } : {}}>
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Fecha</th>
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Categoría</th>
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Producto</th>
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Prior.</th>
                  <th className="text-center pb-1.5 text-textLow font-medium text-[10px]">Falla</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                    <td className="py-1.5 text-textLow">{fmtFecha(t.fecha)}</td>
                    <td className="py-1.5 text-textMid max-w-[120px] truncate">{t.categoria}</td>
                    <td className="py-1.5 text-textMid max-w-[100px] truncate">{t.producto}</td>
                    <td className="py-1.5"><PriorBadge p={t.prioridad} /></td>
                    <td className="py-1.5 text-center">
                      {t.es_falla === 'Si'
                        ? <span className="text-[9px] font-bold text-rojo">●</span>
                        : <span className="text-[9px] text-textLow">○</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expandir / colapsar */}
          {rows.length > 5 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-2 flex items-center gap-1 text-[10px] text-cp hover:text-cp/80 transition-colors w-full justify-center py-1">
              {expanded
                ? <><ChevronDown size={11} className="rotate-180" /> Ver menos</>
                : <><ChevronDown size={11} /> Ver {rows.length - 5} más</>
              }
            </button>
          )}
        </>
      )}
    </div>
  )
}
