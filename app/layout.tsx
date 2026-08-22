import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PageTracker from '@/components/PageTracker'

// Sin esto, páginas sin fetch de datos en el servidor (como /tickets o
// /acceso) se pre-generan como HTML estático en el build, y Vercel las
// sirve desde su Edge Cache ignorando el Cache-Control: no-store que ya
// mandamos abajo — ese header solo aplica a respuestas dinámicas, nunca
// llega a aplicarse a un HIT de caché estática. Confirmado en producción:
// /acceso se sirvió con Age: 91254s (~25h) pese a múltiples deploys nuevos.
// force-dynamic aquí, en el layout raíz, aplica a todas las páginas.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Callpicker Customer Success',
  description: 'Panel de seguimiento y retención de cuentas estratégicas Callpicker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Callpicker CS',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

const FORCE_THEME = `
  :root { color-scheme: only light !important; }
  html, body { background: #EFF6FF !important; color: #0F172A !important; color-scheme: only light !important; }
  main { background: #EFF6FF !important; }
  .cp-card { background: #0D1829 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning style={{ background: '#EFF6FF', colorScheme: 'only light' }}>
      <head>
        <meta name="color-scheme" content="only light" />
        <meta name="theme-color" content="#1B3FCC" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Callpicker CS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style dangerouslySetInnerHTML={{ __html: FORCE_THEME }} />
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: '#EFF6FF', color: '#0F172A' }}>
        <PageTracker />
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#EFF6FF' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
