/**
 * lib/senal-escrita.ts — LO QUE EL EQUIPO YA ESCRIBIÓ Y NADIE LEYÓ
 *
 * Daniel Martínez, cofundador: «apoyarse en IA para lo cualitativo». El caso
 * que lo prueba es Biolaboratorio Sadat: el 25 de julio la propia asesora
 * escribió en un seguimiento «La cuenta presenta indicadores de riesgo… alto
 * riesgo de descontinuación». El sistema tenía ese texto y no hizo nada con él.
 * El 6 de octubre el cliente pidió la baja del servicio de voz.
 *
 * Medido sobre las 192 cuentas vivas: doce tienen baja o riesgo DECLARADO por
 * escrito, $187,793 de MRR, y NUEVE de esas doce no figuran hoy como «en
 * riesgo». La peor es ALTERNET —$16,548—: hace once días alguien escribió «hoy
 * me escribe solicitando la baja de la cuenta», y lo que el tablero le dice al
 * ejecutivo es que responda el Radar.
 *
 * ── POR QUÉ ESTO NO LO DECIDE UN MODELO ──────────────────────────────────
 *
 * Porque la regla de la casa es que la detección es determinista: cuando el
 * ejecutivo pregunte «¿por qué saltó esto?», la respuesta tiene que ser una
 * frase que alguien de su equipo escribió, con su fecha, no la opinión de una
 * máquina. Aquí la evidencia es literalmente una cita.
 *
 * La IA va ENCIMA: para resumir, para relacionar varias señales y para
 * redactar la recomendación. Nunca para decidir si salta.
 *
 * ── LAS TRES GUARDAS, Y LAS TRES SALIERON DE LOS DATOS ───────────────────
 *
 * 1. NEGACIONES. «reduciendo el riesgo de cancelación» es el asesor diciendo
 *    que su plan BAJA el riesgo, no que la cuenta se vaya. Medido: 3 de 10
 *    coincidencias, el 30%. Sin esta guarda la señal nace con un tercio de
 *    falsos positivos — y una alerta en la que no se confía se cierra y
 *    arrastra a las demás.
 *
 * 2. «BAJA» COMO ADJETIVO. «riesgo de baja adopción» no es riesgo de baja: ahí
 *    «baja» califica a «adopción». Lo delató Jump In.
 *
 * 3. PLANTILLA. Una frase que aparece IDÉNTICA en varias cuentas no es una
 *    observación sobre este cliente, es texto generado. «Esa situación colocó
 *    la cuenta en riesgo total de pérdida» está en tres cuentas distintas
 *    —Sección Amarilla, CASA Galván y PRAXIS GLOBE— palabra por palabra.
 */

export type TipoSenal = 'baja_declarada' | 'riesgo_escrito' | 'reduccion_declarada'

export interface Senal {
  tipo: TipoSenal
  /** La frase literal, recortada. Es LA evidencia: se cita, no se parafrasea. */
  frase: string
  /** Cuándo se escribió. `null` en las fuentes que no la guardan. */
  fecha: string | null
  origen: 'seguimiento' | 'observaciones_kam' | 'notas'
  autor: string | null
  /** Letras que cubrió el patrón. Sólo desempata dos señales de la misma nota;
   *  nunca se muestra. Opcional para no romper a quien construya una a mano. */
  largo?: number
}

export interface TextoCuenta {
  cuentaId: string
  fecha: string | null
  origen: Senal['origen']
  autor: string | null
  texto: string
}

/* ── El vocabulario ───────────────────────────────────────────────────────
 *
 * Separado por fuerza de la afirmación, no por tema. «Solicitó la baja de la
 * cuenta» y «solicitó la baja de algunos DIDs» no son lo mismo: el segundo
 * duele —Neruc perdió 55 de 81 DIDs, un 68% de su pool— pero no es la baja.
 */
/* ── `\w` NO SIRVE AQUÍ, Y ES LA TRAMPA QUE MÁS CARO SALIÓ ────────────────
 *
 * En JavaScript `\w` es `[A-Za-z0-9_]`: NO incluye letras acentuadas. Así que
 * `solicit\w*\s+` no encuentra «solicitó la baja» — `\w*` se queda en vacío,
 * el patrón pide un espacio y lo siguiente es la «ó».
 *
 * En Python `\w` sí es Unicode por defecto, y por eso mi réplica contaba 16
 * coincidencias donde producción contaba 12. Las cuatro que faltaban llevaban
 * todas «solicitó» — incluidas Salud y Hogar y Servinox, que desaparecían
 * enteras. Lo encontró el rastro coincidencia por coincidencia, no la lectura
 * del código: las expresiones eran idénticas en los dos lados.
 *
 * `LETRA` se usa en lugar de `\w` en todo el vocabulario. En español el verbo
 * acentuado es la forma NORMAL del pretérito —«solicitó», «confirmó»,
 * «informó»—, o sea justo la que importa.
 */
const LETRA = '[A-Za-z0-9_ÁÉÍÓÚÜÑáéíóúüñ]'

const RX_BAJA = new RegExp([
  // La baja de la CUENTA o del SERVICIO, no de una parte.
  'solicit' + LETRA + '*\\s+(?:la|su)\\s+(?:baja|cancelaci[oó]n)\\s+(?:de\\s+(?:la\\s+)?(?:cuenta|servicio|l[ií]nea)|del\\s+servicio)',
  'solicitando\\s+la\\s+baja\\s+de\\s+la\\s+cuenta',
  'pid(?:e|i[oó])\\s+la\\s+baja\\s+de\\s+la\\s+cuenta',
  '(?:quiere|desea|va\\s+a)\\s+cancelar\\s+(?:el\\s+servicio|la\\s+cuenta)',
  'confirm' + LETRA + '+\\s+(?:la\\s+)?cancelaci[oó]n\\s+(?:de\\s+)?(?:la\\s+cuenta|del\\s+servicio)',
  'informa' + LETRA + '*\\s+(?:que\\s+)?se\\s+dan?\\s+de\\s+baja',
  'en\\s+riesgo\\s+de\\s+cancelaci[oó]n',
].join('|'), 'i')

const RX_RIESGO = new RegExp([
  'alto\\s+riesgo\\s+de\\s+(?:cancelaci[oó]n|descontinuaci[oó]n|p[eé]rdida|churn)',
  'riesgo\\s+de\\s+(?:cancelaci[oó]n|descontinuaci[oó]n|churn)',
  'riesgo\\s+de\\s+p[eé]rdida\\s+de\\s+la\\s+cuenta',
  'indicadores\\s+de\\s+riesgo',
  'cuenta\\s+en\\s+riesgo',
  'riesgo\\s+de\\s+perder\\s+(?:la\\s+)?(?:cuenta|cliente)',
  'cotiz' + LETRA + '+\\s+con\\s+otr',
  /* «cambio de proveedor» y «otro proveedor» ESTABAN aquí y se fueron: su
     única coincidencia en toda la cartera fue REJAMEX, y era «una baja de
     Callpicker Chat por cambio de proveedor» —de mayo, de un módulo, y la
     misma frase termina con «la cuenta se encuentra estable»—. Un patrón cuyo
     100% de aciertos son falsos positivos no se afina: se quita. */
].join('|'), 'i')

const RX_REDUCCION = new RegExp([
  'solicit' + LETRA + '*\\s+(?:la\\s+)?baja\\s+de\\s+'
    + '(?:algun' + LETRA + '*|\\d+|' + LETRA + '+\\s+)?(?:dids?|extensiones|l[ií]neas)',
  'baja\\s+de\\s+\\d+\\s*/\\s*\\d+\\s+dids?',
  '(?:bajar|reducir)\\s+(?:de\\s+)?plan',
  'reducir\\s+extensiones',
].join('|'), 'i')

/* Verbos que INVIERTEN el sentido cuando van justo antes. La ventana es corta
   —cuatro palabras— a propósito: «reduciendo el riesgo» invierte, pero un
   «reducir» tres renglones más arriba no tiene por qué. */
const RX_NEGACION =
  /(reduc\w+|mitig\w+|disminu\w+|evitar?|evite\w*|prevenir?|previn\w+|minimiz\w+|sin|no\s+hay|ning[uú]n\w*|descart\w+)\s+(?:\w+\s+){0,3}$/i

/* «riesgo de baja ADOPCIÓN» no es riesgo de baja: ahí «baja» es adjetivo. */
const RX_BAJA_ADJETIVO = /^\s*(adopci[oó]n|utilizaci[oó]n|uso|actividad|interacci[oó]n)/i

/* Y la negación también va DETRÁS. REJAMEX lo enseñó: «…una baja de Callpicker
   Chat por cambio de proveedor, la cuenta se encuentra estable». La frase se
   desmiente a sí misma catorce palabras después, y mirar sólo hacia atrás no
   lo ve. Se busca en lo que queda de la oración. */
/* OJO con la frontera de CIERRE. Sin ella, `\b(estable|…)` coincide con
   «establecer» — y la frase estrella de Biolaboratorio Sadat, «alto riesgo de
   descontinuación del servicio, por lo que se recomienda ESTABLECER contacto
   con el cliente», se descartaba sola. Era justo el caso que motivó todo esto.
   Las formas verbales abiertas —resolvió/resolvieron, quedó resuelto/resuelta—
   se dejan como prefijo a propósito, con `\w*` para cerrarlas. */
const RX_DESMENTIDO =
  /\b(estable\b|sin\s+riesgo\b|sin\s+novedad\b|todo\s+en\s+orden\b|se\s+encuentra\s+bien\b|ya\s+se\s+resolvi\w*|qued[oó]\s+resuelt\w*|se\s+retract\w*|desisti[oó]\b)/i

/** Una frase legible alrededor de la coincidencia. */
function fragmento(texto: string, ini: number, fin: number): string {
  const desde = Math.max(0, ini - 70)
  const hasta = Math.min(texto.length, fin + 90)
  const trozo = texto.slice(desde, hasta).split(/\s+/).join(' ').trim()
  return (desde > 0 ? '…' : '') + trozo + (hasta < texto.length ? '…' : '')
}

function esNegada(texto: string, ini: number): boolean {
  return RX_NEGACION.test(texto.slice(Math.max(0, ini - 70), ini))
}

function esBajaAdjetivo(texto: string, m: RegExpExecArray): boolean {
  if (!/riesgo\s+de\s+baja\s*$/i.test(m[0])) {
    // El patrón puede terminar antes; se mira lo que sigue a la coincidencia.
    if (!/\bbaja\b\s*$/i.test(m[0])) return false
  }
  return RX_BAJA_ADJETIVO.test(texto.slice(m.index + m[0].length))
}

/**
 * Las señales escritas, una por cuenta: la más fuerte y, dentro de esa, la más
 * reciente. `plantillas` son las frases que aparecen en más de una cuenta y que
 * por tanto no dicen nada sobre ninguna.
 */
export interface DiagEscrita {
  textos: number
  coincidencias: number
  /** Cuántas tiró cada guarda. Si una se lleva casi todo, está mal calibrada. */
  descartes: Record<'negacion' | 'baja_adjetivo' | 'plantilla' | 'desmentido', number>
  senales: number
  /** Qué cartera se midió: el nombre del asesor, o `cartera-completa`.
   *
   *  No es adorno. `ultimoDiag` vive en el módulo, y una lambda de Vercel
   *  atiende varias peticiones a la vez: la corrida de un asesor —que ve 20
   *  cuentas— sobreescribe la del universo completo entre el `detectar` y el
   *  `return` de otra petición. Sin este campo la API publicaría 20 textos como
   *  si fueran los 704 y yo leería «la capa casi no encuentra nada». Es el mismo
   *  error que me costó dos días: un diagnóstico que miente es peor que ninguno. */
  ambito: string | null
  /** Cada coincidencia con lo que le pasó. Inferir cuál falta a partir de
   *  totales ya me costó media mañana: aquí se ven una por una.
   *
   *  `cuenta` son los 8 primeros caracteres del id, NO el nombre. A propósito:
   *  esto se publica en una ruta que también contestan los asesores, y el
   *  fragmento es prosa del cliente. Para resolver el id al nombre hace falta
   *  acceso a `cuentas`, que ya está acotado por cartera. */
  detalle: Array<{ cuenta: string; tipo: string; frag: string; fin: string }>
}

/** Lo que vio la última corrida. Se publica en /api/alertas: una capa que no
 *  encuentra nada y una que no se está ejecutando se ven igual desde fuera. */
export let ultimoDiag: DiagEscrita = {
  textos: 0, coincidencias: 0, senales: 0, detalle: [], ambito: null,
  descartes: { negacion: 0, baja_adjetivo: 0, plantilla: 0, desmentido: 0 },
}

export function senalesEscritas(
  textos: TextoCuenta[], ambito: string | null = null,
): Map<string, Senal> {
  const diag: DiagEscrita = {
    textos: textos.length, coincidencias: 0, senales: 0, detalle: [], ambito,
    descartes: { negacion: 0, baja_adjetivo: 0, plantilla: 0, desmentido: 0 },
  }
  /* Primero, qué frases son plantilla. Se normaliza y se cuenta en cuántas
     cuentas distintas aparece cada oración de cierta longitud. */
  const cuentasPorFrase = new Map<string, Set<string>>()
  const oraciones = (t: string) => t.split(/(?<=[.!?])\s+/)
    .map(s => s.split(/\s+/).join(' ').trim())
    .filter(s => s.length >= 40)
  for (const t of textos) {
    for (const o of oraciones(t.texto)) {
      const k = o.toLowerCase()
      const s = cuentasPorFrase.get(k) ?? new Set<string>()
      s.add(t.cuentaId)
      cuentasPorFrase.set(k, s)
    }
  }
  const esPlantilla = (frase: string) =>
    (cuentasPorFrase.get(frase.toLowerCase())?.size ?? 0) > 1

  const PESO: Record<TipoSenal, number> = {
    baja_declarada: 3, riesgo_escrito: 2, reduccion_declarada: 1,
  }
  const fuera = new Map<string, Senal>()

  const probar = (t: TextoCuenta, rx: RegExp, tipo: TipoSenal) => {
    const g = new RegExp(rx.source, 'gi')
    let m: RegExpExecArray | null
    while ((m = g.exec(t.texto)) !== null) {
      diag.coincidencias++
      const anota = (fin: string) => diag.detalle.push({
        cuenta: t.cuentaId.slice(0, 8), tipo, frag: m![0].slice(0, 44), fin })
      if (esNegada(t.texto, m.index)) {
        diag.descartes.negacion++; anota('negacion'); continue
      }
      if (esBajaAdjetivo(t.texto, m)) {
        diag.descartes.baja_adjetivo++; anota('baja_adjetivo'); continue
      }
      /* La oración que contiene la coincidencia; si es plantilla, no cuenta. */
      const oracion = oraciones(t.texto).find(o => o.toLowerCase().includes(
        m![0].split(/\s+/).join(' ').toLowerCase()))
      if (oracion && esPlantilla(oracion)) {
        diag.descartes.plantilla++; anota('plantilla'); continue
      }
      /* ¿La propia frase se desmiente después? Se mira el resto de la oración,
         o —si la coincidencia no cayó en una oración larga— las ochenta letras
         siguientes. */
      const despues = oracion
        ? oracion.slice(oracion.toLowerCase().indexOf(m[0].toLowerCase()) + m[0].length)
        : t.texto.slice(m.index + m[0].length, m.index + m[0].length + 80)
      if (RX_DESMENTIDO.test(despues)) {
        diag.descartes.desmentido++; anota('desmentido'); continue
      }

      const cand: Senal = {
        tipo, frase: fragmento(t.texto, m.index, m.index + m[0].length),
        fecha: t.fecha, origen: t.origen, autor: t.autor,
        /* Cuánto texto cubrió el patrón. Sirve para desempatar; no se muestra. */
        largo: m[0].length,
      }
      const prev = fuera.get(t.cuentaId)
      /* Gana la más grave; a igual gravedad la más reciente; y a igual fecha
         —que es el caso normal, porque suelen venir de la MISMA nota— la que
         cubrió más texto.

         Ese último criterio no es cosmético, y Biolaboratorio Sadat es la
         prueba. Su nota del 25 de julio dice las dos cosas: «presenta
         indicadores de riesgo» y «alto riesgo de descontinuación del servicio».
         Sin desempate ganaba la primera por aparecer antes en el párrafo, y la
         evidencia que se le enseñaba al asesor era la vaga —la fácil de
         archivar— mientras la frase que de verdad obligaba a actuar quedaba
         guardada y sin ver. El 6 de octubre el cliente pidió la baja.

         Más letras cubiertas es una APROXIMACIÓN a más específico, no una
         medida de significado: el patrón largo exigió más palabras seguidas, y
         ésas son las que nombran el riesgo en vez de aludirlo. */
      const mejor = !prev
        || PESO[cand.tipo] > PESO[prev.tipo]
        || (PESO[cand.tipo] === PESO[prev.tipo]
            && ((cand.fecha ?? '') > (prev.fecha ?? '')
                || ((cand.fecha ?? '') === (prev.fecha ?? '')
                    && cand.largo > (prev.largo ?? 0))))
      anota(mejor ? 'gana' : 'pierde')
      if (mejor) fuera.set(t.cuentaId, cand)
    }
  }

  for (const t of textos) {
    if (!t.texto) continue
    probar(t, RX_BAJA, 'baja_declarada')
    probar(t, RX_RIESGO, 'riesgo_escrito')
    probar(t, RX_REDUCCION, 'reduccion_declarada')
  }
  diag.senales = fuera.size
  ultimoDiag = diag
  return fuera
}
