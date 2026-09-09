'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'

/**
 * Contador de reuniones de la cuenta.
 *
 * ANTES contaba por coincidencia de palabras en el TÍTULO de la reunión. Eso
 * atribuía reuniones equivocadas: "Neruc", "Grupo NERUC" y "Neruc Sede Central"
 * comparten palabras, igual que cualquier cuenta que empiece con "Grupo". Ahora
 * cuenta por `cuenta_id`, que es el vínculo real, y si la migración todavía no
 * corre simplemente no muestra nada — antes de mostrar un número inventado.
 */
export default function CuentaReunionButton({ cuentaId }: { cuentaId: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelado = false
    fetch(`/api/reuniones?tipo=cliente&cuenta_id=${encodeURIComponent(cuentaId)}`)
      .then(r => (r.ok ? r.json() : { rows: [] }))
      .then(d => {
        if (cancelado) return
        const rows: unknown[] = Array.isArray(d?.rows) ? d.rows : []
        setCount(rows.length)
      })
      .catch(() => { if (!cancelado) setCount(0) })
    return () => { cancelado = true }
  }, [cuentaId])

  if (!count) return null

  return (
    <Link
      href="/reuniones"
      className="cp-btn cp-btn-ghost text-xs"
      style={{ color: '#059669', borderColor: '#059669', background: 'rgba(5,150,105,0.06)' }}
      title={`${count} ${count === 1 ? 'reunión vinculada' : 'reuniones vinculadas'} a esta cuenta`}
    >
      <CalendarCheck size={13} /> {count} {count === 1 ? 'reunión' : 'reuniones'}
    </Link>
  )
}
