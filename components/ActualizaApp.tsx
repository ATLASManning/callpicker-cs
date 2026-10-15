'use client'

import { useEffect } from 'react'

/**
 * QUE UN DEPLOY LLEGUE A LA PANTALLA SIN QUE NADIE BORRE CACHÉ.
 *
 * ── EL FALLO, MEDIDO EN PRODUCCIÓN EL 14 OCT 2026 ─────────────────────────
 * Dirección miró Tickets después de desplegar la paleta nueva y vio la
 * anterior. El código estaba bien y el CSS de producción ya traía la capa: lo
 * que servía los archivos viejos era el Service Worker del PWA. Comprobado
 * desde el navegador: el precache tenía el `BUILD_ID` de un build anterior
 * mientras producción servía otro.
 *
 * `next.config.js` ya trae `skipWaiting` y `clientsClaim`, y están bien — pero
 * resuelven la segunda mitad del problema, no la primera:
 *
 *   1. El navegador sólo busca un Service Worker nuevo en una NAVEGACIÓN REAL
 *      (o cada 24 h). En este tablero, que es una SPA y se usa como PWA
 *      instalada durante todo el día, moverse entre pantallas es enrutado del
 *      lado del cliente: no hay navegación real, así que nadie comprueba nunca.
 *   2. Y cuando por fin se instala, `clientsClaim` le da el control, pero la
 *      pestaña YA cargada sigue con el HTML y los chunks que tenía. Quien está
 *      mirando no se entera.
 *
 * Esto es lo que faltaba, y es la sospecha que quedó sin confirmar en el
 * incidente del Atlas oscuro del 24 sep. [[incidente-atlas-oscuro]]
 *
 * ── LO QUE HACE, Y LO QUE NO ──────────────────────────────────────────────
 * Pregunta por una versión nueva al cargar, al volver a la pestaña y cada
 * quince minutos. Cuando el Service Worker nuevo toma el control, recarga UNA
 * vez.
 *
 * NO recarga sola cada vez que puede, y la guarda importa: `controllerchange`
 * también se dispara la PRIMERA vez que un Service Worker toma una página que
 * no tenía ninguno, y recargar ahí metería a todo el mundo en un bucle. Por eso
 * sólo se recarga si YA había un controlador antes.
 *
 * Y no toca nada si el navegador no soporta Service Workers o si no hay
 * ninguno registrado: en `next dev` el PWA va desactivado y esto no hace nada.
 */
export default function ActualizaApp() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    let muerto = false

    /* Si al montar ya hay un controlador, cualquier cambio posterior es un
       deploy nuevo tomando el mando. Si NO lo hay, el primer `controllerchange`
       es la instalación inicial y recargar sería gratuito. */
    const habiaControlador = !!navigator.serviceWorker.controller
    let recargando = false

    const alCambiarElControlador = () => {
      if (recargando || !habiaControlador) return
      recargando = true
      /* `location.reload()` y no un `replace`: hay que volver a pedir el
         documento, no navegar. El Cache-Control del proyecto es `no-store`,
         así que el HTML llega fresco y con él los chunks del build nuevo. */
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', alCambiarElControlador)

    const comprueba = async () => {
      if (muerto || document.visibilityState === 'hidden') return
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        /* `update()` pide el script al servidor saltándose la caché HTTP. Si no
           cambió, no pasa nada; si cambió, se instala y —con `skipWaiting`—
           toma el control, lo que dispara el oyente de arriba. */
        await reg?.update()
      } catch {
        /* Que falle la comprobación NO puede tumbar la pantalla: sin red, o con
           el Service Worker en un estado raro, el tablero tiene que seguir
           funcionando con lo que ya tiene cargado. Un rediseño que tumbó el
           tablero entero con una excepción en el cliente ya costó un día. */
      }
    }

    comprueba()
    /* Al volver a la pestaña es el momento que importa: es cuando alguien
       vuelve a mirar después de que dirección avisó de un cambio. */
    const alVolver = () => { if (document.visibilityState === 'visible') comprueba() }
    document.addEventListener('visibilitychange', alVolver)
    /* Y un reloj de fondo para la pestaña que se queda abierta todo el día.
       Quince minutos: la comprobación es una petición condicional a un archivo
       de 10 KB, y más a menudo no haría llegar antes ningún deploy. */
    const reloj = window.setInterval(comprueba, 15 * 60 * 1000)

    return () => {
      muerto = true
      navigator.serviceWorker.removeEventListener('controllerchange', alCambiarElControlador)
      document.removeEventListener('visibilitychange', alVolver)
      window.clearInterval(reloj)
    }
  }, [])

  return null
}
