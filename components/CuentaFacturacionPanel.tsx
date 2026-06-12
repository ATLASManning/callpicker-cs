'use client'
import { useEffect, useState } from 'react'
import { ReceiptText, ExternalLink, SearchX, Loader2, TrendingUp, Wifi, WifiOff } from 'lucide-react'

interface LTVRow {
  CID: string
  'Nombre del Cliente': string
  'Tamaño Empresa': string
  'Clasificación LTV': string
  'Clasificación Cliente': string
  'Segmento Factura': string
  'MRR Limpio': number | null
  'Importe Acumulado Recurrente': number | null
  'Importe Acumulado Bruto': number | null
  'Meses Activo': number | null
  'Meses con Factura': number | null
  'Primera Factura': string
  'Última Factura': string
  'Semáforo Actividad': string
  'Es One Timer': string
  'MRR por Mes Facturado': number | null
  'Total Facturas': number | null
  'Rango LTV': string
  'Días sin Factura': number | null
  'Ticket Promedio': number | null
}

const fmt$ = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

const LTV_COLOR: Record<string, string> = {
  '1 - Alto':   '#1B3FCC',
  '2 - Bueno':  '#6366f1',
  '3 - Medio':  '#f59e0b',
  '4 - Bajo':   '#f97316',
  '5 - Minimo': '#ef4444',
}

const SEM_COLOR: Record<string, string> = {
  '1 - Activo':    '#22c55e',
  '2 - En riesgo': '#f59e0b',
  '3 - Irregular': '#f97316',
  '4 - Dormido':   '#94a3b8',
}

function Badge({ val, map }: { val: string; map: Record<string, string> }) {
  const color = map[val] ?? '#94a3b8'
  return (
    <span style={{ background: color + '18', color, fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 99 }}>
      {val || '—'}
    </span>
  )
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] text-textLow mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-textHi leading-tight">{value}</p>
    </div>
  )
}

export default function CuentaFacturacionPanel({
  cid, empresa,
}: {
  cid: string | null
  empresa: string
}) {
  const [row, setRow] = useState<LTVRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ mode: 'by-cid' })
    if (cid) params.set('cid', cid)
    if (empresa) params.set('nombre', empresa)

    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then(d => {
        setSource(d.source ?? '')
        if (d.error) { setError(d.error); return }
        setRow(d.rows?.[0] ?? null)
      })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [cid, empresa])

  const facturacionUrl = `/facturacion?tab=clientes&q=${encodeURIComponent(cid ?? empresa)}`

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={13} className="text-textMid" />
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Facturación · LTV</h3>
          {!loading && (
            <span className="flex items-center gap-1 text-[9px]" style={{ color: source === 'zoho' ? '#22c55e' : '#94a3b8' }}>
              {source === 'zoho' ? <Wifi size={9} /> : <WifiOff size={9} />}
              {source === 'zoho' ? 'Zoho' : 'Sin datos'}
            </span>
          )}
        </div>
        <a href={facturacionUrl} className="flex items-center gap-1 text-[10px] text-cp hover:underline">
          Ver en facturación <ExternalLink size={10} />
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-5 text-textLow">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px]">Consultando Zoho…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <WifiOff size={20} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">{error}</p>
        </div>
      ) : !row ? (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <SearchX size={22} className="text-textLow/40" />
          <p className="text-[11px] text-textLow">Sin datos de facturación para este cliente</p>
          {!cid && (
            <p className="text-[10px] text-amarillo/80 bg-amarillo/10 px-2 py-1 rounded">
              Configura el CID para búsqueda exacta
            </p>
          )}
        </div>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <KpiCell label="MRR Limpio" value={fmt$(row['MRR Limpio'])} />
            <KpiCell label="Acum. Recurrente" value={fmt$(row['Importe Acumulado Recurrente'])} />
            <KpiCell label="Meses Activo" value={row['Meses Activo'] != null ? String(row['Meses Activo']) : '—'} />
            <KpiCell label="Total Facturas" value={row['Total Facturas'] != null ? String(row['Total Facturas']) : '—'} />
          </div>

          {/* Clasificaciones */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-surface rounded-lg px-3 py-2">
              <p className="text-[10px] text-textLow mb-1">Clasificación LTV</p>
              <Badge val={row['Clasificación LTV']} map={LTV_COLOR} />
            </div>
            <div className="bg-surface rounded-lg px-3 py-2">
              <p className="text-[10px] text-textLow mb-1">Semáforo de Actividad</p>
              <Badge val={row['Semáforo Actividad']} map={SEM_COLOR} />
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="space-y-1.5 text-[11px]">
            {[
              { label: 'Segmento', val: row['Segmento Factura'] },
              { label: 'Rango LTV', val: row['Rango LTV'] },
              { label: 'Tamaño empresa', val: row['Tamaño Empresa'] },
              { label: 'Primera factura', val: row['Primera Factura'] },
              { label: 'Última factura', val: row['Última Factura'] },
              { label: 'Días sin factura', val: row['Días sin Factura'] != null ? `${row['Días sin Factura']} días` : null },
              { label: 'Ticket promedio', val: fmt$(row['Ticket Promedio']) },
              { label: 'One Timer', val: row['Es One Timer'] === 'Yes' ? 'Sí' : 'No' },
            ].filter(x => x.val).map(({ label, val }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-textLow">{label}</span>
                <span className="font-medium text-textMid">{val}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
