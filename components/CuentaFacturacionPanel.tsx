import { ReceiptText, ExternalLink, TrendingUp, TrendingDown, Minus, SearchX } from 'lucide-react'
import type { FactRow } from '@/lib/cuenta-data'

function fmtMXN(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

function fmtFecha(d: string) {
  if (!d) return '—'
  try { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return d }
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

function Trend({ rows }: { rows: FactRow[] }) {
  if (rows.length < 2) return <Minus size={10} className="text-textLow" />
  const curr = rows[0]['Monto del plan'] ?? 0
  const prev = rows[1]['Monto del plan'] ?? 0
  if (curr > prev) return <TrendingUp size={10} className="text-verde" />
  if (curr < prev) return <TrendingDown size={10} className="text-rojo" />
  return <Minus size={10} className="text-textLow" />
}

export default function CuentaFacturacionPanel({
  rows, matchedBy, cid, empresa,
}: {
  rows: FactRow[]
  matchedBy: string
  cid: string | null
  empresa: string
}) {
  const latest    = rows[0]
  const mrr       = latest?.['Monto del plan'] ?? null
  const consumo   = latest?.['% Consumo'] ?? null
  const toggle    = latest?.['Toggle Status'] ?? 0
  const lastFecha = latest?.['Fecha de corte'] ?? ''
  const plan      = latest?.['Nombre del Plan'] ?? ''

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
            Corte de Facturación
          </h3>
          <span className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${rows.length > 0 ? 'bg-cp/80' : 'bg-textLow/40'}`}>
            {rows.length} cortes
          </span>
        </div>
        <a href={facturacionUrl} className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver todos <ExternalLink size={10} />
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">Sin cortes de facturación encontrados</p>
          {!cid && (
            <p className="text-[10px] text-amarillo/80 bg-amarillo/10 px-2 py-1 rounded">
              Configura el CID en la cuenta para match exacto
            </p>
          )}
        </div>
      ) : (
        <>
          {/* 4 KPIs */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-surface rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-textLow mb-0.5">MRR</p>
              <p className="text-[11px] font-bold text-textHi flex items-center justify-center gap-1">
                {fmtMXN(mrr)} <Trend rows={rows} />
              </p>
            </div>
            <div className="bg-surface rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-textLow mb-0.5">Consumo</p>
              <div className="flex justify-center"><ConsumoBadge pct={consumo} /></div>
            </div>
            <div className="bg-surface rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-textLow mb-0.5">Toggle</p>
              <p className="text-[11px] font-bold text-center">
                {toggle && toggle > 0
                  ? <span className="text-verde">● Activo</span>
                  : <span className="text-textLow">○ Inactivo</span>}
              </p>
            </div>
            <div className="bg-surface rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-textLow mb-0.5">Últ. corte</p>
              <p className="text-[11px] font-bold text-textMid">{fmtFecha(lastFecha)}</p>
            </div>
          </div>

          {/* Plan */}
          {plan && (
            <div className="mb-3 px-3 py-2 bg-cp/5 border border-cp/20 rounded-lg">
              <p className="text-[10px] text-textLow">Plan activo</p>
              <p className="text-xs font-semibold text-cp truncate">{plan}</p>
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Fecha','Plan','MRR','Consumo','Toggle'].map((h, i) => (
                    <th key={h} className={`pb-1.5 text-textLow font-medium text-[10px] ${i >= 2 ? (i === 2 ? 'text-right' : 'text-center') : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                    <td className="py-1.5 text-textLow whitespace-nowrap">{fmtFecha(r['Fecha de corte'])}</td>
                    <td className="py-1.5 text-textMid max-w-[100px] truncate text-[10px]">{r['Nombre del Plan']}</td>
                    <td className="py-1.5 text-textHi font-medium text-right tabular-nums">{fmtMXN(r['Monto del plan'])}</td>
                    <td className="py-1.5 text-center"><ConsumoBadge pct={r['% Consumo']} /></td>
                    <td className="py-1.5 text-center text-[9px]">
                      {(r['Toggle Status'] ?? 0) > 0
                        ? <span className="font-bold text-verde">●</span>
                        : <span className="text-textLow">○</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {matchedBy && !cid && (
            <p className="mt-2 text-[9px] text-textLow/50 text-center italic">Coincidencia por {matchedBy}</p>
          )}
        </>
      )}
    </div>
  )
}
