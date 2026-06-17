'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'

function normMatch(empresa: string, texto: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ' ').trim()
  const words = norm(empresa).split(/\s+/).filter(w => w.length >= 3)
  const haystack = norm(texto)
  return words.length > 0 && words.some(w => haystack.includes(w))
}

export default function CuentaReunionButton({ empresa }: { empresa: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    // Primero intentamos búsqueda exacta por columna empresa (requiere migración)
    fetch(`/api/reuniones?tipo=cliente&empresa=${encodeURIComponent(empresa)}`)
      .then(r => r.json())
      .then(d => {
        const rows: { tipo: string; empresa?: string | null; titulo: string }[] = d.rows ?? []
        if (rows.length > 0) {
          setCount(rows.length)
          return
        }
        // Fallback: buscar en título (para reuniones sin columna empresa poblada)
        return fetch('/api/reuniones?tipo=cliente')
          .then(r2 => r2.json())
          .then(d2 => {
            const all: { titulo: string }[] = d2.rows ?? []
            setCount(all.filter(r => normMatch(empresa, r.titulo)).length)
          })
      })
      .catch(() => setCount(0))
  }, [empresa])

  if (!count) return null

  return (
    <Link
      href="/reuniones"
      className="cp-btn cp-btn-ghost text-xs"
      style={{ color: '#059669', borderColor: '#059669', background: 'rgba(5,150,105,0.06)' }}
    >
      <CalendarCheck size={13} />
      Reunión
      {count > 1 && (
        <span
          className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: '#059669', color: '#fff' }}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
