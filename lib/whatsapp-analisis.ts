/**
 * Motor de análisis de conversaciones de WhatsApp.
 *
 * Dos responsabilidades:
 *   1. Parsear exportaciones de chat de WhatsApp ("Exportar chat" → .txt),
 *      que es la única vía compatible con los Términos de Servicio para leer
 *      GRUPOS (la Cloud API oficial de Meta no soporta grupos en absoluto).
 *   2. Detectar señales de riesgo y oportunidad sobre esos mensajes, para
 *      alimentar los warnings del Dashboard y el seguimiento de cuenta.
 *
 * El detector NUNCA cambia el estado de una cuenta por sí solo: levanta la
 * señal con su evidencia textual para que un humano decida — mismo criterio
 * que etiquetarSiHayIntencionDeCancelacion en app/api/actividades/[id].
 */

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export type SeveridadSenal = 'critica' | 'alta' | 'media' | 'info'

export type TipoSenal =
  | 'cancelacion'
  | 'escalamiento'
  | 'falla_tecnica'
  | 'competencia'
  | 'precio'
  | 'compromiso_abierto'
  | 'cambio_contacto'
  | 'expansion'
  | 'silencio'

export interface MensajeWA {
  autor:      string
  texto:      string
  enviadoEn:  string   // ISO
  esSistema:  boolean  // "Fulano se unió", cifrado de extremo a extremo, etc.
}

export interface Senal {
  tipo:       TipoSenal
  severidad:  SeveridadSenal
  titulo:     string
  evidencia:  string   // fragmento textual que la disparó
  autor:      string
  enviadoEn:  string
  accion:     string   // qué debe hacer el asesor
}

export const META_SENAL: Record<TipoSenal, {
  label: string; color: string; severidad: SeveridadSenal; accion: string
}> = {
  cancelacion:        { label: 'Intención de cancelación', color: '#DC2626', severidad: 'critica', accion: 'Escalar a retención en menos de 24 h y validar con el cliente antes de cualquier gestión de baja.' },
  escalamiento:       { label: 'Molestia / escalamiento',  color: '#EA580C', severidad: 'alta',    accion: 'Responder el mismo día con dueño del problema y fecha comprometida.' },
  falla_tecnica:      { label: 'Falla técnica reportada',  color: '#F59E0B', severidad: 'alta',    accion: 'Verificar ticket en Zoho Desk. Si supera 48 h sin respuesta, escalar.' },
  competencia:        { label: 'Competencia mencionada',   color: '#DC2626', severidad: 'critica', accion: 'El cliente está comparando. Preparar caso de valor con datos de uso reales antes del siguiente contacto.' },
  precio:             { label: 'Presión de precio',        color: '#EA580C', severidad: 'alta',    accion: 'Antes de ofrecer descuento, revisar consumo real en Informe de Cortes: puede ser un right-sizing, no una objeción de precio.' },
  compromiso_abierto: { label: 'Compromiso sin cerrar',    color: '#F59E0B', severidad: 'media',   accion: 'Registrar el compromiso en Observaciones KAM con fecha y responsable.' },
  cambio_contacto:    { label: 'Cambio de interlocutor',   color: '#6366F1', severidad: 'media',   accion: 'Actualizar el mapa de decisores de la cuenta. Un solo contacto conocido es un punto de falla.' },
  expansion:          { label: 'Señal de expansión',       color: '#059669', severidad: 'info',    accion: 'Oportunidad de upsell: documentar el caso de uso y preparar propuesta.' },
  silencio:           { label: 'Silencio prolongado',      color: '#64748B', severidad: 'media',   accion: 'Retomar contacto: el lapso sin conversación es una alerta pasiva.' },
}

/* ── Patrones de detección ──────────────────────────────────────────────── */
// Alineados con RX_CANCELACION de app/api/actividades/[id]/route.ts para que
// una misma frase se lea igual en actividades y en WhatsApp.

const PATRONES: Array<{ tipo: TipoSenal; rx: RegExp }> = [
  { tipo: 'cancelacion', rx: /cancelar|cancelaci[oó]n|dar(?:se)? de baja|no (?:vamos|van|voy) a renovar|no renovar[áa]?|queremos (?:darnos de )?baja|terminar (?:el )?(?:servicio|contrato)|cerrar (?:la )?cuenta|prescindir del servicio|ya no (?:lo )?(?:vamos a )?(?:usar|ocupar|necesitar)/i },
  { tipo: 'competencia', rx: /cotiza(?:ci[oó]n|ndo|mos) con otr|otro proveedor|otra opci[oó]n|nos ofrecieron|estamos (?:viendo|evaluando) (?:otras|otro)|comparando|la competencia|nos lleg[oó] una propuesta|mejor oferta/i },
  { tipo: 'escalamiento', rx: /inaceptable|es el colmo|ya van (?:varias|muchas)|otra vez|siempre (?:pasa|falla)|estamos molest|muy mal servicio|p[eé]sim[oa]|nadie (?:me |nos )?(?:responde|contesta|ayuda)|urge(?:nte)?!|necesito hablar con (?:tu |un )?(?:jefe|supervisor|gerente)|queja formal/i },
  { tipo: 'falla_tecnica', rx: /no (?:funciona|sirve|entra|carga|conecta)|se ca(?:y[oó]|e) (?:el |la )?(?:sistema|l[ií]nea|servicio|plataforma)|sin servicio|no (?:puedo|podemos) (?:llamar|marcar|recibir)|falla|error|no (?:me |nos )?(?:llegan|entran) (?:las )?llamadas|se corta|mala calidad de (?:audio|llamada)/i },
  { tipo: 'precio', rx: /muy caro|est[aá] car[oa]|(?:baj|reduc)(?:ar|ir|en|ame|anos) (?:el |la )?(?:precio|costo|tarifa|plan|renta)|descuento|ajustar el (?:plan|costo)|no justifica el (?:costo|precio)|presupuesto (?:no |se )?(?:alcanza|recort|redujo)|salir(?:no)?s m[aá]s barato/i },
  { tipo: 'compromiso_abierto', rx: /(?:te |les |le )?(?:env[ií]o|mando|paso|comparto) (?:el|la|los|las)[^.!?\n]{0,40}(?:ma[ñn]ana|luego|m[aá]s tarde|en la semana|pronto)|quedamos (?:en|de)|te (?:confirmo|aviso|busco)|lo revis(?:o|amos) y (?:te|les) (?:digo|aviso)|pendiente de (?:enviar|confirmar|revisar)/i },
  { tipo: 'cambio_contacto', rx: /ya no (?:trabajo|est[aá]|labora)|dej[oó] la empresa|sali[oó] de la empresa|(?:mi|el|la) (?:reemplazo|sustituto|nuev[oa])|a partir de (?:hoy|ahora)[^.!?\n]{0,30}(?:ver[aá]|atender[aá]|queda)|me cambiaron de [aá]rea|ahora lo ve/i },
  { tipo: 'expansion', rx: /(?:queremos|necesitamos|nos interesa) (?:agregar|sumar|m[aá]s|otra|otro|ampliar|contratar)|(?:cu[aá]nto|cotiza)(?:me|nos)? (?:cuesta|sale|ser[ií]a)[^.!?\n]{0,40}(?:extensi|l[ií]nea|n[uú]mero|agente|licencia)|abrimos (?:otra |una nueva )?(?:sucursal|oficina|sede)|nuevo proyecto|vamos a crecer/i },
]

/** Frases de sistema de WhatsApp que no son mensajes reales de nadie. */
const RX_SISTEMA = /^(?:Los mensajes y las llamadas est[aá]n cifrados|Se a[ñn]adi[oó]|.*(?:se uni[oó] usando|a[ñn]adi[oó] a|elimin[oó] a|sali[oó] del grupo|cambi[oó] (?:el asunto|la descripci[oó]n|la imagen))|<Multimedia omitido>|Este mensaje fue eliminado|Se elimin[oó] este mensaje)/i

/* ── Parser de exportación de WhatsApp ──────────────────────────────────── */
/**
 * WhatsApp exporta con formatos distintos según plataforma y locale. Se cubren
 * los dos dominantes en México:
 *   [25/8/26, 17:56:32] Autor: texto      (iOS, con corchetes)
 *   25/8/26, 17:56 - Autor: texto         (Android, con guion)
 * Ambos con fecha d/m/aa o d/m/aaaa y hora de 24 h o con a. m./p. m.
 */
const RX_LINEA_IOS     = /^‎?\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?\]\s*([^:]{1,80}):\s*([\s\S]*)$/i
const RX_LINEA_ANDROID = /^‎?(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?\s*?m?\.?\s*-\s*([^:]{1,80}):\s*([\s\S]*)$/i

function aISO(d: string, m: string, y: string, hh: string, mm: string, ss: string | undefined, ampm?: string): string {
  let anio = Number(y)
  if (anio < 100) anio += 2000
  let hora = Number(hh)
  if (ampm) {
    const esPM = ampm.toLowerCase() === 'p'
    if (esPM && hora < 12) hora += 12
    if (!esPM && hora === 12) hora = 0
  }
  const p = (n: number) => String(n).padStart(2, '0')
  return `${anio}-${p(Number(m))}-${p(Number(d))}T${p(hora)}:${p(Number(mm))}:${p(Number(ss ?? 0))}`
}

/**
 * Una línea que empieza con marca de tiempo pero NO trae "Autor:" es un aviso
 * del sistema ("Juan salió del grupo", "cambió el asunto"). Sin esta
 * detección se pegaría como continuación del mensaje anterior y contaminaría
 * tanto el hilo como el análisis de señales.
 */
const RX_SOLO_FECHA = /^‎?\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}/
const sinCorchete = (l: string) => (l.startsWith('[') || l.startsWith('‎[') ? l.replace('[', '') : l)

export function parseExportacionWhatsApp(contenido: string): MensajeWA[] {
  const lineas = contenido.replace(/\r\n/g, '\n').split('\n')
  const out: MensajeWA[] = []

  for (const linea of lineas) {
    const m = RX_LINEA_IOS.exec(linea) ?? RX_LINEA_ANDROID.exec(linea)
    if (m) {
      const [, d, mes, y, hh, mm, ss, ampm, autor, texto] = m
      out.push({
        autor:     autor.trim(),
        texto:     (texto ?? '').trim(),
        enviadoEn: aISO(d, mes, y, hh, mm, ss, ampm),
        esSistema: RX_SISTEMA.test((texto ?? '').trim()),
      })
    } else if (RX_SOLO_FECHA.test(sinCorchete(linea))) {
      continue                                  // aviso del sistema: se descarta
    } else if (out.length > 0 && linea.trim() !== '') {
      out[out.length - 1].texto += '\n' + linea.trim()   // mensaje multilínea
    }
  }
  return out
}

/** Nombre de la conversación a partir del nombre de archivo exportado. */
export function nombreDesdeArchivo(nombreArchivo: string): string {
  return nombreArchivo
    .replace(/\.(txt|zip)$/i, '')
    .replace(/^Chat de WhatsApp con\s*/i, '')
    .replace(/^WhatsApp Chat with\s*/i, '')
    .trim() || 'Conversación sin nombre'
}

/* ── Detección de señales ───────────────────────────────────────────────── */

const DIAS_SILENCIO = 21

export interface ResultadoAnalisis {
  senales:        Senal[]
  totalMensajes:  number
  participantes:  string[]
  primerMensaje:  string | null
  ultimoMensaje:  string | null
  diasSinRespuesta: number | null
}

/**
 * @param mensajes  Conversación completa, en orden cronológico.
 * @param nuestros  Nombres/alias del lado Callpicker. Sirven para distinguir
 *                  quién habla: una queja del cliente pesa distinto que la
 *                  misma palabra escrita por el asesor.
 */
export function analizarConversacion(mensajes: MensajeWA[], nuestros: string[] = []): ResultadoAnalisis {
  const reales = mensajes.filter(m => !m.esSistema && m.texto.trim() !== '')
  const nuestrosNorm = new Set(nuestros.map(n => n.trim().toLowerCase()))
  const esNuestro = (autor: string) => nuestrosNorm.has(autor.trim().toLowerCase())

  const senales: Senal[] = []
  const yaVisto = new Set<string>()   // evita repetir el mismo tipo por el mismo autor el mismo día

  for (const msg of reales) {
    // Las señales de riesgo solo cuentan cuando las dice el CLIENTE.
    // Un asesor escribiendo "¿van a cancelar?" no es una intención de baja.
    if (esNuestro(msg.autor)) continue

    for (const { tipo, rx } of PATRONES) {
      if (!rx.test(msg.texto)) continue
      const clave = `${tipo}|${msg.autor}|${msg.enviadoEn.slice(0, 10)}`
      if (yaVisto.has(clave)) continue
      yaVisto.add(clave)

      const meta = META_SENAL[tipo]
      senales.push({
        tipo, severidad: meta.severidad, titulo: meta.label,
        evidencia: msg.texto.length > 260 ? msg.texto.slice(0, 260) + '…' : msg.texto,
        autor: msg.autor, enviadoEn: msg.enviadoEn, accion: meta.accion,
      })
    }
  }

  const primer = reales[0]?.enviadoEn ?? null
  const ultimo = reales[reales.length - 1]?.enviadoEn ?? null

  let diasSinRespuesta: number | null = null
  if (ultimo) {
    diasSinRespuesta = Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000)
    if (diasSinRespuesta >= DIAS_SILENCIO) {
      senales.push({
        tipo: 'silencio', severidad: META_SENAL.silencio.severidad,
        titulo: META_SENAL.silencio.label,
        evidencia: `Sin mensajes desde hace ${diasSinRespuesta} días (último: ${ultimo.slice(0, 10)}).`,
        autor: '—', enviadoEn: ultimo, accion: META_SENAL.silencio.accion,
      })
    }
  }

  const orden: Record<SeveridadSenal, number> = { critica: 0, alta: 1, media: 2, info: 3 }
  senales.sort((a, b) => orden[a.severidad] - orden[b.severidad] || b.enviadoEn.localeCompare(a.enviadoEn))

  return {
    senales,
    totalMensajes: reales.length,
    participantes: Array.from(new Set(reales.map(m => m.autor))),
    primerMensaje: primer,
    ultimoMensaje: ultimo,
    diasSinRespuesta,
  }
}

/** Puntaje de riesgo 0-100 de una conversación, para ordenar la bandeja. */
export function riesgoConversacion(senales: Senal[]): number {
  const peso: Record<SeveridadSenal, number> = { critica: 40, alta: 20, media: 8, info: 0 }
  return Math.min(100, senales.reduce((s, x) => s + peso[x.severidad], 0))
}
