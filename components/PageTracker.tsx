'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const SECTION_MAP: Array<[string, string]> = [
  ['/cuentas/dormidas',  'Cuentas Dormidas'],
  ['/cuentas/',          'Detalle Cuenta'],
  ['/cuentas',           'Cuentas Activas'],
  ['/asesores',          'Panel Asesores'],
  ['/seguimiento',       'Seguimiento'],
  ['/activaciones',      'Activaciones 2.0'],
  ['/base-cs',           'Base de Conocimiento'],
  ['/chat',              'Atlas IA'],
  ['/auditoria',         'Auditoría Cuentas'],
  ['/churn',             'Churn'],
  ['/facturacion',       'Facturación'],
  ['/customer-tenure',   'Customer Tenure'],
  ['/reuniones',         'Reuniones'],
  ['/tickets',           'Tickets'],
  ['/upsell',            'Upsell / Cross'],
  ['/admin/uso',         'Uso Dashboard'],
  ['/admin/usuarios',    'Usuarios Admin'],
  ['/settings',          'Configuración'],
]

function getSeccion(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  for (const [prefix, label] of SECTION_MAP) {
    if (pathname.startsWith(prefix)) return label
  }
  return pathname
}

export default function PageTracker() {
  const pathname  = usePathname()
  const pendingId = useRef<string | null>(null)
  const pageStart = useRef(0)

  useEffect(() => {
    pageStart.current  = Date.now()
    pendingId.current  = null

    fetch('/api/analytics/pageview', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ruta: pathname, seccion: getSeccion(pathname) }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) pendingId.current = d.id })
      .catch(() => {})

    function sendExit() {
      const id = pendingId.current
      if (!id) return
      pendingId.current = null
      const duracion_seg = Math.round((Date.now() - pageStart.current) / 1000)

      // sendBeacon es más fiable en beforeunload; keepalive para el resto
      const blob = new Blob(
        [JSON.stringify({ id, duracion_seg })],
        { type: 'application/json' }
      )
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/pageview', blob)
      } else {
        fetch('/api/analytics/pageview', {
          method:    'PATCH',
          headers:   { 'Content-Type': 'application/json' },
          body:      JSON.stringify({ id, duracion_seg }),
          keepalive: true,
        }).catch(() => {})
      }
    }

    window.addEventListener('beforeunload', sendExit)
    return () => {
      window.removeEventListener('beforeunload', sendExit)
      sendExit()
    }
  }, [pathname])

  return null
}
