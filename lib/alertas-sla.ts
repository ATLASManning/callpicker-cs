import {
  CATALOGO, LO_QUE_LA_APAGA, type Condicion, type TipoAlerta,
} from '@/lib/alertas'
import { diasHabilesEntre, sumaDiasHabiles, type Dia } from '@/lib/dias-habiles'
import { textoFecha } from '@/lib/fecha-local'

/**
 * lib/alertas-sla.ts — EL COMPROMISO DE ATENCIÓN DE UNA ALERTA
 *
 * Aquí vive lo que SE DECIDE: qué severidad le toca a un compromiso, para
 * cuándo vence, de qué color está hoy y qué evidencia lo cierra. Nada de esto
 * habla con la base: todo recibe la configuración y el calendario como
 * argumentos, para que `scripts/verifica-sla.mjs` pueda correr los doce casos
 * del encargo sin Supabase. La parte que escribe está en
 * `lib/alertas-sla-sync.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LAS DOS COSAS QUE NO SON LO MISMO, Y QUE DECIDEN TODO EL DISEÑO
 * ═════════════════════════════════════════════════════════════════════════
 *
 * ATENDER una alerta es nuestro trabajo: llamar, documentar con quién se habló,
 * dejar un próximo paso con fecha. Eso lo controla el asesor y por eso se le
 * puede poner un reloj.
 *
 * APAGAR una alerta casi nunca es nuestro trabajo. `LO_QUE_LA_APAGA` lo tiene
 * medido condición por condición: el consumo lo mueve el cliente usando el
 * servicio, la medición la mueve Ingeniería, la facturación la mueve el corte
 * siguiente del GRC, y la atención telefónica la mueve el enrutamiento del
 * propio cliente.
 *
 * Si el reloj midiera el apagado, sobre esas condiciones sería imposible de
 * parar — y en este proyecto lo que se percibe como imposible se abandona: el
 * Radar lleva 0 de 192 completo y las auditorías dejaron 383 acciones que nadie
 * siguió. Y si cualquier captura apagara la alerta, estaríamos reconstruyendo
 * lo que dirección retiró el 8 oct 2026 con el generador SAC: un sistema donde
 * registrar trabajo apaga avisos sin que la situación del cliente haya
 * cambiado.
 *
 * Así que el compromiso mide la ATENCIÓN, la alerta sigue encendida hasta que
 * el detector deje de verla, y la pantalla dice las dos cosas en la misma
 * tarjeta. `frasesDeCierre()` compone exactamente esas dos frases para que
 * ninguna pantalla improvise la segunda.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POR QUÉ EL PLAZO VA POR CONDICIÓN Y NO POR «SITUACIÓN»
 * ═════════════════════════════════════════════════════════════════════════
 *
 * El encargo da la tabla de plazos por situación —«se está yendo», «se está
 * apagando»…—, y la situación de `lib/alertas-veredicto.ts` es UNA por cuenta:
 * `veredictoDe` devuelve la primera que aplica. Las alertas son VARIAS por
 * cuenta. Con la situación como llave, una cuenta con cinco alertas tendría una
 * sola fecha compromiso y las otras cuatro ninguna.
 *
 * La condición —el grupo de escalamiento de `lib/alertas.ts`— es justo la llave
 * del episodio, que es de donde cuelga el compromiso. La correspondencia con la
 * tabla del encargo está escrita en `scripts/migracion-alertas-sla.sql`, fila
 * por fila, incluidas las dos filas del encargo que HOY NO TIENEN ALERTA («hay
 * que mostrarle» y «falta su auditoría») y por qué.
 */

export type SeveridadSla = 'critica' | 'alta' | 'media' | 'baja'

export type EstadoSla =
  | 'nueva'
  | 'en_proceso'
  | 'atendida_pendiente_validacion'
  | 'cerrada'
  | 'escalada'
  | 'reabierta'
  | 'bloqueada'

export type CierreSla =
  | 'atendida'
  | 'resuelta_sin_intervencion'
  | 'baja_autorizada'
  | 'suspendida'

export type EvidenciaTipo = 'seguimiento' | 'reunion' | 'edicion' | 'auditoria'

/** De menor a mayor. El orden ES la escala: subir un nivel es moverse a la derecha. */
export const ESCALA_SEVERIDAD: readonly SeveridadSla[] = ['baja', 'media', 'alta', 'critica']

export interface FilaConfig {
  condicion: Condicion
  severidad_base: SeveridadSla
  plazo_dias: number
  evidencia: EvidenciaTipo[]
  porque: string
}

/** Los parámetros de `sla_parametros`, ya indexados. */
export type Parametros = Readonly<Record<string, number>>

/**
 * Valores con los que se razona cuando `sla_parametros` no trae una clave.
 *
 * NO es un espejo de la tabla: es el PISO de cada parámetro, y existe para que
 * una clave que alguien borre no deje una validación en `undefined` —que en JS
 * compara falso contra todo y deja pasar cualquier texto—. La tabla manda
 * siempre que traiga la clave; esto sólo evita que la ausencia abra la puerta.
 */
const PISO: Readonly<Record<string, number>> = {
  top_pct_cartera: 20,
  reprogramaciones_asesor: 1,
  reprogramacion_dias: 2,
  reprogramacion_motivo_min: 20,
  intentos_sin_respuesta_escala: 3,
  rojo_intenso_dias: 3,
  resumen_min: 80,
  minuta_min: 120,
  meta_en_tiempo: 90,
  meta_criticas_vencidas: 0,
}

export function parametro(p: Parametros, clave: keyof typeof PISO): number {
  const v = p[clave as string]
  return typeof v === 'number' && Number.isFinite(v) ? v : PISO[clave]
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SEVERIDAD: LA DEL CATÁLOGO, MÁS LOS AJUSTES DEL ENCARGO
 * ═══════════════════════════════════════════════════════════════════════════ */

export type Ajuste = 'top_cartera' | 'ticket_abierto' | 'sin_calendario'

export const ETIQUETA_AJUSTE: Record<Ajuste, string> = {
  top_cartera:    'Está en el top de facturación de su cartera',
  ticket_abierto: 'Tiene un ticket de falla abierto',
  sin_calendario: 'El calendario de días inhábiles no se pudo leer',
}

export function sube(s: SeveridadSla, niveles = 1): SeveridadSla {
  const i = ESCALA_SEVERIDAD.indexOf(s)
  const j = Math.min(ESCALA_SEVERIDAD.length - 1, (i < 0 ? 0 : i) + niveles)
  return ESCALA_SEVERIDAD[j]
}

/**
 * El plazo de cada severidad, DERIVADO de la configuración.
 *
 * Un ajuste sube la severidad, y entonces hace falta saber qué plazo le
 * corresponde a la severidad nueva. Se toma el MÍNIMO de los plazos declarados
 * para esa severidad, a propósito: un ajuste tiene que apretar el plazo —es lo
 * que pide el encargo— y tomar el máximo podría ALARGARLO. Una cuenta TOP con
 * una alerta de contacto (alta, 3 días) pasa a crítica y a 1 día, no a 3.
 *
 * `scripts/verifica-sla.mjs` comprueba que el mapa resultante sea monótono
 * —crítica <= alta <= media <= baja—, porque una fila de configuración con un
 * plazo fuera de orden haría que subir la severidad diera MÁS días sin que nada
 * fallara.
 */
export function plazoPorSeveridad(
  config: readonly FilaConfig[],
): Partial<Record<SeveridadSla, number>> {
  const m: Partial<Record<SeveridadSla, number>> = {}
  for (const f of config) {
    const prev = m[f.severidad_base]
    if (prev === undefined || f.plazo_dias < prev) m[f.severidad_base] = f.plazo_dias
  }
  return m
}

export interface Plazo {
  severidadBase: SeveridadSla
  severidad: SeveridadSla
  ajustes: Ajuste[]
  dias: number
  /** `null` si la condición no tiene fila en `sla_config`: no se inventa plazo. */
  sinConfigurar: boolean
}

/**
 * Qué severidad y qué plazo le toca a una alerta.
 *
 * Devuelve `sinConfigurar` cuando la condición no está en `sla_config`. NO se
 * cae a un valor por omisión: una condición sin plazo configurado es una
 * decisión que nadie ha tomado, y ponerle cinco días por nuestra cuenta es
 * inventarse una política de la casa. El generador no crea compromiso y la
 * pantalla lo dice con palabras.
 */
export function plazoDe(
  condicion: Condicion,
  contexto: { esTop: boolean; ticketAbierto: boolean },
  config: readonly FilaConfig[],
): Plazo {
  const fila = config.find(f => f.condicion === condicion)
  if (!fila) {
    return {
      severidadBase: 'media', severidad: 'media', ajustes: [], dias: 0,
      sinConfigurar: true,
    }
  }
  const ajustes: Ajuste[] = []
  if (contexto.esTop) ajustes.push('top_cartera')
  if (contexto.ticketAbierto) ajustes.push('ticket_abierto')

  const severidad = sube(fila.severidad_base, ajustes.length)
  const mapa = plazoPorSeveridad(config)
  /* Si la severidad nueva no tiene plazo declarado —porque ninguna condición
     nace con ella— se aprieta un día desde el plazo propio, con piso en 1. Es
     lo que pide el encargo: «plazo más corto, mínimo 1 día hábil». */
  const porSeveridad = mapa[severidad]
  const dias = ajustes.length === 0
    ? fila.plazo_dias
    : Math.max(1, porSeveridad ?? fila.plazo_dias - ajustes.length)

  return {
    severidadBase: fila.severidad_base, severidad, ajustes,
    dias: Math.max(1, dias), sinConfigurar: false,
  }
}

/** La fecha compromiso. `generada` es el día cero y no cuenta como plazo. */
export function fechaLimiteDe(
  generada: Dia, dias: number, inhabiles: ReadonlySet<Dia>,
): Dia {
  return sumaDiasHabiles(generada, dias, inhabiles)
}

/* ═══════════════════════════════════════════════════════════════════════════
 * EL SEMÁFORO — SE CALCULA AL LEER, NUNCA SE GUARDA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Guardarlo exigiría que algo lo refrescara cada día, y el día que el cron se
 * salte una corrida —ya pasó, y se publicó «nuevos: 4, falla: null» durante un
 * día entero mientras cuatro episodios se rechazaban en silencio— el tablero
 * diría «en tiempo» sobre una alerta vencida sin que nada fallara.
 *
 * EL COLOR NUNCA ES EL ÚNICO INDICADOR. Cada nivel trae su `etiqueta` en
 * palabras —«Vence hoy», «Vencida hace 4 días hábiles»— y la pantalla está
 * obligada a imprimirla: con un daltonismo rojo-verde, el rojo intenso y el
 * verde se parecen, y lo que no se puede confundir es el texto.
 */

export type NivelSemaforo =
  | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'rojo_intenso'
  | 'atendida' | 'cerrada' | 'bloqueada'

export interface Semaforo {
  nivel: NivelSemaforo
  /** La frase que va JUNTO al color, siempre. */
  etiqueta: string
  /** Días hábiles que faltan (positivo) o que se pasó (negativo). */
  habiles: number
  /** `true` si está vencida hoy. */
  vencida: boolean
  /** Si ya se atendió: si se hizo dentro del plazo. `null` si no se atendió. */
  enTiempo: boolean | null
  /** Para el orden obligatorio de la cola. Menor = más arriba. */
  orden: number
  /** No se puede ocultar ni compactar. */
  fijada: boolean
}

const ORDEN: Record<NivelSemaforo, number> = {
  rojo_intenso: 0, rojo: 1, naranja: 2, amarillo: 3, verde: 4,
  bloqueada: 5, atendida: 6, cerrada: 7,
}

function palabras(d: Dia): string {
  return textoFecha(d) ?? d
}

function plural(n: number): string {
  return `${n} día${n === 1 ? '' : 's'} hábil${n === 1 ? '' : 'es'}`
}

export function semaforoDe(
  c: {
    estado: EstadoSla
    severidad: SeveridadSla
    fechaLimite: Dia
    fechaAtendida?: Dia | null
  },
  hoy: Dia,
  inhabiles: ReadonlySet<Dia>,
  parametros: Parametros = {},
): Semaforo {
  const base = { enTiempo: null as boolean | null, fijada: false }

  if (c.estado === 'cerrada') {
    /* La etiqueta NO dice «Cerrada» a secas, por lo mismo que la de naranja no
       dice «Vence hoy»: la pastilla ya lo dice, y repetirlo gasta la única
       línea que puede decir ALGO. Y aquí lo que puede decir importa, porque hay
       DOS maneras de cerrarse y no significan lo mismo:
         · con `fechaAtendida` → alguien la atendió y dejó evidencia;
         · sin ella → se cerró porque la condición dejó de verse en la fuente,
           o sea que el cliente dejó de estar en riesgo SIN que nadie hiciera
           nada. Leer eso como trabajo hecho es exactamente lo que la métrica
           «resueltas sin intervención» existe para no dejar pasar. */
    return { ...base, nivel: 'cerrada', habiles: 0,
             etiqueta: c.fechaAtendida
               ? `Cerrada el ${palabras(c.fechaAtendida)}`
               : 'Cerrada sin atención registrada: la condición dejó de verse',
             vencida: false, orden: ORDEN.cerrada }
  }
  /* Bloqueada no corre contra el asesor: `sin_consumo_medible` y `sin_importe`
     son de Ingeniería, y las nueve alertas de mayor prioridad del tablero
     fueron un día justamente ésas. Un reloj sobre trabajo que no puede hacer
     es cómo se entrena a no mirar el tablero. Sigue listada, con su dueño. */
  if (c.estado === 'bloqueada') {
    return { ...base, nivel: 'bloqueada',
             etiqueta: 'No la puede cerrar el ejecutivo', habiles: 0,
             vencida: false, orden: ORDEN.bloqueada }
  }

  if (c.fechaAtendida) {
    const tarde = c.fechaAtendida > c.fechaLimite
    return {
      nivel: 'atendida',
      etiqueta: tarde
        ? `Atendida el ${palabras(c.fechaAtendida)}, fuera de plazo`
        : `Atendida el ${palabras(c.fechaAtendida)}, en tiempo`,
      habiles: 0, vencida: false, enTiempo: !tarde,
      orden: ORDEN.atendida, fijada: false,
    }
  }

  const topeIntenso = parametro(parametros, 'rojo_intenso_dias')

  if (hoy > c.fechaLimite) {
    const pasados = diasHabilesEntre(c.fechaLimite, hoy, inhabiles)
    /* ROJO INTENSO por cualquiera de las dos vías del encargo: tres días
       hábiles de retraso, o una crítica vencida sin importar cuántos. Un
       retraso de cero días hábiles —venció el viernes y hoy es sábado— ya es
       vencida: se dice con la fecha, no con un «hace 0 días». */
    const intenso = pasados >= topeIntenso || c.severidad === 'critica'
    return {
      ...base,
      nivel: intenso ? 'rojo_intenso' : 'rojo',
      etiqueta: pasados > 0
        ? `Vencida hace ${plural(pasados)}`
        : `Vencida el ${palabras(c.fechaLimite)}`,
      habiles: -pasados, vencida: true,
      orden: intenso ? ORDEN.rojo_intenso : ORDEN.rojo,
      fijada: intenso,
    }
  }

  if (hoy === c.fechaLimite) {
    /* LLEVA LA FECHA, y no es adorno. `ETIQUETA_NIVEL.naranja` ya dice «Vence
       hoy»: si la etiqueta dijera eso mismo, este sería el ÚNICO nivel cuya
       segunda línea repite la primera en vez de decir cuándo. Se vio generando
       el correo y mirándolo —«Vence hoy / Vence hoy», uno encima del otro—, no
       midiendo: ninguna medición de contraste acusa una frase duplicada. */
    return { ...base, nivel: 'naranja',
             etiqueta: `Vence HOY, ${palabras(c.fechaLimite)}`, habiles: 0,
             vencida: false, orden: ORDEN.naranja }
  }

  const faltan = diasHabilesEntre(hoy, c.fechaLimite, inhabiles)
  if (faltan <= 2) {
    return {
      ...base, nivel: 'amarillo',
      etiqueta: faltan === 0
        /* Puede pasar: hoy es viernes, vence el domingo. Entre los dos no hay
           ningún día hábil, así que en la práctica vence hoy. */
        ? `Vence el ${palabras(c.fechaLimite)}, sin día hábil de margen`
        : `Vence en ${plural(faltan)}`,
      habiles: faltan, vencida: false, orden: ORDEN.amarillo,
    }
  }
  return {
    ...base, nivel: 'verde', etiqueta: `Vence en ${plural(faltan)}`,
    habiles: faltan, vencida: false, orden: ORDEN.verde,
  }
}

/**
 * CUÁNTOS DÍAS HÁBILES TARDE se atendió. Cero si fue en plazo o antes.
 *
 * Existe para que el tablero de cumplimiento no cuente el retraso en días de
 * CALENDARIO, que es lo que saldría de restar dos fechas: una alerta que vencía
 * el viernes y se atendió el lunes llevaría tres días de retraso cuando el
 * equipo no tuvo ni uno para atenderla. El plazo se cuenta en hábiles, así que
 * el incumplimiento también. Es la misma regla por los dos lados.
 */
export function diasDeRetraso(
  limite: Dia,
  atendida: Dia,
  inhabiles: ReadonlySet<Dia>,
): number {
  if (atendida <= limite) return 0
  return diasHabilesEntre(limite, atendida, inhabiles)
}

export const ETIQUETA_NIVEL: Record<NivelSemaforo, string> = {
  rojo_intenso: 'INCUMPLIDA',
  rojo:         'Vencida',
  naranja:      'Vence hoy',
  amarillo:     'Por vencer',
  verde:        'En tiempo',
  bloqueada:    'Bloqueada',
  atendida:     'Atendida',
  cerrada:      'Cerrada',
}

/**
 * El orden de la cola, que es obligatorio: rojo intenso, rojo, naranja,
 * amarillo, verde; y dentro de cada grupo, por dinero en riesgo descendente.
 *
 * El dinero entra CRUDO aquí y no por raíz cuadrada como en `prioridad()` de
 * `lib/alertas.ts`, y la diferencia es a propósito: aquélla ordena QUÉ
 * ALERTA mirar entre severidades distintas, y ahí la raíz evita que cinco
 * cuentas grandes aplasten a treinta chicas. Esto ordena DENTRO de un mismo
 * color de vencimiento, donde la urgencia ya está igualada y lo único que
 * queda para desempatar es cuánto se pierde.
 */
export function ordenaCola<T extends { semaforo: Semaforo; mrr: number | null }>(
  filas: readonly T[],
): T[] {
  return [...filas].sort((a, b) =>
    a.semaforo.orden - b.semaforo.orden
    || (b.mrr ?? 0) - (a.mrr ?? 0))
}

/* ═══════════════════════════════════════════════════════════════════════════
 * QUÉ HAY QUE HACER, Y POR QUÉ SE GENERÓ
 * ═══════════════════════════════════════════════════════════════════════════ */

export const ETIQUETA_EVIDENCIA: Record<EvidenciaTipo, string> = {
  seguimiento: 'un seguimiento por un canal real',
  reunion:     'una reunión con el cliente',
  edicion:     'una edición de la ficha que cambie algo',
  auditoria:   'una auditoría cerrada',
}

/**
 * La acción sugerida: concreta, con verbo, objetivo y resultado esperado.
 *
 * El guion del catálogo ya está escrito así —«Llamar al contacto principal,
 * confirmar la causa y registrar seguimiento»— y es lo que hay que usar en vez
 * de redactar uno nuevo: el catálogo es el sitio donde esas frases se discuten
 * cuenta por cuenta, y una segunda redacción aquí se desalinearía de la que el
 * asesor ya conoce.
 *
 * Lo que esta función añade es el COMPROMISO: para cuándo, y con qué se cierra.
 * Nada genérico: si una pantalla imprimiera «dar seguimiento», no diría ni qué
 * se busca ni cuándo se sabrá si funcionó.
 */
export function accionSugerida(
  tipo: TipoAlerta,
  limite: Dia,
  evidencia: readonly EvidenciaTipo[],
): string {
  const guion = CATALOGO[tipo]?.accion ?? 'Atender la alerta.'
  const con = evidencia.map(e => ETIQUETA_EVIDENCIA[e]).join(' o ')
  return `${guion} Antes del ${palabras(limite)}, registrar ${con} `
       + `con el resultado y el próximo paso con fecha.`
}

/**
 * Por qué se generó, con dos o tres señales CONCRETAS.
 *
 * Todo sale del episodio, que ya guarda la evidencia con la que la alerta
 * saltó. No se recalcula nada: recalcular aquí daría una segunda cifra del
 * mismo hecho —el detector mira el pico de cinco cortes y una lectura nueva
 * miraría el último— y dos porcentajes distintos en la misma tarjeta es
 * exactamente el defecto que `hallazgosDe` tuvo que corregir en 142 fichas.
 */
export function porQueSeGenero(ep: {
  evidencia_actual?: string | null
  condicion_desde?: string | null
  abierto_en: string
  severidad_peor?: string | null
  severidad_actual?: string | null
  recurrencia?: number | null
}, hoy: Dia): string[] {
  const senales: string[] = []
  const ev = ep.evidencia_actual?.trim()
  if (ev) senales.push(ev)

  const desde = ep.condicion_desde ?? ep.abierto_en
  const dias = Math.max(0, Math.round(
    (Date.UTC(+hoy.slice(0, 4), +hoy.slice(5, 7) - 1, +hoy.slice(8, 10))
     - Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10)))
    / 86_400_000))
  senales.push(`Abierta hace ${dias} día${dias === 1 ? '' : 's'} (desde el ${palabras(desde)})`)

  if (ep.severidad_peor && ep.severidad_actual
      && ep.severidad_peor !== ep.severidad_actual) {
    senales.push(`Llegó a severidad ${ep.severidad_peor} y hoy está en ${ep.severidad_actual}`)
  }
  const veces = ep.recurrencia ?? 0
  if (veces > 0) {
    senales.push(`Ha vuelto ${veces} ${veces === 1 ? 'vez' : 'veces'} en esta cuenta`)
  }
  return senales.slice(0, 3)
}

/**
 * LAS DOS FRASES DEL CIERRE, que van juntas o no van.
 *
 * La primera dice qué cierra la atención; la segunda, que eso NO apaga la
 * alerta y qué sí. Publicar sólo la primera es prometer que capturar resuelve
 * —y es justo lo que dirección retiró el 8 oct 2026—. Publicar sólo la segunda
 * es decirle al asesor que no hay nada que hacer.
 */
export function frasesDeCierre(
  condicion: Condicion,
  evidencia: readonly EvidenciaTipo[],
): { atencion: string; alerta: string } {
  const con = evidencia.map(e => ETIQUETA_EVIDENCIA[e]).join(' o ')
  return {
    atencion: `Tu atención se cierra con ${con}, registrada en esta misma cuenta.`,
    alerta: `Eso NO apaga la alerta: la apaga `
          + `${LO_QUE_LA_APAGA[condicion] ?? 'que cambie la situación del cliente'}. `
          + `Hasta entonces sigue en la lista, ya atendida.`,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LA EVIDENCIA — SE VALIDA EN EL SERVIDOR, NO EN EL FORMULARIO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Un formulario valida para ayudar; el servidor valida para que la regla
 * exista. Las dos razones por las que esto vive aquí y lo llama la API:
 *
 *   · `/api/seguimientos` acepta un POST desde cualquier cliente. Sin la
 *     comprobación del lado del servidor, un resumen de tres letras cierra una
 *     alerta crítica y el tablero de cumplimiento no se enteraría nunca.
 *   · `next.config.js` lleva `ignoreBuildErrors`, así que un error de tipos no
 *     rompe el build: rompe el navegador. Una validación que sólo vive en el
 *     componente se puede caer sin que nada falle en el despliegue.
 */

export interface EvidenciaSeguimiento {
  tipo?: string | null
  descripcion?: string | null
  resultado?: string | null
  contacto_nombre?: string | null
  contacto_puesto?: string | null
  proximo_paso?: string | null
  proximo_paso_fecha?: string | null
  fecha?: string | null
}

export interface EvidenciaReunion {
  fecha?: string | null
  participantes?: string | null
  resumen?: string | null
  acuerdos?: string | null
  proximos_pasos?: string | null
}

export interface Veredicto {
  ok: boolean
  /** Qué falta, en frases que se le pueden mostrar a quien capturó. */
  faltan: string[]
}

const vacio = (v: unknown) => String(v ?? '').trim() === ''
const largo = (v: unknown) => String(v ?? '').trim().length

/**
 * ¿Sirve este seguimiento para cerrar la atención de una alerta?
 *
 * `canales` es el conjunto de tipos que SON contacto con el cliente, y se
 * recibe en vez de importarse para que la prueba no tenga que arrastrar
 * `lib/contacto-cuenta.ts`. Lo pasa la API desde `CANALES_CONTACTO`, que es la
 * única definición: una nota interna no cierra nada —escribir sobre una cuenta
 * no es haber hablado con ella— y eso ya está decidido en ese archivo.
 */
export function validaSeguimiento(
  s: EvidenciaSeguimiento,
  canales: ReadonlySet<string>,
  parametros: Parametros = {},
): Veredicto {
  const faltan: string[] = []
  const tipo = String(s.tipo ?? '').toLowerCase()
  const min = parametro(parametros, 'resumen_min')

  if (!canales.has(tipo)) {
    faltan.push('El tipo tiene que ser un canal real —llamada, WhatsApp, email, '
              + 'reunión—. Escribir una nota sobre la cuenta no es haber hablado '
              + 'con ella.')
  }
  if (vacio(s.contacto_nombre)) faltan.push('Falta el nombre de la persona con quien se habló.')
  if (vacio(s.contacto_puesto)) faltan.push('Falta el puesto de esa persona.')
  if (largo(s.descripcion) < min) {
    faltan.push(`El resumen tiene ${largo(s.descripcion)} caracteres y hacen falta `
              + `al menos ${min}: hay que poder reconstruir la conversación sin llamar a nadie.`)
  }
  if (vacio(s.resultado) || String(s.resultado) === 'pendiente') {
    faltan.push('Falta el resultado: resuelto, en proceso, sin respuesta o riesgo confirmado.')
  }
  if (vacio(s.proximo_paso)) faltan.push('Falta el próximo paso.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s.proximo_paso_fecha ?? ''))) {
    faltan.push('Falta la fecha del próximo paso.')
  }
  return { ok: faltan.length === 0, faltan }
}

/**
 * ¿Sirve esta reunión?
 *
 * OJO con «responsable»: el encargo pide «acuerdos y responsable», y
 * `reuniones` NO tiene columna de responsable —sus campos son `participantes`,
 * `resumen`, `acuerdos` y `proximos_pasos`—. Así que se exigen los acuerdos Y
 * los próximos pasos, y el responsable va dentro del texto. Se dice aquí en vez
 * de validar una columna que no existe: una validación sobre un campo
 * inexistente pasa siempre.
 */
export function validaReunion(
  r: EvidenciaReunion,
  parametros: Parametros = {},
): Veredicto {
  const faltan: string[] = []
  const min = parametro(parametros, 'minuta_min')
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(r.fecha ?? ''))) faltan.push('Falta la fecha de la reunión.')
  if (vacio(r.participantes)) faltan.push('Faltan los asistentes.')
  if (largo(r.resumen) < min) {
    faltan.push(`La minuta tiene ${largo(r.resumen)} caracteres y hacen falta al menos ${min}.`)
  }
  if (vacio(r.acuerdos)) faltan.push('Faltan los acuerdos, con su responsable dentro del texto.')
  if (vacio(r.proximos_pasos)) faltan.push('Faltan los próximos pasos.')
  return { ok: faltan.length === 0, faltan }
}

/**
 * QUÉ CAMBIÓ DE VERDAD — el diff que convierte una edición en evidencia.
 *
 * El encargo pide que «editar sin cambiar nada no cuente», y eso obliga a
 * comparar, no a confiar en que el formulario mandó sólo lo que tocó: los
 * formularios de este tablero mandan la ficha entera, así que `Object.keys(body)`
 * daría treinta campos «cambiados» en cada guardado y toda edición cerraría
 * cualquier alerta.
 *
 * LA COMPARACIÓN NORMALIZA, y cada regla tapa una falsa edición concreta:
 *
 *   · `null`, `undefined` y `''` son lo mismo. Un `<input>` vacío llega como
 *     `''` y en Postgres estaba `NULL`; sin esto, abrir y guardar sin tocar nada
 *     reportaría cambio en todos los campos vacíos de la ficha.
 *   · Los números se comparan como números. `"23480"` y `23480` son el mismo
 *     MRR; un `<input type="number">` manda texto.
 *   · Las fechas se comparan por sus diez primeros caracteres. Supabase devuelve
 *     `2026-11-25T00:00:00+00:00` donde el formulario manda `2026-11-25`.
 *
 * Y sólo se miran las claves que VIENEN en la edición: lo que el cuerpo no trae
 * no se tocó, y meterlo como «cambió a vacío» sería inventar una gestión.
 */
export function diffDeCampos(
  antes: Record<string, unknown> | null | undefined,
  despues: Record<string, unknown> | null | undefined,
): Record<string, { antes: unknown; despues: unknown }> {
  const diff: Record<string, { antes: unknown; despues: unknown }> = {}
  if (!despues) return diff
  const a = antes ?? {}

  for (const clave of Object.keys(despues)) {
    const vA = a[clave]
    const vD = despues[clave]

    const textoA = String(vA ?? '').trim()
    const textoD = String(vD ?? '').trim()
    if (textoA === textoD) continue

    /* Números: `"0"` y `0`, `"23480.00"` y `23480`. */
    const numA = Number(textoA)
    const numD = Number(textoD)
    if (textoA !== '' && textoD !== ''
        && Number.isFinite(numA) && Number.isFinite(numD)
        && numA === numD) continue

    /* Fechas con y sin hora. */
    if (/^\d{4}-\d{2}-\d{2}/.test(textoA) && /^\d{4}-\d{2}-\d{2}/.test(textoD)
        && textoA.slice(0, 10) === textoD.slice(0, 10)) continue

    diff[clave] = { antes: vA ?? null, despues: vD ?? null }
  }
  return diff
}

/** ¿Sirve esta edición? Un diff vacío no es una edición. */
export function validaEdicion(diff: unknown): Veredicto {
  const ok = !!diff && typeof diff === 'object' && !Array.isArray(diff)
          && Object.keys(diff as object).length > 0
  return {
    ok,
    faltan: ok ? [] : ['La edición no cambió ningún campo. Guardar sin cambiar nada '
                     + 'no documenta una gestión.'],
  }
}

/**
 * LA AUDITORÍA NO SE PUEDE VALIDAR HOY, y se dice en vez de aprobarla.
 *
 * Las auditorías de este tablero no son filas de Supabase: son 46 expedientes
 * en `app/auditoria/registry.ts`, o sea código desplegado. No hay nada que
 * consultar para saber si una auditoría está CERRADA —que es lo que el encargo
 * pide comprobar—, así que esta evidencia no puede cerrar una atención.
 *
 * Devolver `ok: true` sería lo peor: un verificador que concluye éxito por
 * defecto es peor que no tenerlo.
 */
export function validaAuditoria(): Veredicto {
  return {
    ok: false,
    faltan: ['La auditoría no se puede usar como evidencia todavía: los '
           + 'expedientes viven en código (app/auditoria/registry.ts), no en '
           + 'una tabla, así que no hay forma de comprobar que esté cerrada. '
           + 'Cerrar la atención con un seguimiento o una reunión.'],
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * QUÉ HACE EL RESULTADO DE LA GESTIÓN
 * ═══════════════════════════════════════════════════════════════════════════ */

export type Efecto = 'cierra' | 'reintento' | 'riesgo_confirmado'

/**
 * `sin_respuesta` NO CIERRA. Es la regla que más valor tiene de todo el
 * encargo, y el caso que la justifica está documentado: Biolaboratorio Sadat
 * tuvo cuatro intentos fallidos seguidos entre el 4 y el 25 de julio, su propia
 * asesora escribió «alto riesgo de descontinuación», y el 6 de octubre el
 * cliente pidió la baja. Si «llamé y no contestaron» cerrara la alerta, esa
 * cuenta habría salido del tablero cuatro veces.
 *
 * Al tercer intento escala, porque a esas alturas el problema ya no es el
 * seguimiento: es que no hay interlocutor, y eso se resuelve buscando a otra
 * persona por otra vía —el firmante de la factura, cobranza, el dominio del
 * correo—, no marcando el mismo número una quinta vez.
 *
 * `riesgo_confirmado` cierra esta atención y no necesita que nadie fabrique una
 * alerta nueva: al escribirse en el seguimiento, la capa cualitativa
 * (`lib/senal-escrita.ts`) lo detecta en la corrida siguiente y abre un
 * episodio de condición `escrito` —`riesgo_escrito` o `baja_declarada`, las dos
 * críticas— que trae su propio compromiso de UN día hábil. Crear aquí una
 * alerta a mano habría sido un episodio sin condición detrás, y la primera
 * corrida completa lo habría cerrado como «remitió»: un compromiso crítico
 * desaparecido en silencio.
 */
export function efectoDeResultado(resultado: string | null | undefined): Efecto {
  const r = String(resultado ?? '').toLowerCase()
  if (r === 'sin_respuesta') return 'reintento'
  if (r === 'riesgo_confirmado' || r === 'cancelacion_confirmada') return 'riesgo_confirmado'
  return 'cierra'
}

/** El resultado que declara que el cliente ya no quiere seguir. */
export const RESULTADO_RIESGO_CONFIRMADO = 'riesgo_confirmado'

/**
 * El límite del reintento tras un «sin respuesta»: un día hábil.
 *
 * NO toca `fecha_limite`. Si lo tocara, cada «no contestó» sería una prórroga y
 * tres de ellas dejarían una alerta de tres semanas pintada en verde. El reloj
 * original sigue corriendo; el reintento es una fecha ADICIONAL.
 */
export function limiteDeReintento(hoy: Dia, inhabiles: ReadonlySet<Dia>): Dia {
  return sumaDiasHabiles(hoy, 1, inhabiles)
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REPROGRAMAR
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface PeticionReprograma {
  reprogramaciones: number
  motivo: string
  limiteActual: Dia
  /** `true` si quien pide es admin: la segunda reprogramación sólo la autoriza él. */
  esAdmin: boolean
}

export type Reprograma =
  | { ok: true; nuevoLimite: Dia }
  | { ok: false; porque: string }

export function reprograma(
  p: PeticionReprograma,
  hoy: Dia,
  inhabiles: ReadonlySet<Dia>,
  parametros: Parametros = {},
): Reprograma {
  const tope = parametro(parametros, 'reprogramaciones_asesor')
  const dias = parametro(parametros, 'reprogramacion_dias')
  const minMotivo = parametro(parametros, 'reprogramacion_motivo_min')

  if (p.reprogramaciones >= 2) {
    return { ok: false, porque: 'Esta alerta ya se reprogramó dos veces. No hay una tercera.' }
  }
  if (p.reprogramaciones >= tope && !p.esAdmin) {
    return {
      ok: false,
      porque: `Ya usaste tu reprogramación. La siguiente la autoriza `
            + `administración, y queda en la bitácora igual que ésta.`,
    }
  }
  if (p.motivo.trim().length < minMotivo) {
    return {
      ok: false,
      porque: `El motivo tiene ${p.motivo.trim().length} caracteres y hacen falta `
            + `al menos ${minMotivo}. Una reprogramación sin motivo es una fecha `
            + `movida sin razón, y cuenta en tus métricas igual.`,
    }
  }
  /* Se cuenta desde el límite ACTUAL y no desde hoy: si se contara desde hoy,
     reprogramar una alerta vencida hace una semana daría más margen que
     reprogramarla a tiempo — premiaría el retraso. */
  return { ok: true, nuevoLimite: sumaDiasHabiles(p.limiteActual, dias, inhabiles) }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ESCALAMIENTO
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Escalamiento {
  nivel: 0 | 1 | 2 | 3
  /** A quién se avisa en este nivel. */
  a: 'nadie' | 'asesor' | 'asesor_y_lider' | 'direccion'
  porque: string
}

/**
 * Qué nivel de escalamiento le toca HOY a un compromiso.
 *
 * Se deriva del semáforo y no se guarda como verdad: lo que se guarda es que la
 * notificación SE MANDÓ (`nivel_escalamiento`, `escalada_en`, `notificada_el`),
 * que es un hecho. El nivel que «le toca» es una resta de fechas y se recalcula
 * al leer, por la misma razón que el semáforo.
 *
 * ── RECIBE EL SEMÁFORO Y NADA MÁS, Y ESO SE CORRIGIÓ AQUÍ ─────────────────
 *
 * La primera versión pedía también la severidad, para poder decir «crítica
 * vencida» en el motivo. Eran DOS sitios que tenían que coincidir sobre la
 * misma alerta, y la prueba los descuadró al primer intento: se le pasó un
 * semáforo calculado con severidad `alta` y una severidad `critica` suelta, y la
 * función contestó nivel 2 sobre lo que el encargo manda al 3.
 *
 * Fue un fallo de la prueba, pero el defecto es del diseño: la severidad ya está
 * DENTRO del semáforo —es una de las dos vías al rojo intenso— y volver a
 * pedirla abre la puerta a que las dos digan cosas distintas. El motivo se
 * redacta desde `habiles`, que es lo único que hace falta para distinguir las
 * dos vías: con menos de tres días hábiles de retraso, al rojo intenso sólo se
 * llega por ser crítica.
 */
export function escalamientoDe(s: Semaforo): Escalamiento {
  if (s.nivel === 'rojo_intenso') {
    return {
      nivel: 3, a: 'direccion',
      porque: -s.habiles < 3
        ? 'Alerta crítica vencida: va al tablero de incumplimientos sin esperar días.'
        : `Vencida ${-s.habiles} días hábiles: va al tablero de incumplimientos.`,
    }
  }
  if (s.nivel === 'rojo') {
    return { nivel: 2, a: 'asesor_y_lider',
             porque: 'Vencida: se avisa al ejecutivo y a administración.' }
  }
  if (s.nivel === 'naranja') {
    return { nivel: 1, a: 'asesor', porque: 'Vence hoy: se avisa al ejecutivo.' }
  }
  return { nivel: 0, a: 'nadie', porque: 'En tiempo.' }
}

/**
 * ¿Hay que notificar hoy? Una vez al día por alerta, nunca más.
 *
 * La regla es sólo ésa: nivel por encima de cero y no avisada ya hoy. No se
 * exige además que el nivel SUBA, y conviene decir por qué, porque es lo
 * primero que uno escribe: con esa condición, una alerta que lleva nueve días
 * vencida se avisa el primer día y después nunca. Un incumplimiento que nadie
 * mira tiene que seguir doliendo todos los días — pero una sola vez al día.
 *
 * `nivelGuardado` no entra en la decisión; se recibe para que la bitácora pueda
 * anotar si el nivel subió, que es información distinta de si toca avisar.
 */
export function tocaNotificar(
  nivelHoy: number, notificadaEl: Dia | null | undefined, hoy: Dia,
): boolean {
  if (nivelHoy === 0) return false
  return notificadaEl !== hoy
}
