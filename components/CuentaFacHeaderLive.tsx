'use client'
/**
 * Las dos cifras de la esquina de la ficha de cuenta.
 *
 * Dirección (17 sep 2026): se alimentan del nuevo reporte GRC —
 *   «Factura Mensual» ← MRR Inicio Contrato (BCY)
 *   «MRR»             ← Importe Acumulado Recurrente
 *
 * Antes las dos mostraban EL MISMO número (`mrrGrupo` de /api/facturacion), que
 * es por lo que en la ficha se leía dos veces $23,707.
 *
 * ── DOS DECISIONES QUE SOSTIENEN ESTO ──────────────────────────────────────
 * 1. Nada se agrupa por parecido de nombre. Catorce filas del export se llaman
 *    casi igual que una cuenta y llegan sin CID; dirección confirmó una por una
 *    cuáles son la misma empresa (trece sí, «Justo Etiquetas» no). Lo que se
 *    sumó se NOMBRA debajo: una ficha que pasa de $3,505 a $23,523 tiene que
 *    poder explicar el salto sin que nadie abra el Excel.
 * 2. Si la cuenta no está en el corte, NO se pinta cero. Se conserva el dato de
 *    Zoho que había y se dice de dónde viene cada cifra, porque un cero aquí se
 *    lee como «no factura» y significaría «no vino en el export».
 */
import { useEffect, useState } from 'react'

type Grc = {
  encontrado: boolean
  mes: string | null
  facturaMensual: number
  acumuladoRecurrente: number
  movimiento: string | null
  verificacion: 'baja' | 'sigue_viva' | 'sin_verificar' | 'na' | null
  hermanas: { cliente: string; mrrIni: number; acumulado: number; movimiento: string | null }[]
  incluye: { cliente: string; mrrIni: number; acumulado: number }[]
}

export default function CuentaFacHeaderLive({ cid, empresa, fallback }: {
  cid: string | null
  empresa: string
  fallback: number | null
}) {
  const [grc, setGrc] = useState<Grc | null>(null)
  const [zoho, setZoho] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let vivo = true
    const p = new URLSearchParams({ mode: 'cuenta' })
    if (cid) p.set('cid', cid)
    if (empresa) p.set('nombre', empresa)

    const pz = new URLSearchParams({ mode: 'by-cid' })
    if (cid) pz.set('cid', cid)
    if (empresa) pz.set('nombre', empresa)

    Promise.allSettled([
      fetch(`/api/grc?${p}`).then(r => r.json()),
      fetch(`/api/facturacion?${pz}`).then(r => r.json()),
    ]).then(([g, z]) => {
      if (!vivo) return
      if (g.status === 'fulfilled' && g.value && !g.value.error) setGrc(g.value as Grc)
      if (z.status === 'fulfilled' && z.value?.mrrGrupo > 0) setZoho(z.value.mrrGrupo)
    }).finally(() => { if (vivo) setLoading(false) })

    return () => { vivo = false }
  }, [cid, empresa])

  const fmt = (n: number | null) =>
    n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

  const enCorte = !!grc?.encontrado
  const factura = enCorte ? grc!.facturaMensual : (zoho ?? fallback)
  const acumulado = enCorte ? grc!.acumuladoRecurrente : null
  const hermanas = grc?.hermanas ?? []
  const extra = hermanas.reduce((s, h) => s + h.mrrIni, 0)
  const incluye = grc?.incluye ?? []

  return (
    <div className="text-right flex flex-col gap-1">
      <div>
        <p className="text-[10px] text-textLow font-medium">Factura Mensual</p>
        <p className={`text-xl font-bold leading-tight ${loading ? 'text-textLow/50' : 'text-textHi'}`}>
          {loading ? fmt(fallback) : fmt(factura)}
        </p>
      </div>

      {!loading && enCorte && (
        <div>
          <p className="text-[10px] text-textLow font-medium">MRR</p>
          <p className="text-sm font-bold text-cp">{fmt(acumulado)}</p>
        </div>
      )}

      {/* Sin dato en el corte: se dice, no se pinta cero. */}
      {!loading && !enCorte && (
        <div>
          <p className="text-[10px] text-textLow font-medium">MRR</p>
          <p className="text-[11px] italic text-textLow">sin dato en el corte</p>
        </div>
      )}

      {!loading && (
        <p className="text-[9px] text-cp/70">
          {enCorte
            ? `GRC · ${grc!.mes ?? 'corte del mes'}`
            : zoho != null ? 'Zoho · en vivo' : 'ficha'}
        </p>
      )}

      {/* Lo que SÍ se sumó viniendo de otra fila del export, nombrado. */}
      {!loading && incluye.length > 0 && (
        <div className="text-[9px] text-textLow leading-snug max-w-[210px] ml-auto mt-0.5">
          <p className="font-semibold">Incluye</p>
          {incluye.map((h, i) => (
            <p key={i}>«{h.cliente}» {fmt(h.mrrIni)}</p>
          ))}
        </div>
      )}

      {/* Lo que NO se sumó: nombre parecido pero es otra empresa. */}
      {!loading && hermanas.length > 0 && (
        <div className="text-[9px] text-textLow leading-snug max-w-[210px] ml-auto mt-0.5">
          <p className="font-semibold">No sumado · {fmt(extra)}</p>
          {hermanas.map((h, i) => (
            <p key={i}>«{h.cliente}» {fmt(h.mrrIni)}</p>
          ))}
          <p className="italic">Otra empresa, no esta cuenta.</p>
        </div>
      )}
    </div>
  )
}
