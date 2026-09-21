/**
 * Observaciones KAM — bitácora fechada dentro de un solo campo de texto.
 *
 * ── POR QUÉ ASÍ Y NO UNA TABLA ─────────────────────────────────────────────
 * `cuentas.observaciones_kam` es una columna TEXT que hoy leen DOCE sitios
 * —el contexto de las actividades, el Health Score, el radar, los huecos de
 * datos, el enriquecimiento, el editor de la ficha, el alta de cuentas— y que
 * escriben CUATRO. Todos la tratan como una cadena suelta.
 *
 * Dirección pidió (21 sep 2026) que los asesores puedan ir dejando un resumen
 * SEMANAL —comportamiento de la cuenta, tickets, reuniones internas— separado
 * por fechas. Mover eso a una tabla propia obligaría a tocar los doce lectores
 * y a una migración de base de datos; estructurar el texto no obliga a ninguno:
 * siguen recibiendo una cadena, sólo que ahora ordenada y fechada.
 *
 * ── EL FORMATO ─────────────────────────────────────────────────────────────
 * Cada entrada abre con una línea separadora y debajo va el cuerpo libre:
 *
 *     ━━ 2026-09-21 · Semana 38 · Cecilia Ramírez ━━
 *     Comportamiento: consumo estable, 78% del plan.
 *     Tickets: 2 abiertos, ninguno crítico.
 *     Reuniones internas: se acordó proponer upgrade en octubre.
 *
 * Las entradas van de la MÁS NUEVA a la más vieja. Antes de esto los dos
 * procesos automáticos escribían en orden contrario entre sí —uno antepone y
 * otro añade al final—, así que la bitácora quedaba intercalada sin que se
 * notara. Todo el que escriba debe pasar por `anteponerEntrada`.
 *
 * El texto que ya existía y no trae separador NO se pierde: se devuelve como
 * una entrada sin fecha, etiquetada como anterior a la bitácora. Nada de lo
 * escrito hasta hoy se reinterpreta ni se tira.
 */

/** Marca de separación. Se eligió `━` por ser improbable en texto tecleado. */
const MARCA = '━━'

/**
 * Reconoce el encabezado de una entrada.
 *
 * Tolerante a propósito: el autor es opcional, el número de `━` da igual y se
 * admiten espacios de más. Alguien puede editar la bitácora a mano desde el
 * cuadro de texto completo y no debe perder sus entradas por un espacio.
 */
const RX_ENCABEZADO = /^[ \t]*━+[ \t]*(\d{4})-(\d{2})-(\d{2})[ \t]*(?:·[ \t]*Semana[ \t]*(\d+))?[ \t]*(?:·[ \t]*([^━\n]*?))?[ \t]*━*[ \t]*$/

/**
 * Encabezado del texto que ya existía antes de que esto fuera una bitácora.
 *
 * Hace falta porque sin él ese texto se PIERDE: al anteponer una entrada
 * nueva, todo lo que quedaba debajo —sin marca que lo separase— se leía como
 * cuerpo de la entrada nueva, y la observación vieja aparecía firmada con la
 * fecha y el autor de esta semana. Se le pone una marca propia y se dice que
 * no tiene fecha, en vez de inventarle una que nadie escribió.
 */
const RX_SIN_FECHA = /^[ \t]*━+[ \t]*sin fecha(?:[ \t]*·[^━\n]*)?[ \t]*━*[ \t]*$/i
const CAB_SIN_FECHA = `${'━━'} sin fecha · anterior a la bitácora ${'━━'}`

export interface EntradaKam {
  /** `YYYY-MM-DD`, o `null` si es el texto anterior a la bitácora. */
  fecha: string | null
  /** Semana ISO, si el encabezado la traía. */
  semana: number | null
  /** Quién la escribió. `null` cuando no se registró. */
  autor: string | null
  /** El resumen en sí, sin el encabezado. */
  cuerpo: string
  /** La escribió el sistema (conciliación, detección de cancelación…). */
  automatica: boolean
}

/** Las notas que pone el sistema abren con uno de estos. */
const RX_AUTOMATICA = /^\s*(?:🔴|⚠️|🤖|\[Detectado autom)/

/** Fecha de hoy en Ciudad de México, `YYYY-MM-DD`. */
export function hoyMX(d: Date = new Date()): string {
  // El servidor de Vercel corre en UTC: a partir de las 18:00 hora de México
  // `toISOString()` ya devuelve el día siguiente y la entrada saldría fechada
  // mañana. Se fuerza la zona.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

/**
 * Semana ISO 8601 de una fecha `YYYY-MM-DD`.
 *
 * ISO y no «la semana número N del año» a secas: la semana 1 es la que
 * contiene el primer jueves, y así el 1 de enero puede caer en la semana 52
 * del año anterior. Importa porque el resumen es semanal y dos asesores tienen
 * que estar contando la misma semana.
 */
export function semanaISO(fechaISO: string): number {
  const [a, m, d] = fechaISO.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d))
  // Al jueves de esa semana: ahí vive el año ISO al que pertenece.
  const dow = (dt.getUTCDay() + 6) % 7          // lunes = 0
  dt.setUTCDate(dt.getUTCDate() - dow + 3)
  const primerJueves = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4))
  const dowPJ = (primerJueves.getUTCDay() + 6) % 7
  primerJueves.setUTCDate(primerJueves.getUTCDate() - dowPJ + 3)
  return 1 + Math.round((dt.getTime() - primerJueves.getTime()) / (7 * 24 * 3600 * 1000))
}

/** Construye la línea separadora de una entrada. */
export function encabezado(fechaISO: string, autor?: string | null): string {
  const partes = [fechaISO, `Semana ${semanaISO(fechaISO)}`]
  const quien = (autor ?? '').trim()
  if (quien) partes.push(quien)
  return `${MARCA} ${partes.join(' · ')} ${MARCA}`
}

/**
 * Parte el campo en entradas, de la más nueva a la más vieja.
 *
 * NO reordena: respeta el orden en que está escrito, porque el campo se puede
 * editar a mano y reordenar por fecha cambiaría lo que el asesor dejó a
 * propósito. Lo que sí garantiza es que quien escribe con `anteponerEntrada`
 * deja lo nuevo arriba.
 */
export function parseObservaciones(texto: string | null | undefined): EntradaKam[] {
  const t = String(texto ?? '').replace(/\r\n/g, '\n').trim()
  if (!t || t === '0') return []

  const lineas = t.split('\n')
  const entradas: EntradaKam[] = []
  let actual: EntradaKam | null = null
  let sueltas: string[] = []

  const cerrar = (e: EntradaKam | null, cuerpo: string[]) => {
    if (!e) return
    e.cuerpo = cuerpo.join('\n').trim()
    e.automatica = RX_AUTOMATICA.test(e.cuerpo)
    entradas.push(e)
  }

  for (const ln of lineas) {
    const sinFecha = RX_SIN_FECHA.test(ln)
    const m = sinFecha ? null : RX_ENCABEZADO.exec(ln)
    if (m || sinFecha) {
      if (actual) cerrar(actual, sueltas)
      else if (sueltas.join('\n').trim()) {
        // Texto anterior a la bitácora: se conserva tal cual, sin fecha.
        entradas.push({
          fecha: null, semana: null, autor: null,
          cuerpo: sueltas.join('\n').trim(),
          automatica: RX_AUTOMATICA.test(sueltas.join('\n').trim()),
        })
      }
      actual = m
        ? {
            fecha: `${m[1]}-${m[2]}-${m[3]}`,
            semana: m[4] ? parseInt(m[4], 10) : null,
            autor: (m[5] ?? '').trim() || null,
            cuerpo: '',
            automatica: false,
          }
        : { fecha: null, semana: null, autor: null, cuerpo: '', automatica: false }
      sueltas = []
      continue
    }
    sueltas.push(ln)
  }

  if (actual) cerrar(actual, sueltas)
  else if (sueltas.join('\n').trim()) {
    const cuerpo = sueltas.join('\n').trim()
    entradas.push({
      fecha: null, semana: null, autor: null, cuerpo,
      automatica: RX_AUTOMATICA.test(cuerpo),
    })
  }

  // Una entrada con encabezado y sin cuerpo no aporta nada y ensucia la vista.
  return entradas.filter(e => e.cuerpo !== '')
}

/**
 * Antepone una entrada nueva al campo. **Único camino de escritura.**
 *
 * Lo usan tanto el formulario del asesor como los procesos automáticos, para
 * que la bitácora quede en un solo orden.
 */
export function anteponerEntrada(
  previo: string | null | undefined,
  cuerpo: string,
  autor?: string | null,
  fechaISO: string = hoyMX(),
): string {
  const limpio = cuerpo.trim()
  if (!limpio) return String(previo ?? '')
  const anterior = String(previo ?? '').trim()
  const bloque = `${encabezado(fechaISO, autor)}\n${limpio}`
  // El `0` es el marcador de «vacío» que usan data-gaps y el radar: no se
  // arrastra como si fuera contenido.
  if (!anterior || anterior === '0') return bloque

  // Si lo que había no abre con un encabezado, se le pone el suyo ANTES de
  // anteponer nada. Sin esto queda pegado debajo de la entrada nueva y se lee
  // como parte de ella: la observación vieja terminaba firmada con la fecha y
  // el autor de esta semana.
  const primera = anterior.split('\n', 1)[0]
  const yaMarcado = RX_SIN_FECHA.test(primera) || RX_ENCABEZADO.test(primera)
  const cola = yaMarcado ? anterior : `${CAB_SIN_FECHA}\n${anterior}`
  return `${bloque}\n\n${cola}`
}

/**
 * Lo que se le manda a la IA cuando solo caben unos cientos de caracteres.
 *
 * Recorta por ENTRADAS, no por caracteres: un `slice(0, 150)` sobre el campo
 * ya estructurado devolvía la línea separadora y nada de contenido —el modelo
 * recibía «━━ 2026-09-21 · Semana 38 ━━» y creía que eso era la observación—.
 * Se dice además cuántas entradas quedaron fuera, para que el contexto no
 * tenga huecos mudos.
 */
export function resumenParaIA(texto: string | null | undefined, maxChars = 400): string {
  const entradas = parseObservaciones(texto)
  if (!entradas.length) return ''

  const partes: string[] = []
  let usados = 0
  let incluidas = 0
  for (const e of entradas) {
    const etiqueta = e.fecha ? `[${e.fecha}${e.autor ? ` · ${e.autor}` : ''}]` : '[sin fecha]'
    const pieza = `${etiqueta} ${e.cuerpo.replace(/\s+/g, ' ')}`
    if (usados + pieza.length > maxChars && incluidas > 0) break
    partes.push(pieza.slice(0, maxChars))
    usados += pieza.length
    incluidas++
  }
  const restantes = entradas.length - incluidas
  return partes.join(' | ') + (restantes > 0 ? ` (+${restantes} entrada(s) anterior(es) no mostradas)` : '')
}
