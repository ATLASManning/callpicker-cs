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

const FORCE_DARK = `
  :root { color-scheme: dark !important; }
  html, body { background: #0A0F1C !important; color: #ffffff !important; color-scheme: dark !important; }
  main { background: #0A0F1C !important; }
  main > div { background: #0A0F1C !important; }
  .cp-card { background: #0D1829 !important; color: #ffffff !important; }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning style={{ background: '#0A0F1C', colorScheme: 'dark' }}>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#1B3FCC" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Callpicker CS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style dangerouslySetInnerHTML={{ __html: FORCE_DARK }} />
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: '#0A0F1C', color: '#ffffff' }}>
        <PageTracker />
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#0A0F1C' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
