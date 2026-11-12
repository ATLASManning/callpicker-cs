/**
 * LA LIGA AL REGISTRO DE COMUNICACIONES — un solo lugar
 * =====================================================
 *
 * Vive aquí y no dentro de `app/comunicacion/page.tsx` por dos razones, y la
 * segunda la descubrió el build:
 *
 *   1. La van a usar varias pantallas —el apartado Comunicación, la ficha de
 *      cuenta, y mañana Alertas—. Una URL repetida en tres archivos es una URL
 *      que un día va a estar mal en dos de ellos.
 *
 *   2. **Next prohíbe exports con nombre en un archivo de página.** Exportar
 *      `ligaConector` desde `page.tsx` compila limpio con `tsc --noEmit` y
 *      TRUENA en `next build`:
 *
 *        Type error: Type 'OmitWithTag<typeof import(".../page"), ...>'
 *        does not satisfy the constraint '{ [x: string]: never; }'
 *
 *      Otro recordatorio de que un verificador verde no es un despliegue
 *      verde: `tsc` mira los tipos, no las reglas del App Router.
 *      [[feedback-verificar-antes-asegurar]]
 *
 * ── CÓMO SE SUPO QUE `?q=` ES EL PARÁMETRO ────────────────────────────────
 *
 * No se supuso: se leyó del propio formulario del conector, que es un GET con
 * un campo `q` cuyo marcador de posición dice «Correo, teléfono, CID o ID de
 * Zoho». Probado el 11 nov 2026 con dos cuentas reales —CID 190271
 * Plastitabla, 35 registros; CID 26654 ABRL, 14— y con un CID inexistente,
 * que devuelve «No encontré nada» SIN el rótulo de comunicaciones, así que
 * las compuertas de `lib/comunicaciones-conector.ts` lo rechazan solas.
 */

/** Raíz del conector `com-contexto` que corre en n8n. */
export const CONECTOR_COMUNICACIONES =
  'https://n8n-gtc.connectors.callpicker.com/webhook/com-contexto'

/**
 * Arma la liga de consulta.
 *
 * `q` acepta correo, teléfono de 10 dígitos, CID o ID de Zoho. Para una cuenta
 * de cartera **siempre se usa el CID**: las 224 lo tienen, y cruzar por nombre
 * mezcla cuentas. Ver [[dids-fuente]].
 */
export const ligaConector = (q: string) =>
  `${CONECTOR_COMUNICACIONES}?q=${encodeURIComponent(q.trim())}`

/**
 * Liga directa a una vista concreta, cuando ya se tiene el id de Zoho.
 * `q` no hace falta aquí porque no hay nada que buscar.
 */
export const ligaConectorVista = (vista: 'persona' | 'empresa' | 'oportunidad', idZoho: string) =>
  `${CONECTOR_COMUNICACIONES}?v=${vista}&id=${encodeURIComponent(idZoho)}`
