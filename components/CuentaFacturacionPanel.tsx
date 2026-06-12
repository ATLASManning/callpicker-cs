'use client'
import { useEffect, useState } from 'react'
import { ReceiptText, ExternalLink, SearchX, Loader2, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react'

interface LTVRow {
  CID: string
  'Nombre del Cliente': string
  'Tamaño Empresa': string
  'Clasificación LTV': string
  'Segmento Factura': string
  'MRR Limpio': number | null
  'Importe Acumulado Recurrente': number | null
  'Última Factura': string
  'Semáforo Actividad': string
  'Meses Activo': number | null
  'Rango LTV': string
}

interface GroupResult {
  rows: LTVRow[]
  cuentasMesReciente: LTVRow[]
  mrrGrupo: number
  mesReciente: string
  subCuentas: number
  source: string
  error?: string
}

const fmt$ = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

const LTV_COLOR: Record<string, string> = {
  '1 - VIP':    '#1B3FCC',
  '1 - Alto':   '#1B3FCC',
  '2 - Bueno':  '#6366f1',
  '2 - Alto':   '#6366f1',
  '3 - Medio':  '#f59e0b',
  '4 - Bajo':   '#f97316',
  '5 - Minimo': '#ef4444',
}

const SEM_COLOR: Record<string, string> = {
  '1 - Activo':    '#22c55e',
  '2 - En riesgo': '#f59e0b',
  '2 - Riesgo':    '#f59e0b',
  '3 - Alerta':    '#f97316',
  '3 - Irregular': '#f97316',
  '4 - Dormido':   '#94a3b8',
  '0 - Factura Futura': '#a855f7',
}

function Badge({ val, map }: { val: string; map: Record<string, string> }) {
  const color = Object.entries(map).find(([k]) => val?.includes(k.split(' - ')[1] ?? '??'))?.[1]
    ?? map[val] ?? '#94a3b8'
  return (
    <span style={{ background: color + '18', color, fontWeight: 700, fontSize: 10, padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {val || '—'}
    </span>
  )
}

export default function CuentaFacturacionPanel({ cid, empresa, onMrrCalculado }: {
  cid: string | null
  empresa: string
  onMrrCalculado?: (mrr: number) => void
}) {
  const [data, setData] = useState<GroupResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ mode: 'by-cid' })
    if (cid) params.set('cid', cid)
    if (empresa) params.set('nombre', empresa)

    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then((d: GroupResult) => {
        setData(d)
        if (d.mrrGrupo && onMrrCalculado) onMrrCalculado(d.mrrGrupo)
      })
      .catch(() => setData({ rows: [], cuentasMesReciente: [], mrrGrupo: 0, mesReciente: '', subCuentas: 0, source: '', error: 'Error al cargar' }))
      .finally(() => setLoading(false))
  }, [cid, empresa]) // eslint-disable-line react-hooks/exhaustive-deps

  const facturacionUrl = `/facturacion`

  if (loading) return (
    <div className="cp-card">
      <div className="flex items-center gap-2 py-5 justify-center text-textLow">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-[11px]">Consultando Zoho Analytics…</span>
      </div>
    </div>
  )

  const noData = !data || data.error || data.subCuentas === 0

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Facturación · LTV</h3>
          {data && (
            <span className="flex items-center gap-1 text-[9px]" style={{ color: data.source === 'zoho' ? '#22c55e' : '#94a3b8' }}>
              {data.source === 'zoho' ? <Wifi size={9} /> : <WifiOff size={9} />}
              {data.source === 'zoho' ? 'Zoho en vivo' : 'Sin datos'}
            </span>
          )}
        </div>
        <a href={facturacionUrl} className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver en facturación <ExternalLink size={10} />
        </a>
      </div>

      {noData ? (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">{data?.error ?? 'Sin datos de facturación para este cliente'}</p>
          {!cid && <p className="text-[10px] text-amarillo/80 bg-amarillo/10 px-2 py-1 rounded">Configura el CID para búsqueda exacta</p>}
        </div>
      ) : (
        <>
          {/* Total del grupo — destacado */}
          <div style={{ background: 'linear-gradient(135deg, #1B3FCC08, #6366f108)', border: '1px solid #1B3FCC20', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-textLow font-semibold uppercase tracking-wide mb-0.5">
                  MRR Grupo · {data!.mesReciente}
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#1B3FCC', lineHeight: 1 }}>
                  {fmt$(data!.mrrGrupo)}
                </p>
                <p className="text-[10px] text-textLow mt-1">
                  {data!.cuentasMesReciente.length} sub-cuenta{data!.cuentasMesReciente.length !== 1 ? 's' : ''} activas en {data!.mesReciente}
                  {data!.subCuentas > data!.cuentasMesReciente.length && (
                    <span className="text-textLow/60"> · {data!.subCuentas - data!.cuentasMesReciente.length} inactivas no incluidas</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-textLow">Sub-cuentas totales</p>
                <p className="text-lg font-bold text-textMid">{data!.subCuentas}</p>
              </div>
            </div>
          </div>

          {/* Sub-cuentas del mes reciente */}
          {data!.cuentasMesReciente.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between text-[11px] text-textMid font-semibold mb-1.5 hover:text-textHi"
              >
                <span>Sub-cuentas del mes ({data!.mesReciente})</span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {expanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-1.5 text-left text-textLow font-medium text-[10px]">Cuenta</th>
                        <th className="pb-1.5 text-right text-textLow font-medium text-[10px]">MRR</th>
                        <th className="pb-1.5 text-center text-textLow font-medium text-[10px]">LTV</th>
                        <th className="pb-1.5 text-center text-textLow font-medium text-[10px]">Semáforo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.cuentasMesReciente
                        .sort((a, b) => (b['MRR Limpio'] ?? 0) - (a['MRR Limpio'] ?? 0))
                        .map((r, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-surface/50">
                            <td className="py-1.5 text-textMid max-w-[140px] truncate font-medium">{r['Nombre del Cliente']}</td>
                            <td className="py-1.5 text-right font-bold text-cp tabular-nums">{fmt$(r['MRR Limpio'])}</td>
                            <td className="py-1.5 text-center"><Badge val={r['Clasificación LTV']} map={LTV_COLOR} /></td>
                            <td className="py-1.5 text-center"><Badge val={r['Semáforo Actividad']} map={SEM_COLOR} /></td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td className="pt-1.5 text-[10px] font-bold text-textMid">TOTAL</td>
                        <td className="pt-1.5 text-right font-bold text-cp tabular-nums">{fmt$(data!.mrrGrupo)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Cuentas inactivas (no en mes reciente) */}
          {!expanded && data!.subCuentas > data!.cuentasMesReciente.length && (
            <p className="text-[10px] text-textLow/50 text-center mt-1 italic">
              {data!.subCuentas - data!.cuentasMesReciente.length} sub-cuenta(s) sin factura en {data!.mesReciente} — no incluidas en el total
            </p>
          )}
        </>
      )}
    </div>
  )
}
