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

  const value = mrr ?? fallback
  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

  return (
    <div className="text-right">
      <p className="text-xs text-textLow">Facturación</p>
      <p className={`text-xl font-bold ${loading ? 'text-textLow/50' : 'text-textHi'}`}>
        {loading ? fmt(fallback) : fmt(value)}
      </p>
      {!loading && mrr != null && mrr !== fallback && (
        <p className="text-[9px] text-cp/70 mt-0.5">MRR grupo · Zoho</p>
      )}
    </div>
  )
}
