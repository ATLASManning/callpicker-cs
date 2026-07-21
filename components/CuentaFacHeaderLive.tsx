'use client'
import { useEffect, useState } from 'react'

export default function CuentaFacHeaderLive({ cid, empresa, fallback }: {
  cid: string | null
  empresa: string
  fallback: number | null
}) {
  const [mrr, setMrr] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ mode: 'by-cid' })
    if (cid) params.set('cid', cid)
    if (empresa) params.set('nombre', empresa)
    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then(d => { if (d.mrrGrupo > 0) setMrr(d.mrrGrupo) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cid, empresa])

  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

  return (
    <div className="text-right flex flex-col gap-1">
      <div>
        <p className="text-[10px] text-textLow font-medium">Factura Mensual</p>
        <p className={`text-xl font-bold leading-tight ${loading ? 'text-textLow/50' : 'text-textHi'}`}>
          {loading ? fmt(fallback) : fmt(mrr ?? fallback)}
        </p>
      </div>
      {!loading && mrr != null && (
        <div>
          <p className="text-[10px] text-textLow font-medium">MRR</p>
          <p className="text-sm font-bold text-cp">{fmt(mrr)}</p>
        </div>
      )}
      {!loading && mrr != null && (
        <p className="text-[9px] text-cp/70">Zoho · en vivo</p>
      )}
    </div>
  )
}
