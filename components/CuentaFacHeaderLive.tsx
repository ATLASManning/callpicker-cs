'use client'
import { useEffect, useState } from 'react'

export default function CuentaFacHeaderLive({ cid, empresa, fallback, initialFactura, initialMrr }: {
  cid: string | null
  empresa: string
  fallback: number | null
  initialFactura?: number | null
  initialMrr?: number | null
}) {
  const hasInitial = initialFactura != null || initialMrr != null
  const [mrr, setMrr] = useState<number | null>(initialMrr ?? null)
  const [factura, setFactura] = useState<number | null>(initialFactura ?? null)
  const [loading, setLoading] = useState(!hasInitial)

  useEffect(() => {
    // Si el servidor ya nos pasó los valores de Zoho, no hacemos fetch adicional
    if (hasInitial) return
    const params = new URLSearchParams({ mode: 'by-cid' })
    if (cid) params.set('cid', cid)
    if (empresa) params.set('nombre', empresa)
    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.mrrGrupo > 0) setMrr(d.mrrGrupo)
        const ticketSum = (d.cuentasMesReciente ?? [])
          .reduce((s: number, r: { 'Ticket Promedio': number | null }) => s + (r['Ticket Promedio'] ?? 0), 0)
        if (ticketSum > 0) setFactura(ticketSum)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cid, empresa, hasInitial])

  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

  return (
    <div className="text-right flex flex-col gap-1">
      <div>
        <p className="text-[10px] text-textLow font-medium">Factura Mensual</p>
        <p className={`text-xl font-bold leading-tight ${loading ? 'text-textLow/50' : 'text-textHi'}`}>
          {loading ? fmt(fallback) : fmt(factura ?? fallback)}
        </p>
      </div>
      {(loading || mrr != null) && (
        <div>
          <p className="text-[10px] text-textLow font-medium">MRR</p>
          <p className={`text-sm font-bold text-cp ${loading ? 'opacity-50' : ''}`}>
            {fmt(mrr)}
          </p>
        </div>
      )}
      {!loading && (mrr != null || factura != null) && (
        <p className="text-[9px] text-cp/70">Zoho · en vivo</p>
      )}
    </div>
  )
}
