/* ═══════════════════════════════════════════════════════════════════════
   RADAR DE CUENTA — motor de evaluación automática (ATLAS)

   Calcula los indicadores que NO dependen del asesor, a partir de los
   cortes de facturación (data/cortes-facturacion.xlsx, 9 meses de
   historia) más los datos de la cuenta en Supabase.

   Regla de oro: el % de consumo NUNCA se toma del archivo. Se recalcula
   aquí desde minutos consumidos / minutos incluidos, porque el archivo
   trae porcentajes incoherentes (caso ClickBalance jul-2026: 44 min de
   2,400 incluidos reportados como 183%).
═══════════════════════════════════════════════════════════════════════ */

export type NivelRadar = 'save' | 'recover' | 'prevent' | 'optimize' | 'grow' | 'sin_datos'

export interface CorteSerie {
  mes: string            // YYYY-MM
  plan: string
  minutosIncl: number
  minutosCons: number
  /** Recalculado aquí, nunca tomado del archivo */
  pctConsumo: number | null
  pctEntrantes: number | null
  pctSalientes: number | null
  usoPrincipal: string
  /** true cuando minutosIncl === 1 → plan de extensiones ilimitadas */
  ilimitado: boolean
  /** Extensiones extraídas del nombre del plan ("3 Extensiones …" → 3) */
  extensiones: number | null
}

export interface Indicador {
  id: string
  label: string
  valor: string
  nota: string
  /** true → se pinta en rojo intenso */
  riesgo: boolean
  /** Puntos que resta al score (0 si no hay riesgo) */
  penalizacion: number
}

export interface RadarCuenta {
  score: number
  nivel: NivelRadar
  titulo: string
  resumen: string
  serie: CorteSerie[]
  indicadores: Indicador[]
  alertasCriticas: number
  /** Sin cortes cruzados: el bloque de uso no aplica */
  sinTelemetria: boolean
  lecturaAtlas: string
}

/** Minutos estimados por extensión en planes ilimitados (criterio de negocio) */
export const MIN_POR_EXTENSION = 1500

/* ── Helpers ─────────────────────────────────────────────────────────── */

export function extraerExtensiones(plan: string): number | null {
  const m = /^\s*(\d+)\s+Extensi/i.exec(plan ?? '')
  return m ? Number(m[1]) : null
}

/**
 * Minutos incluidos "efectivos". En planes ilimitados el archivo trae 1,
 * así que se estima con extensiones × MIN_POR_EXTENSION.
 * Devuelve null cuando no se puede estimar (planes de Chat, licencias).
 */
export function minutosBase(c: { minutosIncl: number; plan: string }): number | null {
  if (c.minutosIncl > 1) return c.minutosIncl
  const ext = extraerExtensiones(c.plan)
  return ext ? ext * MIN_POR_EXTENSION : null
}

const fmtMes = (m: string) => {
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const [y, mm] = m.split('-')
  return `${MESES[Number(mm) - 1]} ${y.slice(2)}`
}
const fmtNum = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 0 })

/* ── Motor ───────────────────────────────────────────────────────────── */

export interface EntradaRadar {
  serie: CorteSerie[]
  contactos: number
  tieneObsKam: boolean
  registrosAdopcion: number
  fechaUltimaAdopcion: string | null
  adopcionBaja: number          // productos en bajo/no_aplica
  adopcionTotal: number
  ultimaConversacion: string | null   // ISO
  totalActividades: number
  ticketsAbiertos: number
  ticketReincidente: boolean
  facturacion: number | null
  activoDesde: string | null
  enChurn: boolean
  enAlertaCancelacion: boolean
}

export function evaluarRadar(e: EntradaRadar): RadarCuenta {
  const ind: Indicador[] = []
  const serie = [...e.serie].sort((a, b) => a.mes.localeCompare(b.mes))
  const sinTelemetria = serie.length === 0

  /* ── 1. Tendencia de consumo ── */
  // Se comparan los 3 cortes más recientes contra los 3 más antiguos.
  // Solo se evalúa con ≥6 cortes y una base mínima de 100 min para no
  // convertir el ruido de cuentas muy chicas en una alerta roja.
  let caidaPct: number | null = null
  if (serie.length >= 6) {
    const prim = serie.slice(0, 3).map(c => c.minutosCons)
    const ult  = serie.slice(-3).map(c => c.minutosCons)
    const a = prim.reduce((s, x) => s + x, 0) / 3
    const b = ult.reduce((s, x) => s + x, 0) / 3
    if (a >= 100) caidaPct = ((b - a) / a) * 100
  }
  if (caidaPct !== null) {
    const critica = caidaPct <= -40
    const riesgo  = caidaPct <= -25
    ind.push({
      id: 'tendencia',
      label: 'Tendencia de consumo',
      valor: `${caidaPct > 0 ? '+' : ''}${caidaPct.toFixed(1)}%`,
      nota: '3 cortes recientes vs. 3 antiguos',
      riesgo,
      penalizacion: critica ? 25 : riesgo ? 15 : 0,
    })
  } else if (!sinTelemetria) {
    ind.push({
      id: 'tendencia', label: 'Tendencia de consumo', valor: 'sin base',
      nota: serie.length < 6 ? `solo ${serie.length} corte(s)` : 'volumen muy bajo para evaluar',
      riesgo: false, penalizacion: 0,
    })
  }

  /* ── 2. Capacidad ociosa ── */
  const ultimo = serie[serie.length - 1]
  if (ultimo) {
    const base = minutosBase(ultimo)
    // Un plan ilimitado con 0 minutos consumidos es ambiguo: puede ser que
    // no se capturó el dato. Se marca como sin dato en vez de rojo, para no
    // alarmar sobre cuentas potencialmente sanas.
    if (ultimo.ilimitado && ultimo.minutosCons === 0) {
      ind.push({
        id: 'ociosa', label: 'Capacidad ociosa', valor: 'sin dato',
        nota: 'plan ilimitado sin consumo capturado', riesgo: false, penalizacion: 0,
      })
    } else if (base && base > 0) {
      const uso = (ultimo.minutosCons / base) * 100
      const ocio = 100 - uso
      const riesgo = uso < 40
      ind.push({
        id: 'ociosa',
        label: 'Capacidad ociosa',
        valor: `${ocio.toFixed(1)}%`,
        nota: `usa ${fmtNum(ultimo.minutosCons)} de ${fmtNum(base)} min${ultimo.ilimitado ? ' estimados' : ''}`,
        riesgo,
        penalizacion: uso < 20 ? 15 : riesgo ? 8 : 0,
      })
    }
  }

  /* ── 3. Sobreconsumo previo ── */
  // Estuvo saturada (>100%) y hoy está sub-utilizada: perdió operación.
  if (serie.length >= 4) {
    const pcts = serie.map(c => {
      const b = minutosBase(c)
      return b && b > 0 ? (c.minutosCons / b) * 100 : null
    })
    const antes = pcts.slice(0, -2).filter((x): x is number => x !== null)
    const hoy   = pcts.slice(-2).filter((x): x is number => x !== null)
    if (antes.some(p => p > 100) && hoy.length && Math.max(...hoy) < 70) {
      ind.push({
        id: 'sobreconsumo', label: 'Sobreconsumo previo', valor: 'detectado',
        nota: 'estuvo saturada y hoy le sobra plan', riesgo: true, penalizacion: 10,
      })
    }
  }

  /* ── 4. Migración de canal ── */
  if (serie.length >= 3) {
    const p = serie[0], u = serie[serie.length - 1]
    if (p.pctSalientes !== null && u.pctSalientes !== null) {
      const giro = Math.abs(u.pctSalientes - p.pctSalientes)
      if (giro >= 40) {
        ind.push({
          id: 'canal', label: 'Migración de canal',
          valor: `${p.pctSalientes.toFixed(0)}% → ${u.pctSalientes.toFixed(0)}%`,
          nota: 'cambió su patrón entrante/saliente', riesgo: true, penalizacion: 5,
        })
      }
    }
  }

  /* ── 5. Mapa de decisores ── */
  ind.push({
    id: 'decisores', label: 'Mapa de decisores',
    valor: e.contactos === 0 ? 'sin contactos' : `${e.contactos} contacto${e.contactos !== 1 ? 's' : ''}`,
    nota: e.contactos === 0 ? 'nadie a quién llamar' : e.contactos < 2 ? 'un solo punto de falla' : 'mapa suficiente',
    riesgo: e.contactos < 2,
    penalizacion: e.contactos === 0 ? 12 : e.contactos < 2 ? 7 : 0,
  })

  /* ── 6. Última conversación de valor ── */
  const dias = e.ultimaConversacion
    ? Math.floor((Date.now() - new Date(e.ultimaConversacion).getTime()) / 86400000)
    : null
  ind.push({
    id: 'conversacion', label: 'Última conversación de valor',
    valor: dias === null ? 'nunca' : `${dias} días`,
    nota: dias === null ? 'sin registro en el sistema' : 'seguimiento más reciente',
    riesgo: dias === null || dias > 60,
    penalizacion: dias === null ? 12 : dias > 90 ? 10 : dias > 60 ? 6 : 0,
  })

  /* ── 7. Adopción ── */
  if (e.registrosAdopcion === 0) {
    ind.push({
      id: 'adopcion', label: 'Revisión de adopción', valor: 'sin datos',
      nota: '0 registros · punto ciego', riesgo: true, penalizacion: 10,
    })
  } else {
    const pctBaja = e.adopcionTotal > 0 ? (e.adopcionBaja / e.adopcionTotal) * 100 : 0
    const diasAd = e.fechaUltimaAdopcion
      ? Math.floor((Date.now() - new Date(e.fechaUltimaAdopcion).getTime()) / 86400000)
      : null
    const vieja = diasAd !== null && diasAd > 30
    ind.push({
      id: 'adopcion', label: 'Adopción de producto',
      valor: `${pctBaja.toFixed(0)}% en bajo`,
      nota: diasAd !== null ? `revisada hace ${diasAd} días` : 'sin fecha',
      riesgo: pctBaja >= 30 || vieja,
      penalizacion: pctBaja >= 50 ? 10 : pctBaja >= 30 ? 6 : vieja ? 4 : 0,
    })
  }

  /* ── 8. Tickets ── */
  if (e.ticketsAbiertos > 0 || e.ticketReincidente) {
    ind.push({
      id: 'tickets', label: 'Fricción técnica',
      valor: e.ticketReincidente ? 'reincidente' : `${e.ticketsAbiertos} abierto(s)`,
      nota: e.ticketReincidente ? 'mismo problema reabierto' : 'tickets sin cerrar',
      riesgo: true, penalizacion: e.ticketReincidente ? 10 : 5,
    })
  }

  /* ── 9. Presencia en Churn / Alertas ── */
  if (e.enAlertaCancelacion) {
    ind.push({
      id: 'alerta', label: 'Alerta de cancelación', valor: 'reportada',
      nota: 'aparece en el canal de cancelaciones', riesgo: true, penalizacion: 30,
    })
  } else if (e.enChurn) {
    ind.push({
      id: 'churn', label: 'Reportada en Churn', valor: 'presente',
      nota: 'pendiente, downgrade o suspensión', riesgo: true, penalizacion: 15,
    })
  }

  /* ── 10. Contexto (sin penalización) ── */
  if (ultimo) {
    ind.push({
      id: 'plan', label: 'Plan vigente', valor: ultimo.plan || '—',
      nota: `${serie.length} corte(s) registrados`, riesgo: false, penalizacion: 0,
    })
  }
  if (e.activoDesde) {
    const meses = Math.floor((Date.now() - new Date(e.activoDesde).getTime()) / 2592000000)
    ind.push({
      id: 'antiguedad', label: 'Antigüedad',
      valor: meses >= 12 ? `${Math.floor(meses / 12)}a ${meses % 12}m` : `${meses}m`,
      nota: `cliente desde ${e.activoDesde.slice(0, 7)}`, riesgo: false, penalizacion: 0,
    })
  }
  if (!e.tieneObsKam) {
    ind.push({
      id: 'kam', label: 'Observaciones KAM', valor: 'vacías',
      nota: 'sin contexto documentado', riesgo: true, penalizacion: 5,
    })
  }

  /* ── Score ── */
  const penal = ind.reduce((s, i) => s + i.penalizacion, 0)
  const score = Math.max(0, Math.min(100, 100 - penal))
  const criticas = ind.filter(i => i.riesgo).length

  let nivel: NivelRadar, titulo: string
  if (sinTelemetria && criticas === 0) { nivel = 'sin_datos'; titulo = 'Sin telemetría · evaluación limitada' }
  else if (score >= 85) { nivel = 'grow';     titulo = 'GROW · proteger y detectar expansión' }
  else if (score >= 70) { nivel = 'optimize'; titulo = 'OPTIMIZE · mejorar adopción' }
  else if (score >= 55) { nivel = 'prevent';  titulo = 'PREVENT · intervención preventiva' }
  else if (score >= 40) { nivel = 'recover';  titulo = 'RECOVER · plan de recuperación' }
  else                  { nivel = 'save';     titulo = 'SAVE · riesgo inmediato de cancelación' }

  const partes: string[] = []
  if (caidaPct !== null && caidaPct <= -25) partes.push(`consumo en caída de ${caidaPct.toFixed(0)}%`)
  if (e.contactos === 0) partes.push('sin contacto registrado')
  else if (e.contactos < 2) partes.push('un solo contacto')
  if (dias === null) partes.push('sin conversación registrada')
  else if (dias > 60) partes.push(`${dias} días sin contacto de valor`)
  if (e.registrosAdopcion === 0) partes.push('sin revisión de adopción')
  const resumen = partes.length ? partes.join(' · ') : 'sin señales de riesgo relevantes'

  /* ── Lectura de ATLAS ── */
  let lectura = ''
  if (nivel === 'save' || nivel === 'recover') {
    const silencioso = e.ticketsAbiertos === 0 && !e.ticketReincidente
    lectura = silencioso
      ? 'Silent churn. Cero tickets y cero quejas no significan salud: significan desconexión. El cliente dejó de usar el servicio sin levantar la mano. Cuando el área de finanzas revise este contrato, la defensa dependerá de evidencia que hoy no está capturada.'
      : 'Deterioro con fricción técnica documentada. La combinación de caída de uso y problemas abiertos acelera la salida: el cliente ya tiene motivo y ya tiene evidencia. Intervención inmediata.'
  } else if (nivel === 'prevent') {
    lectura = 'La cuenta todavía no está perdida, pero muestra el patrón inicial: menos uso, menos contacto o menos adopción. Es el momento de mayor retorno por intervención — más tarde el costo sube.'
  } else if (nivel === 'optimize') {
    lectura = 'Cuenta estable con margen de mejora en adopción. El objetivo aquí no es rescatar, es aumentar el valor percibido antes de la próxima renovación.'
  } else if (nivel === 'grow') {
    lectura = 'Cuenta saludable. El trabajo aquí es proteger la relación y detectar oportunidad de expansión, no defender.'
  } else {
    lectura = 'No hay cortes de facturación cruzados para esta cuenta, así que el bloque de uso no aplica. La evaluación se apoya solo en relación, adopción y tickets: la ausencia de telemetría no debe leerse como ausencia de riesgo.'
  }

  return {
    score, nivel, titulo, resumen, serie, indicadores: ind,
    alertasCriticas: criticas, sinTelemetria, lecturaAtlas: lectura,
  }
}

/* ── Las 12 preguntas obligatorias del asesor ────────────────────────── */

export interface PreguntaRadar {
  id: string
  n: string
  texto: string
  tipo: 'opciones' | 'texto' | 'opciones_texto'
  opciones?: { valor: string; label: string; riesgo?: boolean }[]
  ayuda: string
  critica: boolean
}

export const PREGUNTAS_RADAR: PreguntaRadar[] = [
  {
    id: 'valor_negocio', n: '01', critica: true, tipo: 'opciones_texto',
    texto: '¿Qué resultado de negocio obtiene hoy el cliente gracias a Callpicker?',
    ayuda: 'Si no puedes nombrarlo, el cliente tampoco. Describe el resultado concreto, no la funcionalidad.',
    opciones: [
      { valor: 'ventas', label: 'Más ventas' },
      { valor: 'atencion', label: 'Mejor atención' },
      { valor: 'productividad', label: 'Productividad' },
      { valor: 'cobranza', label: 'Cobranza' },
      { valor: 'control', label: 'Control y trazabilidad' },
      { valor: 'automatizacion', label: 'Automatización' },
      { valor: 'no_identificado', label: 'No está identificado', riesgo: true },
    ],
  },
  {
    id: 'pregunta_finanzas', n: '02', critica: true, tipo: 'opciones_texto',
    texto: 'Si Finanzas preguntara mañana "¿por qué seguimos pagando Callpicker?", ¿tenemos respuesta con evidencia?',
    ayuda: 'Cuando el cliente menciona precio, la discusión ya avanzó demasiado. Adjunta la evidencia concreta.',
    opciones: [
      { valor: 'si', label: 'Sí, con datos' },
      { valor: 'parcial', label: 'Parcialmente', riesgo: true },
      { valor: 'no', label: 'No', riesgo: true },
    ],
  },
  {
    id: 'shadow_workflow', n: '03', critica: true, tipo: 'opciones_texto',
    texto: '¿Los usuarios del cliente están operando fuera de Callpicker?',
    ayuda: 'Shadow workflow: el cliente sigue pagando mientras su operación ya migró. No saberlo también es un hallazgo.',
    opciones: [
      { valor: 'no', label: 'No' },
      { valor: 'whatsapp', label: 'WhatsApp directo', riesgo: true },
      { valor: 'personal', label: 'Teléfono personal', riesgo: true },
      { valor: 'otra', label: 'Otra herramienta', riesgo: true },
      { valor: 'no_se', label: 'No lo sé', riesgo: true },
    ],
  },
  {
    id: 'friccion_normalizada', n: '04', critica: true, tipo: 'opciones_texto',
    texto: '¿Existe algún problema técnico que el cliente ya considere "normal"?',
    ayuda: 'Los problemas peligrosos no son los que generan tickets, sino los que el cliente dejó de reportar.',
    opciones: [
      { valor: 'no', label: 'No' },
      { valor: 'si', label: 'Sí', riesgo: true },
      { valor: 'posible', label: 'Posiblemente', riesgo: true },
    ],
  },
  {
    id: 'dependencia', n: '05', critica: false, tipo: 'opciones',
    texto: 'Si mañana cambiara el administrador del cliente, ¿la organización sabría seguir usando Callpicker?',
    ayuda: 'Cuando el champion se va, se va con él la adopción y después la cuenta.',
    opciones: [
      { valor: 'si', label: 'Sí' },
      { valor: 'parcial', label: 'Parcialmente', riesgo: true },
      { valor: 'no', label: 'No', riesgo: true },
    ],
  },
  {
    id: 'champion', n: '06', critica: true, tipo: 'opciones_texto',
    texto: '¿Quién es el Champion y conserva influencia sobre la decisión?',
    ayuda: 'Captura nombre y puesto. Sin nombre, la pregunta no se da por contestada.',
    opciones: [
      { valor: 'si_influye', label: 'Sí conserva influencia' },
      { valor: 'ya_no', label: 'Ya no influye', riesgo: true },
      { valor: 'no_sabemos', label: 'No lo sabemos', riesgo: true },
    ],
  },
  {
    id: 'responsable_economico', n: '07', critica: true, tipo: 'opciones_texto',
    texto: '¿Tenemos relación directa con quien autoriza el gasto?',
    ayuda: 'Se puede tener excelente relación con el usuario operativo y perder la cuenta en una decisión de Compras donde nunca estuvimos.',
    opciones: [
      { valor: 'si', label: 'Sí' },
      { valor: 'no', label: 'No', riesgo: true },
      { valor: 'no_sabemos', label: 'No sabemos quién es', riesgo: true },
    ],
  },
  {
    id: 'cambios_negocio', n: '08', critica: false, tipo: 'opciones_texto',
    texto: '¿Cambió algo relevante en la empresa del cliente en los últimos 90 días?',
    ayuda: 'Indica además si ese cambio aumenta o reduce la relevancia de Callpicker.',
    opciones: [
      { valor: 'nada', label: 'Nada detectado' },
      { valor: 'direccion', label: 'Nueva dirección', riesgo: true },
      { valor: 'ti', label: 'Nuevo responsable de TI', riesgo: true },
      { valor: 'personal', label: 'Reducción de personal', riesgo: true },
      { valor: 'crm', label: 'Cambio de CRM', riesgo: true },
      { valor: 'mensajeria', label: 'Migración a mensajería', riesgo: true },
      { valor: 'fusion', label: 'Fusión o adquisición', riesgo: true },
    ],
  },
  {
    id: 'competencia', n: '09', critica: false, tipo: 'opciones_texto',
    texto: '¿Hay señales de que el cliente esté evaluando otra plataforma?',
    ayuda: 'Si hay señal: indica qué atributo compara y si conocemos nuestra vulnerabilidad ahí.',
    opciones: [
      { valor: 'ninguna', label: 'Ninguna' },
      { valor: 'debiles', label: 'Señales débiles', riesgo: true },
      { valor: 'claras', label: 'Señales claras', riesgo: true },
    ],
  },
  {
    id: 'senal_reduccion', n: '10', critica: true, tipo: 'opciones_texto',
    texto: '¿Alguna conducta reciente sugiere una reducción futura?',
    ayuda: 'Antes de aceptar un downgrade hay que responder si existe otra forma de aprovechar la capacidad contratada.',
    opciones: [
      { valor: 'ninguna', label: 'Ninguna' },
      { valor: 'usuarios', label: 'Eliminar usuarios o extensiones', riesgo: true },
      { valor: 'planes', label: 'Preguntó por planes menores', riesgo: true },
      { valor: 'permanencia', label: 'Preguntó por permanencia', riesgo: true },
      { valor: 'presupuesto', label: 'Mencionó recorte de presupuesto', riesgo: true },
    ],
  },
  {
    id: 'predictiva', n: '11', critica: true, tipo: 'opciones_texto',
    texto: 'Si hoy tuviera que renovar, ¿tenemos evidencia de que renovaría en las mismas condiciones?',
    ayuda: 'Adjunta la evidencia que respalda tu respuesta. Sin texto, no se guarda.',
    opciones: [
      { valor: 'si', label: 'Sí' },
      { valor: 'probable_si', label: 'Probablemente sí' },
      { valor: 'incertidumbre', label: 'Hay incertidumbre', riesgo: true },
      { valor: 'probable_downgrade', label: 'Probablemente haría downgrade', riesgo: true },
      { valor: 'riesgo_cancelacion', label: 'Riesgo de cancelación', riesgo: true },
    ],
  },
  {
    id: 'accion', n: '12', critica: true, tipo: 'opciones_texto',
    texto: '¿Qué haremos en los próximos 7 días para reducir el riesgo de esta cuenta?',
    ayuda: 'Indica responsable, fecha compromiso y cómo sabremos que funcionó.',
    opciones: [
      { valor: 'adopcion', label: 'Sesión de adopción' },
      { valor: 'capacitacion', label: 'Capacitación' },
      { valor: 'health_check', label: 'Health Check técnico' },
      { valor: 'integraciones', label: 'Revisión de integraciones' },
      { valor: 'ejecutiva', label: 'Sesión ejecutiva' },
      { valor: 'champion', label: 'Identificar nuevo Champion' },
      { valor: 'resultados', label: 'Presentar resultados' },
      { valor: 'escalamiento', label: 'Escalamiento' },
    ],
  },
]

export { fmtMes }
