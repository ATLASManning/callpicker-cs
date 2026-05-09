import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Callpicker CS — Customer Success',
  description: 'Panel de seguimiento y retención de cuentas estratégicas Callpicker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ background: '#EFF6FF' }}>
      <body className="flex h-screen overflow-hidden" style={{ background: '#EFF6FF', color: '#0F172A' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#EFF6FF' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
