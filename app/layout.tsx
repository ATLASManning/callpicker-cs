import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Callpicker CS — Customer Success',
  description: 'Panel de seguimiento y retención de cuentas estratégicas Callpicker',
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
        <style dangerouslySetInnerHTML={{ __html: FORCE_LIGHT }} />
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: '#EFF6FF', color: '#0F172A' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#EFF6FF' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
