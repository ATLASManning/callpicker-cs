'use client'
import { useState, useEffect, useCallback } from 'react'
import { ReceiptText, ExternalLink, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, SearchX } from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════════ */
interface FactRow {
  CID: string
  'Nombre del Cliente': string
  'Fecha de corte': string
  Periodo: string
  'Nombre del Plan': string
  'Monto del plan': number | null
  '% Consumo': number | null
  'Toggle Status': number | null
  'Minutos Incluidos': number | null
  'Minutos Consumidos': number | null
  'Clasificación de empresa': string
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════ */
function fmtMXN(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

function fmtFecha(d: string) {
  if (!d) return '—'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch { return d }
}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

function ConsumoBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-textLow text-[10px]">—</span>
  const color = pct >= 50 ? '#22c55e' : pct >= 20 ? '#f59e0b' : '#ef4444'
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {pct.toFixed(0)}%
    </span>
  )
}

function ToggleDot({ val }: { val: number | null }) {
  return val && val > 0
    ? <span className="text-[9px] font-bold text-verde">●</span>
    : <span className="text-[9px] text-textLow">○</span>
}

function MrrTrend({ rows }: { rows: FactRow[] }) {
  if (rows.length < 2) return <Minus size={10} className="text-textLow" />
  const curr = rows[0]['Monto del plan'] ?? 0
  const prev = rows[1]['Monto del plan'] ?? 0
  if (curr > prev) return <TrendingUp size={10} className="text-verde" />
  if (curr < prev) return <TrendingDown size={10} className="text-rojo" />
  return <Minus size={10} className="text-textLow" />
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE
══════════════════════════════════════════════════════════════════════ */
export default function CuentaFacturacionPanel({
  cid,
  empresa,
}: {
  cid: string | null
  empresa: string
}) {
  const [rows, setRows]         = useState<FactRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [searchKey, setSearchKey] = useState('')

  const load = useCallback(async () => {
    setLoading(true)

    const fetchRows = async (q: string): Promise<FactRow[]> => {
      const d = await fetch(`/api/facturacion?mode=list&q=${encodeURIComponent(q)}&size=24`)
        .then(r => r.json())
      return (d.rows ?? []) as FactRow[]
    }

    let found: FactRow[] = []

    // Intentar 1: match exacto por CID
    if (cid) {
      const trimCid = cid.trim()
      const allCid = await fetchRows(trimCid)
      // Filtrar exacto — probar tanto string puro como con trim
      found = allCid.filter(r => (r.CID ?? '').trim() === trimCid)
      if (found.length > 0) {
        setSearchKey(`CID: ${trimCid}`)
        found.sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
        setRows(found)
        setLoading(false)
        return
      }
    }

    // Intentar 2: nombre completo de empresa
    const q1 = empresa.trim()
    const all2 = await fetchRows(q1)
    if (all2.length > 0) {
      setSearchKey(`Empresa: ${q1}`)
      all2.sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
      setRows(all2)
      setLoading(false)
      return
    }

    // Intentar 3: primera palabra significativa del nombre
    const palabras = normalize(empresa).split(/\s+/).filter(p => p.length >= 4)
    if (palabras.length > 0) {
      const q2 = palabras[0]
      const all3 = await fetchRows(q2)
      if (all3.length > 0) {
        setSearchKey(`Parcial: "${q2}"`)
        all3.sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
        setRows(all3)
        setLoading(false)
        return
      }
    }

    setSearchKey(cid ? `CID: ${cid} / ${empresa}` : empresa)
    setRows([])
    setLoading(false)
  }, [cid, empresa])

  useEffect(() => { load() }, [load])

  const latest    = rows[0]
  const mrr       = latest?.['Monto del plan'] ?? 0
  const consumo   = latest?.['% Consumo'] ?? null
  const toggle    = latest?.['Toggle Status'] ?? 0
  const lastFecha = latest?.['Fecha de corte'] ?? ''
  const plan      = latest?.['Nombre del Plan'] ?? '—'
  const visible   = expanded ? rows : rows.slice(0, 5)

  const facturacionUrl = cid
    ? `/facturacion?q=${encodeURIComponent(cid)}`
    : `/facturacion?q=${encodeURIComponent(empresa)}`

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
            Facturación
          </h3>
          {!loading && (
            <span className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${rows.length > 0 ? 'bg-cp/80' : 'bg-textLow/40'}`}>
              {rows.length} cortes
            </span>
          )}
        </div>
        <a href={facturacionUrl}
          className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver todos <ExternalLink size={10} />
        </a>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-1.5">
          {[1,2,3].map(i => <div key={i} className="h-6 bg-surface rounded animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        /* Estado vacío — siempre visible */
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">Sin cortes de facturación encontrados</p>
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
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'MRR',        val: fmtMXN(mrr),         extra: <MrrTrend rows={rows} /> },
              { label: '% Consumo',  val: null,                 badge: <ConsumoBadge pct={consumo} /> },
              { label: 'Toggle',     val: null,                 dot: <ToggleDot val={toggle} /> },
              { label: 'Últ. corte', val: fmtFecha(lastFecha),  mono: true },
            ].map(({ label, val, extra, badge, dot, mono }) => (
              <div key={label} className="bg-surface rounded-lg px-2 py-2 text-center">
                <p className="text-[10px] text-textLow mb-0.5">{label}</p>
                {val !== null
                  ? <p className={`text-[11px] font-bold ${mono ? 'text-textMid' : 'text-textHi'} flex items-center justify-center gap-1`}>
                      {val} {extra}
                    </p>
                  : <div className="flex items-center justify-center">{badge ?? dot}</div>
                }
              </div>
            ))}
          </div>

          {/* Plan activo */}
          {plan !== '—' && (
            <div className="mb-3 px-3 py-2 bg-cp/5 border border-cp/20 rounded-lg">
              <p className="text-[10px] text-textLow">Plan activo</p>
              <p className="text-xs font-semibold text-cp truncate">{plan}</p>
            </div>
          )}

          {/* Tabla histórico */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Fecha</th>
                  <th className="text-left pb-1.5 text-textLow font-medium text-[10px]">Plan</th>
                  <th className="text-right pb-1.5 text-textLow font-medium text-[10px]">MRR</th>
                  <th className="text-center pb-1.5 text-textLow font-medium text-[10px]">Consumo</th>
                  <th className="text-center pb-1.5 text-textLow font-medium text-[10px]">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                    <td className="py-1.5 text-textLow whitespace-nowrap">{fmtFecha(r['Fecha de corte'])}</td>
                    <td className="py-1.5 text-textMid max-w-[110px] truncate text-[10px]">{r['Nombre del Plan']}</td>
                    <td className="py-1.5 text-textHi font-medium text-right tabular-nums">{fmtMXN(r['Monto del plan'])}</td>
                    <td className="py-1.5 text-center"><ConsumoBadge pct={r['% Consumo']} /></td>
                    <td className="py-1.5 text-center"><ToggleDot val={r['Toggle Status']} /></td>
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
