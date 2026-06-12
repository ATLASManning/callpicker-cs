import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Callpicker Customer Success',
  description: 'Panel de seguimiento y retención de cuentas estratégicas Callpicker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Callpicker CS',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

const FORCE_DARK = `
  :root { color-scheme: only dark !important; }
  html, body { background: #0d1829 !important; color: #e2ecf8 !important; color-scheme: only dark !important; }
  main { background: #0d1829 !important; }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning style={{ background: '#0d1829', colorScheme: 'only dark' }}>
      <head>
        <meta name="color-scheme" content="only dark" />
        <meta name="theme-color" content="#0d1829" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Callpicker CS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style dangerouslySetInnerHTML={{ __html: FORCE_DARK }} />
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: '#0d1829', color: '#e2ecf8' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#0d1829' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
