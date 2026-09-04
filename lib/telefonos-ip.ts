/**
 * Teléfonos IP verificados con Callpicker.
 *
 * Fuente: "Teléfonos IP compatibles.xlsx" (dirección, 4 sep 2026).
 *
 * El detalle que decide una respuesta comercial: **Cisco y Panasonic están en
 * las dos listas**. Contestar "sí, Cisco funciona" es incorrecto la mayoría de
 * las veces — de Cisco solo dos modelos están verificados y trece no lo están.
 * Por eso la consulta se resuelve por MODELO, nunca por marca, y la única marca
 * con veredicto de marca completa es Avaya.
 *
 * Y lo que no está en ninguna lista no es "incompatible": es "sin verificar".
 * Son cosas distintas y confundirlas cuesta una venta o una promesa rota.
 */

export type EstadoCompatibilidad = 'compatible' | 'no_compatible' | 'sin_verificar'

export interface TelefonoIP {
  marca:  string
  modelo: string
  /** Notas de la fuente, cuando el modelo necesita aclaración. */
  nota?:  string
}

/* ── Verificados como compatibles ────────────────────────────────────────── */
export const TELEFONOS_COMPATIBLES: TelefonoIP[] = [
  { marca: 'Aastra',      modelo: '6730i' },
  { marca: 'Aastra',      modelo: '6739i' },
  { marca: 'Cisco',       modelo: 'SPA 502G' },
  { marca: 'Cisco',       modelo: '303' },
  { marca: 'DENWA',       modelo: 'DW-710' },
  { marca: 'Fanvil',      modelo: 'X1' },
  { marca: 'Fanvil',      modelo: 'X2' },
  { marca: 'Fanvil',      modelo: 'X3' },
  { marca: 'Fanvil',      modelo: 'X4' },
  { marca: 'Fanvil',      modelo: 'X5' },
  { marca: 'Fanvil',      modelo: 'F52' },
  { marca: 'Grandstream', modelo: 'GXP1610' },
  { marca: 'Grandstream', modelo: 'GXP2612' },
  { marca: 'Grandstream', modelo: 'GXP2602' },
  { marca: 'Grandstream', modelo: 'GXP810' },
  { marca: 'Grandstream', modelo: 'GXP2135' },
  { marca: 'Grandstream', modelo: 'DP720' },
  { marca: 'Grandstream', modelo: 'DP750' },
  { marca: 'Grandstream', modelo: 'HT802',  nota: 'Adaptador ATA para equipo analógico.' },
  { marca: 'Grandstream', modelo: 'HT813',  nota: 'Adaptador ATA con puerto FXO.' },
  { marca: 'Grandstream', modelo: 'HT-486', nota: 'Adaptador ATA.' },
  { marca: 'Linksys',     modelo: 'SPA941' },
  { marca: 'Linphone',    modelo: 'Softphone', nota: 'Softphone, no teléfono físico.' },
  { marca: 'Panasonic',   modelo: 'KX-HDV130' },
  { marca: 'Panasonic',   modelo: 'KX-HDV230' },
  { marca: 'Polycom',     modelo: 'VVX', nota: 'Familia VVX.' },
  { marca: 'Polycom',     modelo: '550' },
  { marca: 'Polycom',     modelo: 'Soundpoint IP 320' },
  { marca: 'Sangoma',     modelo: 'SXXX', nota: 'Serie S de Sangoma.' },
  { marca: 'snom',        modelo: 'D715' },
  { marca: 'snom',        modelo: 'D717' },
  { marca: 'VTech',       modelo: 'VCS754' },
  { marca: 'Xorcom',      modelo: 'XP0120P' },
  { marca: 'Yealink',     modelo: 'T19X' },
  { marca: 'Yealink',     modelo: 'T20P' },
  { marca: 'Yealink',     modelo: 'T21P E2' },
  { marca: 'Yealink',     modelo: 'T22P' },
  { marca: 'Yealink',     modelo: 'T23G' },
  { marca: 'Yealink',     modelo: 'T31G', nota: 'También aparece como SIP-T31G.' },
  { marca: 'Yealink',     modelo: 'T48G' },
  { marca: 'Yealink',     modelo: 'CP965', nota: 'Equipo de conferencia.' },
  { marca: 'Yealink',     modelo: 'W60P',  nota: 'Base DECT inalámbrica.' },
]

/* ── Verificados como NO compatibles ─────────────────────────────────────── */
export const TELEFONOS_NO_COMPATIBLES: TelefonoIP[] = [
  { marca: 'Avaya',     modelo: 'TODOS', nota: 'La fuente indica "ninguno": ningún equipo Avaya está soportado.' },
  { marca: 'Cisco',     modelo: '3905' },
  { marca: 'Cisco',     modelo: '6921' },
  { marca: 'Cisco',     modelo: '7821' },
  { marca: 'Cisco',     modelo: '7841' },
  { marca: 'Cisco',     modelo: '7861' },
  { marca: 'Cisco',     modelo: '7937' },
  { marca: 'Cisco',     modelo: '7941' },
  { marca: 'Cisco',     modelo: '7942' },
  { marca: 'Cisco',     modelo: '7945' },
  { marca: 'Cisco',     modelo: '7961' },
  { marca: 'Cisco',     modelo: '7962' },
  { marca: 'Cisco',     modelo: '7970' },
  { marca: 'Cisco',     modelo: '79xx', nota: 'Toda la serie 79xx queda fuera.' },
  { marca: 'Cisco',     modelo: '8851' },
  { marca: 'Crexendo',  modelo: 'CX270' },
  { marca: 'Panasonic', modelo: 'KX-NT511' },
  { marca: 'Panasonic', modelo: 'KX-NT553' },
]

/** Marcas que aparecen en las dos listas: obligan a preguntar el modelo. */
export const MARCAS_MIXTAS = ['Cisco', 'Panasonic'] as const

/**
 * Qué hacer cuando el equipo no está en ninguna de las dos listas.
 *
 * Instrucción de dirección (4 sep 2026). Es una ruta concreta con nombre y
 * apellido, no un "consúltalo con alguien": así el caso no se queda sin dueño.
 * Una sola definición para la pantalla y para Atlas — si las dos redacciones se
 * separan, el asesor lee una cosa y el cliente escucha otra.
 */
export const CONTACTO_VALIDACION = {
  para:        'pablo@callpicker.com',
  paraNombre:  'Pablo Soto',
  copia:       'josel@callpicker.com',
  copiaNombre: 'José Manuel López',
} as const

export const RUTA_EQUIPO_NO_LISTADO =
  `Envía un correo a ${CONTACTO_VALIDACION.paraNombre} (${CONTACTO_VALIDACION.para}), ` +
  `con copia a ${CONTACTO_VALIDACION.copiaNombre} (${CONTACTO_VALIDACION.copia}), para que validen el equipo.`

/**
 * Enlace mailto con el asunto y el cuerpo ya escritos.
 *
 * La fricción que deja un caso sin enviar no es la falta de ganas: es tener que
 * buscar a quién se le escribe y qué se le pone. Con el correo redactado, mandarlo
 * cuesta un clic.
 */
export function correoValidacion(equipo: string): string {
  const asunto = `Validación de compatibilidad — ${equipo.trim()}`
  const cuerpo = [
    'Hola Pablo,',
    '',
    `Un cliente tiene el equipo: ${equipo.trim()}`,
    '',
    'No aparece en la lista de teléfonos IP verificados con Callpicker. ¿Nos ayudas a validar si es compatible?',
    '',
    'Datos del caso:',
    '- Cuenta / cliente: ',
    '- Cantidad de equipos: ',
    '- Urgencia: ',
    '',
    'Gracias.',
  ].join('\n')
  return `mailto:${CONTACTO_VALIDACION.para}`
    + `?cc=${CONTACTO_VALIDACION.copia}`
    + `&subject=${encodeURIComponent(asunto)}`
    + `&body=${encodeURIComponent(cuerpo)}`
}

/* ── Consulta ────────────────────────────────────────────────────────────── */

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Trozos comparables de la consulta.
 *
 * No se compara contra la cadena entera sin separadores: "Polycom VVX 411" se
 * volvía "polycomvvx411", que CONTIENE "x4" y devolvía un Fanvil X4. Se
 * tokeniza y además se pegan los pares contiguos, porque hay modelos escritos
 * con espacio de por medio — "SPA 502G", "T21P E2".
 */
function trozos(consulta: string): Set<string> {
  const tk = consulta.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
    .split(/[^a-z0-9]+/).filter(Boolean)
  const out = new Set<string>(tk)
  for (let i = 0; i < tk.length - 1; i++) {
    out.add(tk[i] + tk[i + 1])
    if (i < tk.length - 2) out.add(tk[i] + tk[i + 1] + tk[i + 2])
  }
  return out
}

export interface ResultadoCompatibilidad {
  estado:  EstadoCompatibilidad
  /** La ficha encontrada, si hubo coincidencia. */
  equipo?: TelefonoIP
  /** Explicación lista para leerse al cliente. */
  mensaje: string
}

/**
 * Resuelve la compatibilidad de un equipo.
 *
 * `consulta` puede venir sucia ("Yealink T-48G", "cisco 7841", "SIP-T31G"): se
 * compara por trozos normalizados. Los modelos de tres caracteres o menos
 * ("X1", "303", "550") exigen además que la marca aparezca en la consulta —
 * son demasiado cortos para reconocerlos solos sin equivocarse.
 */
export function compatibilidadTelefono(consulta: string): ResultadoCompatibilidad {
  const q = norm(consulta)
  if (q.length < 2) {
    return { estado: 'sin_verificar', mensaje: 'Indica marca y modelo del equipo.' }
  }
  const tk = trozos(consulta)

  const coincide = (t: TelefonoIP) => {
    const m     = norm(t.modelo)
    const marca = norm(t.marca)

    // Veredicto de marca completa (Avaya): basta con nombrarla.
    if (t.modelo === 'TODOS') return q.includes(marca)

    // Serie con comodín: 79xx cubre 7940, 7960, etc.
    if (m.includes('xx')) {
      const raiz = m.replace(/x+$/, '')
      if (raiz.length < 2) return false
      return [...tk].some(t2 => t2.startsWith(raiz) && /^\d+$/.test(t2))
    }

    if (!tk.has(m)) return false
    // Modelo corto: sin la marca de por medio no es concluyente.
    if (m.length <= 3) return q.includes(marca)
    return true
  }

  // Se revisa primero lo NO compatible: si un modelo estuviera en ambas listas
  // por error de captura, la respuesta prudente es la que no promete.
  const malo = TELEFONOS_NO_COMPATIBLES.find(coincide)
  if (malo) {
    return {
      estado: 'no_compatible', equipo: malo,
      mensaje: malo.modelo === 'TODOS'
        ? `${malo.marca} no es compatible con Callpicker: ningún modelo de la marca está soportado.`
        : `${malo.marca} ${malo.modelo} NO es compatible con Callpicker.${malo.nota ? ' ' + malo.nota : ''}`,
    }
  }

  const bueno = TELEFONOS_COMPATIBLES.find(coincide)
  if (bueno) {
    return {
      estado: 'compatible', equipo: bueno,
      mensaje: `${bueno.marca} ${bueno.modelo} SÍ es compatible con Callpicker.${bueno.nota ? ' ' + bueno.nota : ''}`,
    }
  }

  // Una marca mixta sin modelo reconocible no se puede responder: hay que pedirlo.
  const mixta = MARCAS_MIXTAS.find(m => q.includes(norm(m)))
  if (mixta) {
    return {
      estado: 'sin_verificar',
      mensaje: `De ${mixta} hay modelos compatibles y modelos que no lo son. Se necesita el modelo exacto para responder; la marca por sí sola no alcanza.`,
    }
  }

  return {
    estado: 'sin_verificar',
    mensaje: `Ese equipo no aparece en la lista verificada. No significa que no funcione: significa que no se ha probado. ${RUTA_EQUIPO_NO_LISTADO} No lo descartes ni lo prometas hasta tener esa respuesta.`,
  }
}

/** Compatibles agrupados por marca, para pintarlos. */
export function porMarca(lista: TelefonoIP[]): Array<{ marca: string; modelos: TelefonoIP[] }> {
  const mapa = new Map<string, TelefonoIP[]>()
  for (const t of lista) {
    if (!mapa.has(t.marca)) mapa.set(t.marca, [])
    mapa.get(t.marca)!.push(t)
  }
  return [...mapa.entries()]
    .map(([marca, modelos]) => ({ marca, modelos }))
    .sort((a, b) => a.marca.localeCompare(b.marca, 'es'))
}
