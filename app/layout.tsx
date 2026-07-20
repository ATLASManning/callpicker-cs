import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PageTracker from '@/components/PageTracker'

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

const FORCE_LIGHT = `
  :root { color-scheme: only light !important; }
  html, body { background: #EFF6FF !important; color: #0F172A !important; color-scheme: only light !important; }
  main { background: #EFF6FF !important; }
  .cp-card { background: #ffffff !important; color: #0F172A !important; }
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
        <style dangerouslySetInnerHTML={{ __html: FORCE_LIGHT }} />
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
