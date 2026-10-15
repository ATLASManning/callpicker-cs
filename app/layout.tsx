import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PageTracker from '@/components/PageTracker'
import AvisoPassword from '@/components/AvisoPassword'
import ActualizaApp from '@/components/ActualizaApp'

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
  html, body { background: #F5F8FB !important; color: #202E3B !important; color-scheme: only light !important; }
  main { background: #F5F8FB !important; }
  .cp-card { background: #082742 !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* El fondo va también en el <html>: es lo que se ve durante el primer
     pintado, antes de que el <body> tenga estilos. Se había quedado en el
     #EFF6FF de la paleta anterior cuando se cambiaron `body`, `main` y
     `FORCE_THEME` — es el TERCER sitio del mismo color. Los tres dicen lo
     mismo.

     Y va AQUÍ, antes del `return`, no dentro de él: un comentario JSX puesto
     delante del elemento raíz deja DOS hijos en el return y el JSX no lo
     admite. (Tampoco puede citarse ese comentario literalmente dentro de un
     bloque como éste: su cierre terminaría el bloque a media frase.) */
  return (
    <html lang="es" suppressHydrationWarning style={{ background: '#F5F8FB', colorScheme: 'only light' }}>
      <head>
        <meta name="color-scheme" content="only light" />
        <meta name="theme-color" content="#10355D" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Callpicker CS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <style dangerouslySetInnerHTML={{ __html: FORCE_THEME }} />
      </head>
      <body className="flex h-screen overflow-hidden" style={{ background: '#F5F8FB', color: '#202E3B' }}>
        {/* Va en el layout raíz porque el problema no es de ninguna pantalla:
            es que el Service Worker del PWA sirve el build anterior hasta que
            algo le dice que mire. Sin esto, un deploy no llega a quien tiene
            el tablero abierto —que es todo el equipo— y lo único que lo
            arreglaba era borrar caché a mano. */}
        <ActualizaApp />
        <PageTracker />
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#F5F8FB' }}>
          {/* SIN DIBUJO DE FONDO. Hubo una malla de líneas, luego un
              electrocardiograma y luego la secuencia de barras de Atlas;
              dirección las descartó todas: «déjalo limpio sin dibujo ni
              movimiento de fondo». El fondo es el color y nada más.

              `.cp-sobre-fondo` se queda —es sólo `position:relative` y un
              `z-index:1`— porque hay pantallas que apilan encima contando
              con ese contexto. Quitarlo no ahorra nada y puede mover algo. */}
          <div className="cp-sobre-fondo">
            {/* Va antes del contenido y en todas las pantallas: cuando la
                contrasena vence, el modulo para renovarla queda del otro lado
                del login. El aviso solo sirve mientras todavia se puede entrar. */}
            <AvisoPassword />
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
