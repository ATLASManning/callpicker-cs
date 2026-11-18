/**
 * LOS 20 APARTADOS DEL EXPEDIENTE DE ENTREGA — fuente única
 * ==========================================================
 *
 * Qué tiene que entregar Activaciones al cerrar una activación, de dónde sale
 * cada dato hoy, y qué hacer con los que no salen de ninguna parte.
 *
 * ESTE ARCHIVO ES EL ÚNICO SITIO DONDE SE DECLARA ESO. La pantalla de
 * Activaciones 2.0, la validación del servidor y `scripts/mide-apartados-
 * entrega.ts` leen de aquí. Si alguien hace una copia en otro lenguaje para
 * «medir», la copia se separa al primer cambio y entonces la medición pasa
 * mientras el expediente está roto.
 *
 * ── LA HOJA SIGUE SIENDO LA FUENTE, Y NO SE TOCA ──────────────────────────
 *
 * Instrucción de José Manuel (18 nov 2026): «Activaciones trabaja el archivo
 * con el que actualizamos el apartado Activaciones 2.0, lo seguirá haciendo así
 * por ahora». Así que esto NO sustituye `data/activaciones.xlsx` ni le añade
 * columnas: lee lo que la hoja ya trae y declara, apartado por apartado, qué
 * falta encima.
 *
 * ── CINCO ESTADOS, Y LAS DIFERENCIAS ENTRE ELLOS SON TODO ─────────────────
 *
 *   completo     la hoja lo cierra y está lleno.
 *   falta        la hoja lo cierra y está vacío      → es una TAREA.
 *   otra_fuente  la hoja NO lo cierra: lo resuelve `cuentas`, el GRC, los
 *                contratos o los DIDs, y eso se consulta en el servidor.
 *   sin_fuente   no existe de dónde sacarlo          → es una DEPENDENCIA.
 *   no_medible   la fuente existe pero no mide esto  → hay que decirlo.
 *
 * `falta` y `sin_fuente` se ven igual en una celda vacía y son cosas
 * distintas: la primera es trabajo de alguien, la segunda es que el sistema no
 * tiene ese dato y pedirlo sería pedir que se lo invente.
 *
 * ── POR QUÉ EXISTE `cierraConLaHoja`, Y NO ES BUROCRACIA ──────────────────
 *
 * La primera versión de este archivo daba el estado por la hoja siempre que
 * hubiera alguna columna asociada. Medido sobre las 2,820 activaciones, eso
 * publicaba DOS FALSOS «COMPLETO»:
 *
 *   · el apartado 04 (DIDs y números portados) salía completo en 2,603
 *     activaciones porque la columna `Portabilidad` dice SÍ/NO — que no es la
 *     lista de números;
 *   · el apartado 11 (plan, extensiones y funcionalidades) salía completo en
 *     las 2,820 porque la columna `Tipo` tiene algo escrito — que no es el
 *     plan contratado.
 *
 * Un falso «falta» hace trabajar a alguien de más. Un falso «completo» dice
 * que está ENTREGADO lo que no está, y es con lo que se cierra un ticket. Así
 * que qué apartados cierra la hoja se DECLARA aquí, uno por uno, en vez de
 * deducirse de que haya una columna parecida al lado.
 */

/** De dónde sale el dato. */
export type FuenteApartado =
  | 'hoja'        // data/activaciones.xlsx, lo que Activaciones ya captura
  | 'cuentas'     // tabla `cuentas` de Supabase
  | 'grc'         // data/grc-zoho.json — el MRR institucional y nada más
  | 'contratos'   // data/contratos.json + contratos-addenda.json
  | 'dids'        // data/dids.json
  | 'tickets'     // el corte de Zoho Desk
  | 'captura'     // lo escribe una persona en el expediente
  | 'ninguna'     // hoy no existe en ningún sitio

export type EstadoApartado =
  | 'completo' | 'falta' | 'otra_fuente' | 'sin_fuente' | 'no_medible'

/** Una fila de la hoja, ya normalizada: encabezado sin acentos → valor. */
export type FilaHoja = Record<string, string>

export interface Apartado {
  clave:  string
  titulo: string
  /** La fuente principal. Si son varias, la que manda. */
  fuente: FuenteApartado
  /** Las otras fuentes que lo completan, si las hay. */
  tambien?: FuenteApartado[]
  /**
   * Columnas de la hoja que lo alimentan, con el nombre YA NORMALIZADO
   * (sin acentos, minúsculas, sin puntuación). Vacío = no sale de la hoja.
   */
  columnas: string[]
  /**
   * ¿Puede la HOJA, ella sola, dar este apartado por entregado?
   *
   * Se declara; no se deduce de que haya una columna asociada. Ver el bloque
   * de cabecera: deducirlo publicaba dos falsos «completo» sobre 2,820
   * activaciones. `false` significa que la hoja puede APORTAR algo —y se
   * muestra— pero que quien cierra el apartado es otra fuente o una persona.
   */
  cierraConLaHoja: boolean
  /**
   * Qué le pasa a este apartado cuando la hoja no lo trae. Por omisión
   * `'falta'`; los apartados sin fuente lo declaran explícitamente para que
   * una celda vacía no se lea como descuido de quien entrega.
   */
  cuandoVacio?: EstadoApartado
  /** La limitación verificable. Se MUESTRA; no es un comentario interno. */
  nota?: string
}

/* ── LAS FECHAS DE LA HOJA VIENEN EN DOS FORMATOS ────────────────────────────
 *
 * Medido el 18 nov 2026 sobre la columna `Cierre Ticket` de las 2,820 filas:
 * **1,907 son fechas de verdad** (Excel las entrega como `Date`) y **839 son
 * TEXTO** del tipo `21-Aug-2023`, con el mes en inglés. 74 están vacías.
 *
 * Mezclados, el expediente mostraba «arranque: 2024-07-02 · entrega real:
 * 1-Aug-2024» en la misma línea, y dos fechas con distinta forma no se pueden
 * comparar ni ordenar: ni para medir un plazo, ni para decir cuál es antes.
 *
 * Esto normaliza el texto conocido a ISO. Lo que NO reconoce lo devuelve TAL
 * CUAL: una fecha que no se entiende se muestra como está, no se adivina.
 */
const MESES: Record<string, string> = {
  jan: '01', ene: '01', feb: '02', mar: '03', apr: '04', abr: '04',
  may: '05', jun: '06', jul: '07', aug: '08', ago: '08', sep: '09',
  oct: '10', nov: '11', dec: '12', dic: '12',
}

export function fechaDeHoja(v: string): string {
  const s = String(v ?? '').trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = /^(\d{1,2})[-/ ]([A-Za-zñÑ]{3,})[-/ ](\d{4})$/.exec(s)
  if (!m) return s
  const mes = MESES[m[2].slice(0, 3).toLowerCase()]
  if (!mes) return s
  return `${m[3]}-${mes}-${m[1].padStart(2, '0')}`
}

/** Normaliza un encabezado o un nombre de columna. Igual que en el script. */
export function normCol(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export const APARTADOS: Apartado[] = [
  {
    clave: '01', titulo: 'Estatus: TICKET CERRADO — ENTREGA ACEPTADA',
    fuente: 'hoja', tambien: ['captura'],
    columnas: ['estatus', 'cierreticket'], cierraConLaHoja: false,
    nota: 'DOS PROBLEMAS, no uno. «ENTREGA ACEPTADA» no existe en ninguna '
        + 'fuente: la pone SAC en el apartado 20, y cerrar el ticket NO es que '
        + 'el cliente tenga servicio aceptado. Y la columna `Estatus` es un '
        + 'CÓDIGO NUMÉRICO sin leyenda —cinco valores: 5 en 2,730 filas, 3 en '
        + '54, 4 en 31, 2 en una y 4 vacías—, así que no se puede afirmar que '
        + 'diga «ticket cerrado» sin inventar qué significa cada número.',
  },
  {
    clave: '02', titulo: 'ID de cuenta y número de ticket de Zoho',
    fuente: 'hoja',
    columnas: ['id', 'aperturaticket'], cierraConLaHoja: true,
    nota: 'La hoja trae IDs que NO son números, y se han disfrazado de '
        + 'renumeración. Un ID que no es un número no es un ID.',
  },
  {
    clave: '03', titulo: 'Nombre comercial y razón social',
    fuente: 'hoja', tambien: ['cuentas'],
    columnas: ['cliente'], cierraConLaHoja: false,
    nota: 'El nombre comercial sí. La RAZÓN SOCIAL no está en la hoja ni en '
        + '`cuentas`: hay `direccion_fiscal`, que es otra cosa.',
  },
  {
    clave: '04', titulo: 'DID(s) asignados y números portados',
    fuente: 'dids', tambien: ['hoja'],
    columnas: ['portabilidad'], cierraConLaHoja: false,
    nota: 'La hoja sólo dice SÍ/NO a portabilidad. La lista de números vive en '
        + '`data/dids.json`, y ahí el CID identifica al cliente: cruzar por '
        + 'nombre mezcla cuentas.',
  },
  {
    clave: '05', titulo: 'Responsable de cuenta 1 y su cargo',
    fuente: 'cuentas', tambien: ['hoja'],
    columnas: ['contacto'], cierraConLaHoja: false,
    nota: '`cuentas.contacto_nombre` y `contacto_cargo`. Hay nombres '
        + 'capturados dentro del campo de correo.',
  },
  {
    clave: '06', titulo: 'Responsable de cuenta 2 y su cargo',
    fuente: 'cuentas',
    columnas: [], cierraConLaHoja: false,
    nota: 'Sale de `cuentas.contactos_json`, y la mayoría de cuentas tiene un '
        + 'solo contacto. El prompt admite excepción justificada; lo que no '
        + 'admite es inventar un segundo nombre.',
  },
  {
    clave: '07', titulo: 'Teléfono de contacto 1 y 2',
    fuente: 'cuentas',
    columnas: [], cierraConLaHoja: false,
    nota: '`cuentas.contacto_tel` y `contactos_json`.',
  },
  {
    clave: '08', titulo: 'Correo de contacto 1 y 2',
    fuente: 'cuentas',
    columnas: [], cierraConLaHoja: false,
    nota: '`cuentas.contacto_email` y `contactos_json`.',
  },
  {
    clave: '09', titulo: 'Medio de contacto preferente',
    fuente: 'ninguna', cuandoVacio: 'sin_fuente',
    columnas: [], cierraConLaHoja: false,
    nota: 'NO EXISTE en ninguna fuente. Se captura en el expediente o se '
        + 'declara no disponible. Deducirlo del canal más usado sería '
        + 'inventarlo: el medio preferente lo dice el cliente.',
  },
  {
    clave: '10', titulo: 'Comentarios y antecedentes relevantes',
    fuente: 'hoja', tambien: ['cuentas', 'captura'],
    columnas: ['comentariosencuesta'], cierraConLaHoja: true,
    nota: 'La hoja trae los comentarios de la encuesta; `cuentas` trae '
        + '`observaciones_kam` y `notas`. Son antecedentes distintos y no se '
        + 'sustituyen.',
  },
  {
    clave: '11', titulo: 'Servicio/plan contratado, extensiones y funcionalidades',
    fuente: 'cuentas', tambien: ['hoja'],
    columnas: ['tipo'], cierraConLaHoja: false,
    nota: 'El plan está en `cuentas.servicios_json` y en el libro «Planes '
        + '2.0». Lo que NO existe es la comparación entre lo CONTRATADO y lo '
        + 'ENTREGADO, que es justo lo que una entrega tendría que demostrar.',
  },
  {
    clave: '12', titulo: 'Link del audio de recepción conforme del cliente',
    fuente: 'ninguna', cuandoVacio: 'sin_fuente',
    columnas: [], cierraConLaHoja: false,
    nota: 'NO EXISTE: ni campo, ni almacenamiento, ni control de acceso. Y no '
        + 'puede ir en `public/`: ahí ya se sirvieron documentos de cliente sin '
        + 'sesión. Es una dependencia de infraestructura, no un campo que '
        + 'falte por capturar.',
  },
  {
    clave: '13', titulo: 'Facturación mensual (MRR) y moneda',
    fuente: 'grc', cuandoVacio: 'falta',
    columnas: [], cierraConLaHoja: false,
    nota: 'EL MRR ES EL DEL GRC Y NADA MÁS. La hoja trae una columna «1er '
        + 'Pago» que NO es el MRR —es el primer cobro— y `cuentas.facturacion` '
        + 'tampoco sirve. Usar cualquiera de las dos para rellenar este '
        + 'apartado es exactamente lo que el expediente prohíbe.',
  },
  {
    clave: '14', titulo: '¿Contrato? Plazo, fecha de inicio y de fin',
    fuente: 'contratos',
    columnas: [], cierraConLaHoja: false,
    nota: '`data/contratos.json` SE GENERA: lo nuestro entra por '
        + '`contratos-addenda.json`. Una cuenta sin contrato es un dato válido, '
        + 'no un hueco.',
  },
  {
    clave: '15', titulo: 'Vendedor y ejecutivo de Activaciones responsable',
    fuente: 'hoja',
    columnas: ['vendedor', 'ejecutivo'], cierraConLaHoja: true,
    nota: 'El único apartado que la hoja contesta entero y por sí sola.',
  },
  {
    clave: '16', titulo: 'Fecha prevista y fecha real de entrega',
    fuente: 'hoja', cuandoVacio: 'falta',
    columnas: ['arranquedeproceso', 'cierreticket', 'diasactivacion'],
    cierraConLaHoja: false,
    nota: 'La fecha REAL sí. La PREVISTA no existe: la hoja mide días '
        + 'transcurridos, que es un resultado, no un compromiso. Sin fecha '
        + 'prevista no hay cumplimiento que medir, sólo duración que describir.',
  },
  {
    clave: '17', titulo: 'Pruebas de entrada y salida, capacitación y su fecha',
    fuente: 'hoja',
    columnas: ['realizorecibiollamadas', 'loginadmin', 'loginapp'],
    cierraConLaHoja: false,
    nota: 'Las llamadas de prueba y los dos accesos sí, como indicio. La '
        + 'CAPACITACIÓN y su fecha no existen en ninguna fuente.',
  },
  {
    clave: '18', titulo: 'Incidencias, tickets abiertos y compromisos pendientes',
    fuente: 'tickets', cuandoVacio: 'no_medible',
    columnas: [], cierraConLaHoja: false,
    nota: 'NO MEDIBLE con la fuente actual: el corte de Zoho Desk sólo trae '
        + 'tickets CERRADOS, así que «tickets abiertos» no se puede contestar '
        + 'ni con cero. El conector de comunicaciones sí los trae y le falta '
        + 'la credencial de servicio.',
  },
  {
    clave: '19', titulo: 'Estado de demo, conversión y clasificación AAA',
    fuente: 'hoja', tambien: ['grc'],
    columnas: ['clasificacion', 'tipo'], cierraConLaHoja: false,
    nota: 'La hoja trae su propia clasificación y el tipo. La banda '
        + 'AAA/AA/A/B/C es del GRC y la reclasificación de dirección vive en '
        + 'una capa aparte. Son tres cosas distintas y no se mezclan.',
  },
  {
    clave: '20', titulo: 'Aceptación de SAC: responsable, fecha y sello',
    fuente: 'ninguna', cuandoVacio: 'sin_fuente',
    columnas: [], cierraConLaHoja: false,
    nota: 'NO EXISTE. Es la firma que convierte «cuenta aprovisionada» en '
        + '«cliente con servicio aceptado», y la pone el rol `sac` — nunca '
        + '`activaciones`, que es quien entrega. El candado ya está puesto en '
        + 'lib/permisos.ts aunque el endpoint todavía no exista.',
  },
]

if (APARTADOS.length !== 20) {
  // No es paranoia: el expediente se llama «los 20 apartados» en la
  // instrucción, y una lista de 19 seguiría pintando una pantalla entera sin
  // que nada fallara.
  throw new Error(`El expediente debe tener 20 apartados y tiene ${APARTADOS.length}`)
}

for (const ap of APARTADOS) {
  // Un apartado que dice cerrarse con la hoja y no declara ninguna columna
  // saldría «falta» en el 100% de las activaciones para siempre, sin que nada
  // avisara de que el error está en el catálogo y no en los datos.
  if (ap.cierraConLaHoja && !ap.columnas.length) {
    throw new Error(
      `El apartado ${ap.clave} dice cerrarse con la hoja y no declara columnas`)
  }
  // Y al revés: si no existe en ninguna parte, no puede cerrarse con la hoja.
  if (ap.cierraConLaHoja && ap.cuandoVacio === 'sin_fuente') {
    throw new Error(
      `El apartado ${ap.clave} se declara sin fuente y a la vez cerrable con la hoja`)
  }
}

export interface ValorApartado {
  clave:  string
  titulo: string
  estado: EstadoApartado
  /** Lo que se encontró, ya unido si vino de varias columnas. */
  valor:  string
  /** Qué columnas de la hoja contestaron, y cuáles no. */
  desdeHoja: { columna: string; valor: string }[]
  faltanDeHoja: string[]
  fuente: FuenteApartado
  nota?:  string
}

/**
 * Qué dice la HOJA sobre un apartado, para una fila.
 *
 * Deliberadamente NO consulta `cuentas`, el GRC ni los contratos: esto
 * responde «¿qué parte de esto ya está capturada donde Activaciones captura
 * hoy?», que es la pregunta que decide cuánto trabajo nuevo hay. Lo que sale de
 * otras fuentes se resuelve del lado del servidor, donde esas fuentes están.
 */
export function leeDeHoja(ap: Apartado, fila: FilaHoja): ValorApartado {
  const desdeHoja: { columna: string; valor: string }[] = []
  const faltanDeHoja: string[] = []

  for (const col of ap.columnas) {
    const v = (fila[col] ?? '').trim()
    if (v) desdeHoja.push({ columna: col, valor: v })
    else faltanDeHoja.push(col)
  }

  // EL ORDEN DE ESTAS TRES PREGUNTAS ES LA REGLA ENTERA.
  let estado: EstadoApartado
  if (ap.cuandoVacio === 'sin_fuente' || ap.cuandoVacio === 'no_medible') {
    // Primero lo que no existe. Nada que haya o no haya en la hoja cambia que
    // este dato no esté en ninguna parte, y una celda vacía aquí NO es un
    // descuido de quien entrega.
    estado = ap.cuandoVacio
  } else if (!ap.cierraConLaHoja) {
    // La hoja puede aportar algo —y se muestra en `desdeHoja`— pero no es
    // quien cierra. Decir `completo` aquí era el falso positivo del apartado
    // 04 y del 11.
    estado = 'otra_fuente'
  } else if (!desdeHoja.length) {
    estado = 'falta'
  } else if (faltanDeHoja.length) {
    // Parcial. Cuenta como `falta`: un apartado a medias no está entregado, y
    // darlo por completo es lo que convierte un expediente en un trámite.
    estado = 'falta'
  } else {
    estado = 'completo'
  }

  return {
    clave: ap.clave, titulo: ap.titulo, estado,
    valor: desdeHoja.map(d => d.valor).join(' · '),
    desdeHoja, faltanDeHoja,
    fuente: ap.fuente, nota: ap.nota,
  }
}

/** El expediente entero de una fila, visto sólo con lo que la hoja contesta. */
export function expedienteDeHoja(fila: FilaHoja): ValorApartado[] {
  return APARTADOS.map(ap => leeDeHoja(ap, fila))
}

/**
 * Resumen que se puede pintar en una tarjeta.
 *
 * `completos` NO se divide entre 20: se divide entre los apartados que HOY
 * tienen de dónde salir. Un porcentaje sobre 20 castigaría a quien entrega por
 * cuatro apartados que el sistema no puede darle, y esconder esos cuatro en el
 * denominador sería fabricar un número redondo sobre una ausencia.
 */
export function resumenExpediente(vals: ValorApartado[]) {
  const n = (e: EstadoApartado) => vals.filter(v => v.estado === e).length
  const completos  = n('completo')
  const faltan     = n('falta')
  const otraFuente = n('otra_fuente')
  const sinFuente  = n('sin_fuente')
  const noMedibles = n('no_medible')
  /** Los que la HOJA cierra. El denominador honesto de lo que se mide aquí. */
  const cierraHoja = completos + faltan
  return {
    completos, faltan, otraFuente, sinFuente, noMedibles, cierraHoja,
    total: vals.length,
    /** `null` cuando la hoja no cierra ninguno: un cero sin medición no es un cero. */
    pctDeLoQueCierraLaHoja: cierraHoja > 0
      ? Math.round((completos / cierraHoja) * 1000) / 10
      : null,
  }
}
