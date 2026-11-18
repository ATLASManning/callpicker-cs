/* ── LOS CAMPOS SIN LOS QUE UNA AUDITORIA ES OPINION ──────────────────────
 *
 * La lista no es un gusto: es lo que hizo falta de verdad al escribir las
 * primeras auditorías del TOP 50. Sin `giro` no se puede decir si 2,000
 * llamadas al mes son muchas o pocas —una concesionaria y un laboratorio no se
 * parecen—; sin `servicio` no se sabe contra qué plan comparar el consumo; sin
 * `activo_desde` no se distingue un deterioro nuevo de uno de siempre.
 *
 * `critico` separa los que impiden escribir del que sólo empobrece. `tamano_
 * empresa` y las `notas` se piden en la misma visita porque ya se está ahí,
 * pero su ausencia no dispara nada por sí sola: una alerta que salta por un
 * campo opcional es una alerta que se aprende a cerrar sin leer.
 *
 * Cada campo lleva QUIEN lo requisita, porque dirección lo pidió así y porque
 * un pendiente sin dueño no es un pendiente. [[feedback-tablas-deben-cerrar]]
 *
 * ── POR QUÉ VIVE EN SU PROPIO ARCHIVO (18 nov 2026) ──────────────────────
 *
 * Estaba dentro de `lib/alertas-detectar.ts`. El expediente de entrega lo
 * necesita para decidir si una activación es «Cuenta» o «Cliente», y al
 * importarlo de allí arrastraba el motor entero —y con él `lib/supabase`, que
 * crea su cliente al importarse—: cualquier guion que sólo quisiera clasificar
 * reventaba con «Node.js 20 detected without native WebSocket support».
 *
 * Se movió TAL CUAL, sin tocar un campo, un `critico` ni un dueño. La lista es
 * la misma, en otro sitio: `alertas-detectar.ts` la importa de aquí y la sigue
 * usando igual. [[feedback-verificar-antes-asegurar]]
 */

/** Lo mínimo que hay que saber de una cuenta para evaluar sus requisitos. */
export interface FichaConRequisitos {
  giro?:           string | null
  servicio?:       string | null
  activo_desde?:   string | null
  tamano_empresa?: string | null
  notas?:          string | null
}

export interface RequisitoFicha {
  campo:    string
  etiqueta: string
  critico:  boolean
  dueno:    string
  hay:      (c: FichaConRequisitos) => boolean
}

export const REQUISITOS_FICHA: ReadonlyArray<RequisitoFicha> = [
  { campo: 'giro', etiqueta: 'giro o sector', critico: true, dueno: 'el asesor',
    hay: c => !!(c.giro ?? '').trim() },
  { campo: 'servicio', etiqueta: 'servicio contratado', critico: true, dueno: 'el asesor',
    hay: c => !!(c.servicio ?? '').trim() },
  { campo: 'activo_desde', etiqueta: 'fecha de alta (antigüedad)', critico: true,
    dueno: 'facturación',
    hay: c => !!(c.activo_desde ?? '').trim() },
  { campo: 'tamano_empresa', etiqueta: 'tamaño de empresa', critico: false, dueno: 'el asesor',
    hay: c => !!(c.tamano_empresa ?? '').trim() },
  { campo: 'notas', etiqueta: 'notas de contexto', critico: false, dueno: 'el asesor',
    hay: c => !!(c.notas ?? '').trim() },
]
