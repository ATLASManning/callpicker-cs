/**
 * lib/focos-riesgo.ts — TODAS las cuentas vivas reciben seguimiento, por turno.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Necesito que se dé seguimiento a TODAS, si es por tickets, si es por falla,
 * si es por downgrade, si es por bajo consumo, etc., pero todas deben tener
 * seguimiento.» Y el límite que se mantiene: «churn confirmado NO aplica para
 * actividad SAC.»
 *
 * POR QUÉ ESTE DISEÑO Y NO EL QUE TENÍA ANTES
 * -------------------------------------------
 * La primera versión SELECCIONABA las cuentas «en riesgo» con umbrales que yo
 * inventé: consumo bajo 20%, tantos tickets, tantas fallas. Se probó contra el
 * churn que ya ocurrió —52 bajas de 222 cuentas— y el resultado fue demoledor:
 * **el puntaje compuesto no separaba mejor que el azar** (en el top 10 cazaba 1
 * de 52 cuando el azar daría 5%). Ver scripts/valida-riesgo.py.
 *
 * Así que en vez de inventar otro puntaje se midió, señal por señal, la tasa de
 * baja CON y SIN esa señal (scripts/senales-que-predicen.py, corte de julio):
 *
 *   sin seguimiento registrado   28% vs 13%   ×2.25  <- la más fuerte
 *   más de 60 días sin contacto  28% vs 14%   ×2.02
 *   uso por debajo del 40%       28% vs 18%   ×1.55
 *   health score < 60            24% vs 22%   ×1.08  <- casi no distingue
 *   15 o más tickets             25% vs 23%   ×1.07  <- no predice
 *   consumo en 0%                23% vs 23%   ×0.98  <- no predice
 *   2 o más fallas               12% vs 25%   ×0.46  <- predice AL REVÉS
 *   desapareció del corte         0% vs 26%   ×0.00  <- predice AL REVÉS
 *
 * Dos lecciones que cambiaron el código:
 *
 *   1. **Lo que más predice la baja es no tener seguimiento registrado.** No es
 *      burocracia: es el mejor indicador disponible. Por eso la regla ya no
 *      selecciona un subconjunto «en riesgo» — cubre a TODAS por turno, que es
 *      exactamente lo que apaga esa señal en la cartera entera.
 *
 *   2. **Una cuenta que reporta fallas se va MENOS.** Tiene sentido de negocio:
 *      el que reclama todavía habla contigo; el que se va en silencio es el
 *      peligroso. Las fallas y los tickets siguen siendo motivo de conversación
 *      —dirección lo pidió— pero NO mandan en el orden, porque no predicen.
 *
 * Con la honestidad debida: es correlación, no causa. Puede ser que no se
 * registre sobre cuentas que ya venían muriendo. Pero en cualquiera de las dos
 * lecturas es el mejor dato que hay, y medir cada mes es barato.
 *
 * LA CADENCIA
 * -----------
 * Son 135 cuentas vivas: Dan 54, Fátima 45, Claudia 36. Y el punto de partida
 * mide el problema: **Dan tiene 27 de sus 54 sin un solo seguimiento en toda su
 * historia**, Fátima 10 de 45 y Claudia 9 de 36.
 *
 * El objetivo es que ninguna pase de 60 días sin contacto registrado, así que
 * el tamaño del lote se calcula por cartera en vez de ser un número fijo: una
 * cartera de 54 necesita más por semana que una de 36 para dar la misma vuelta.
 */
import path from 'path'
import { todosLosCortes, ultimoMesDeCorte, type CorteCuenta } from './cortes-cuenta'
import { bloqueoComercialDeCuenta, normalizarNombre } from './elegibilidad'
import { personasDeCuenta as _personas } from './personas-cuenta'
/* La lectura de llamadas se importa de su módulo y NO se recalcula aquí: ahí
   viven los umbrales, el veredicto y la redacción con las cifras de cada cuenta.
   El generador ya importa estos dos, así que no agrega peso nuevo a la ruta. */
import { leerLlamadas } from './llamadas-cuenta'
import { LLAMADAS, LLAMADAS_META } from '@/app/cuentas/llamadas-data'
import { esValorReal } from './valores'
import { auditadasEnRiesgo } from './seguimiento-auditoria'
import { ticketStatsCuenta } from './tickets-cuenta'

/* El candado de cierre vive en `lib/cierre-seguimiento.ts` y se re-exporta desde
   aquí para que el generador siga importando de un solo lugar. Está separado
   porque la ruta que cierra actividades solo necesita el validador, y este módulo
   arrastra los 3.5 MB de `lib/tickets-data.json` más el Excel de cortes. */
export {
  TIPO_FOCO, validarCierreSeguimiento, componerResultadoSeguimiento,
  type CierreSeguimiento, type VeredictoSeguimiento,
} from './cierre-seguimiento'

/** Nadie debe pasar de aquí sin contacto registrado. Medido: ×2.02 de riesgo. */
export const DIAS_SIN_CONTACTO_LIMITE = 60

/**
 * DIEZ seguimientos por asesor por semana. Decisión de dirección, 25 sep 2026.
 *
 * «Si en un día y en minutos hicieron 3, quiere decir que pueden entrar,
 * revisar cuáles son y ejecutar todas, así que las subimos a 10. No busques
 * matemáticas, lo he visto, no están haciendo lo que deben.»
 *
 * El número NO sale de dividir la cartera entre semanas: sale de la capacidad
 * observada. Esa misma semana se cerraron tres actividades que el sistema midió
 * en un minuto cada una, así que el cuello de botella no es el tiempo.
 *
 * Como consecuencia, la vuelta completa queda muy por debajo del límite de 60
 * días: Dan 54 cuentas en 5.4 semanas, Fátima 45 en 4.5, Claudia 36 en 3.6.
 */
const SEGUIMIENTOS_POR_SEMANA = 10

/**
 * Las clases, EN EL ORDEN EN QUE SE ATIENDEN.
 *
 * El orden sale de los lifts medidos, no de la intuición. `sin_contacto`
 * primero porque es la señal más fuerte que existe; `sin_corte` casi al final
 * porque de las 22 cuentas que desaparecieron del corte NO se fue ninguna —era
 * mi foco de máxima prioridad y estaba al revés.
 */
export type ClaseFoco =
  | 'nunca_tocada'    // jamás tuvo un seguimiento registrado
  | 'sin_contacto'    // pasó de los 60 días
  | 'uso_bajo'        // por debajo del 40% de su base real
  | 'auditoria'       // auditoría entregada y cuenta en riesgo
  | 'soporte'         // tickets o fallas que conviene conversar
  | 'sin_corte'       // desapareció del último corte
  | 'rotacion'        // le toca su turno y no tiene ninguna señal encendida

export const ORDEN_FOCO: ClaseFoco[] = [
  'nunca_tocada', 'sin_contacto', 'uso_bajo', 'auditoria', 'soporte', 'sin_corte', 'rotacion',
]

export interface CuentaParaFoco {
  id: string
  cid: string | null
  consecutivo: string | null
  empresa: string
  asesor: string | null
  estado: string | null
  health_score: number | null
  facturacion: number | null
  tiene_chat_activo?: boolean | null
  /* Lo que ya sabemos de las PERSONAS de la cuenta. Va aquí para que el Mapa de
     Decisores empiece con lo registrado en vez de con una hoja en blanco — que
     es la diferencia entre pedir trabajo y pedir adivinación. */
  contacto_nombre?: string | null
  contacto_cargo?: string | null
  contacto_email?: string | null
  contacto_tel?: string | null
  contactos_json?: unknown
  pagina_web?: string | null
  giro?: string | null
}

/** Columnas de `cuentas` que necesita `focosDeRiesgo`. Una sola definición. */
export const CAMPOS_FOCO_SELECT =
  'id, cid, consecutivo, empresa, asesor, estado, health_score, facturacion, ' +
  'tiene_chat_activo, contacto_nombre, contacto_cargo, contacto_email, ' +
  'contacto_tel, contactos_json, pagina_web, giro'

/* `personasDeCuenta` vive en `lib/personas-cuenta.ts` y se re-exporta desde aquí.
   Está separado porque la ruta que CIERRA estas actividades también lo necesita
   —para verificar que el mapa quedó guardado— y no puede importar de este módulo
   sin arrastrar los 3.5 MB de `lib/tickets-data.json`. */
export { personasDeCuenta, personasConNombre, type PersonaCuenta } from './personas-cuenta'

export interface Foco {
  cuenta: CuentaParaFoco
  clase: ClaseFoco
  titulo: string
  detalle: string
  /** Días desde el último seguimiento registrado. `null` = nunca hubo. */
  diasSinContacto: number | null
  peso: number
  /** El trabajo concreto de ESTA vuelta. Cambia cada vez que la cuenta regresa. */
  trabajo: Trabajo
}

/**
 * LOS TRABAJOS. Con un cliente siempre hay algo que hacer; lo que cambia es qué.
 *
 * Una cuenta atendida la semana pasada NO se queda sin trabajo: le toca otro. Se
 * recorren en orden y la cuenta avanza uno cada vez que vuelve a salir, así que
 * en cinco vueltas se le hizo análisis de relación, de tickets, de factura, de
 * datos y de crecimiento — y a la sexta se empieza otra vez, con datos nuevos.
 *
 * El orden no es caprichoso: primero hablar con el cliente (lo que más predice
 * la baja, ×2.25), y después los análisis que dan de qué hablar la próxima vez.
 */
export type ClaveTrabajo =
  | 'relacion' | 'decisores' | 'tickets' | 'llamadas' | 'factura' | 'datos' | 'crecimiento'

export interface Trabajo {
  clave: ClaveTrabajo
  titulo: string
  /** Qué tiene que hacer, en imperativo y concreto. */
  pasos: string[]
}

/**
 * `decisores` va EN SEGUNDO LUGAR, y el lugar importa: con la rotación normal
 * eso significa que toda cuenta recibe su mapa de decisores en su SEGUNDA
 * vuelta, no dentro de seis semanas.
 *
 * Se agregó el 25 sep 2026 por Clikauto. La actividad pedía literalmente un
 * «mapa de decisores» y se cerró con UN nombre — el que la propia ficha de la
 * cuenta clasifica como «Contacto Operativo». Opera, no decide. Y en esa misma
 * ficha ya había otros dos contactos que nadie usó.
 *
 * El número que lo justifica: **128 de 179 cuentas vivas tienen UNA SOLA persona
 * con nombre registrada.** Claudia 43, Dan 42, Fátima 43. Una cuenta que cuelga
 * de una persona se pierde el día que esa persona deja de contestar, y eso no es
 * hipotético: es exactamente lo que lleva pasando en Clikauto desde junio.
 *
 * Dirección, 25 sep 2026: «siempre hay que hacer con los clientes... esto suma
 * además de lo que ya tienes.»
 */
export const TRABAJOS: ClaveTrabajo[] = [
  'relacion', 'decisores', 'tickets', 'llamadas', 'factura', 'datos', 'crecimiento',
]

function uso(c: CorteCuenta): number | null {
  return c.base && c.base > 0 ? (100 * c.cons) / c.base : null
}

/** Lo que `data/crecimiento-escalera.json` sabe de una cuenta. */
export interface FilaEscalera {
  cuenta_id?: string; cid?: string; empresa?: string; peldano?: string; oferta?: string
  pct_consumo?: number; plan_ultimo_corte?: string; monto_ultimo_corte?: number
  base_minutos?: number; minutos_consumidos?: number
  llamadas_entrantes?: number; llamadas_salientes?: number; pct_entrantes?: number
  tickets?: number; fallas?: number; tickets_categoria_top?: string
  tickets_horas_mediana?: number; dids?: number; dids_libres?: number
  tiene_CE?: boolean; tiene_VyC?: boolean; tiene_Chat?: boolean
  tiene_AV?: boolean; tiene_API?: boolean; accionable?: boolean
}

let _escalera: Map<string, FilaEscalera> | null = null

/**
 * `data/crecimiento-escalera.json`, indexado por `cuenta_id` Y por CID.
 *
 * Se indexa por los dos a propósito: el `cuenta_id` es el identificador de
 * verdad —único en las 222 filas y el que no se puede confundir— y el CID queda
 * como red por si alguna fila del generador se quedó sin él. Nunca por nombre de
 * empresa: ahí es donde se mezclan cuentas (ver [[dids_fuente]]).
 *
 * Si el archivo no está, se devuelve un mapa vacío y los trabajos salen con la
 * redacción de «no hay dato» en vez de inventarse cifras. Es la regla de
 * [[feedback_contexto_ia_sin_huecos]]: el hueco se dice con palabras.
 */
async function cargarEscalera(): Promise<Map<string, FilaEscalera>> {
  if (_escalera) return _escalera
  const m = new Map<string, FilaEscalera>()
  try {
    const fs = (await import('fs')).default
    const ruta = path.join(process.cwd(), 'data', 'crecimiento-escalera.json')
    if (fs.existsSync(ruta)) {
      const j = JSON.parse(fs.readFileSync(ruta, 'utf8')) as { cuentas?: FilaEscalera[] }
      for (const f of j.cuentas ?? []) {
        const id = String(f.cuenta_id ?? '').trim()
        const cid = String(f.cid ?? '').trim()
        if (id) m.set(id, f)
        if (cid && !m.has(cid)) m.set(cid, f)
      }
    }
  } catch (e) {
    console.warn('[focos-riesgo] No se pudo leer data/crecimiento-escalera.json:', e)
  }
  _escalera = m
  return m
}

function n(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : 0
}

/**
 * El trabajo de esta vuelta, con los datos de la cuenta metidos dentro.
 *
 * La idea es que el asesor NO tenga que ir a buscar nada a otra pantalla: la
 * tarea trae los números y le pide una conclusión, no una consulta.
 */
function armarTrabajo(
  clave: ClaveTrabajo, c: CuentaParaFoco, e: FilaEscalera | null, tkTotal: number, tkFallas: number,
): Trabajo {
  const nom = c.empresa
  switch (clave) {
    case 'decisores': {
      const gente = _personas(c)
      const personas = gente.filter(p => p.nombre)
      const buzones = gente.filter(p => !p.nombre)
      const sinCargo = personas.filter(p => !p.cargo)
      const sinTel = personas.filter(p => !p.telUtil)
      const web = esValorReal(c.pagina_web) ? String(c.pagina_web).split('|')[0].trim() : ''

      const inventario = personas.length === 0
        ? 'Hoy NO hay una sola persona con nombre registrada en esta cuenta.'
        : `Hoy están registradas ${personas.length === 1 ? 'UNA sola persona' : `${personas.length} personas`}: ` +
          personas.map(p => `${p.nombre}${p.cargo ? ` (${p.cargo})` : ' — SIN CARGO REGISTRADO'}` +
            `${p.telUtil ? '' : ', sin teléfono marcable'}`).join(' · ') + '.' +
          (buzones.length ? ` Además ${buzones.length} buzón(es) genérico(s) — no son decisores.` : '')

      return {
        clave, titulo: 'Mapa de decisores: quién decide, quién influye, quién opera',
        pasos: [
          inventario,
          personas.length <= 1
            ? 'ESTA CUENTA CUELGA DE UNA SOLA PERSONA. El día que deje de contestar, se pierde la ' +
              'cuenta — y no es hipotético: es lo que pasa cuando alguien cambia de puesto, sale de ' +
              'vacaciones o se va de la empresa. Salir de aquí con DOS nombres nuevos es el mínimo.'
            : 'Confirma que alguno de esos nombres DECIDE. Tener varios contactos operativos no es ' +
              'un mapa de decisores: es la misma dependencia repartida.',
          'Clasifica a cada persona en una de tres: DECIDE (autoriza el gasto), INFLUYE (su opinión ' +
          'pesa en la renovación) u OPERA (usa el sistema). Si todos los que tienes operan, el mapa ' +
          'está incompleto y ese ES el hallazgo.',
          'Dónde buscar sin llamar a nadie: ' + [
            web ? `el sitio de la cuenta (${web}) — secciones de contacto, nosotros y sucursales` : 'el sitio de la cuenta',
            'LinkedIn de la empresa, filtrando por dirección, finanzas, operaciones y sistemas',
            'el correo de facturación, que casi siempre llega a quien autoriza el pago',
            'los tickets de soporte: quien los abre es quien OPERA, y te dice por dónde entrar',
          ].join(' · ') + '.',
          sinCargo.length
            ? `Completa el cargo de: ${sinCargo.map(p => p.nombre).join(', ')}. Un contacto sin cargo ` +
              'no sirve para decidir a quién escalar.'
            : 'Verifica que los cargos registrados sigan vigentes: la gente cambia de puesto.',
          sinTel.length
            ? `Consigue un teléfono marcable de: ${sinTel.map(p => p.nombre).join(', ')}. Depender ` +
              'solo del correo es depender de que contesten cuando quieran.'
            : 'Verifica que los teléfonos sigan siendo los buenos.',
          'REGISTRA lo que encuentres en la ficha de la cuenta, en Contactos. Un decisor que ' +
          'descubres y no guardas se pierde igual que si no lo hubieras encontrado.',
        ],
      }
    }
    case 'tickets':
      return {
        clave, titulo: 'Analizar sus tickets y presentar el hallazgo',
        pasos: [
          `Tiene ${tkTotal} tickets históricos y ${tkFallas} marcados como falla` +
          (e?.tickets_categoria_top ? `; la categoría que más repite es «${e.tickets_categoria_top}»` : '') +
          (n(e?.tickets_horas_mediana) > 0 ? `, con una mediana de ${Math.round(n(e?.tickets_horas_mediana))} h hasta el cierre` : '') + '.',
          'Abre el módulo Tickets filtrando por su CID y busca el PATRÓN: ¿es el mismo problema repetido, o cosas distintas?',
          'Si se repite, eso es una conversación de mejora, no de soporte: llévasela al cliente con el dato.',
          'Si no se repite, dilo también — una cuenta sin patrón de fallas es un argumento de estabilidad que sirve para vender.',
        ],
      }
    case 'llamadas': {
      /* La lectura NO se recalcula aquí: `leerLlamadas` ya decide el veredicto,
         redacta la portada y las frases con las cifras de la cuenta. Volver a
         componerlas sería tener dos versiones de la misma verdad, y la de aquí
         se quedaría atrás en cuanto alguien mueva un umbral.

         Y se respeta su vocabulario, que no es cosmético: «sin contestar» para
         entrantes, «no conectó» para salientes, nunca «perdidas» a secas. Una
         entrante sin contestar es un cliente final al que nadie atendió; una
         saliente que no conecta es lo normal en cualquier marcación. Sumarlas
         es el error que ese módulo existe para impedir. */
      const l = leerLlamadas(LLAMADAS, LLAMADAS_META, c.cid, c.empresa)
      if (!l) {
        return {
          clave, titulo: 'Atención de llamadas: conseguir la lectura',
          pasos: [
            'NO HAY LECTURA de llamadas para esta cuenta. No es que atienda bien ni mal: ' +
            'su CID no aparece en ninguna de las dos extracciones del archivo.',
            'Verifica que el CID de la ficha sea el correcto y que la cuenta no opere bajo otro.',
            'Si el CID es correcto, repórtalo para que entre en la siguiente extracción — ' +
            'y déjalo escrito aquí, porque una cuenta sin lectura es una cuenta que no podemos vigilar.',
            'Mientras tanto, pregúntale al cliente directamente cómo le está respondiendo el ' +
            'teléfono: es la misma información, por la vía lenta.',
          ],
        }
      }
      const pasos: string[] = [
        `Veredicto del módulo: ${l.etiqueta}. ${l.portada}`,
        ...l.decir,
      ]
      if (l.archivoViejo) {
        pasos.push('OJO: el archivo de llamadas viene de un corte viejo. Contrasta con el cliente ' +
                   'antes de afirmar una cifra — el refresco es semestral.')
      }
      pasos.push(
        'Llévale la cifra al cliente y pregunta qué pasa del lado de ellos: cuántas personas ' +
        'contestan, en qué horario, si alguien salió del equipo. El dato abre la conversación, ' +
        'no la cierra.',
        'Si el número está bien y no hay problema de atención, escríbelo: una cuenta estable ' +
        'documentada es un argumento de renovación.',
      )
      return { clave, titulo: 'Analizar cómo le están contestando el teléfono', pasos }
    }
    case 'factura':
      return {
        clave, titulo: 'Revisar su factura y su plan',
        pasos: [
          e?.plan_ultimo_corte
            ? `Plan actual: «${e.plan_ultimo_corte}» por $${Math.round(n(e.monto_ultimo_corte)).toLocaleString('es-MX')}. ` +
              `Consumió ${Math.round(n(e.minutos_consumidos))} de ${Math.round(n(e.base_minutos))} minutos (${n(e.pct_consumo).toFixed(0)}%).`
            : 'No hay corte de facturación cruzado por su CID: averigua si factura bajo otro CID y déjalo anotado.',
          '¿El plan le queda grande o chico? Si consume menos del 40%, la renovación es una conversación difícil que conviene adelantar.',
          'Si va por encima del 100%, el excedente se está cobrando: revisa si le conviene subir de plan antes de que lo note en la factura.',
          'Trae una recomendación concreta, no solo el porcentaje.',
        ],
      }
    case 'datos':
      return {
        clave, titulo: 'Robustecer la información de la cuenta',
        pasos: [
          'Completa lo que falte en la ficha: contacto y cargo, giro, número de oficinas, NPS, observaciones KAM y próximo contacto.',
          'Verifica que el CID sea el correcto y que estén todos sus números (DIDs)' +
          (n(e?.dids) > 0 ? `: hoy se le conocen ${n(e?.dids)}` : '') + '.',
          'Responde el Radar de Cuenta si le faltan preguntas.',
          'Un dato faltante no es un hueco administrativo: es lo que impide ver el riesgo antes de que pase.',
        ],
      }
    case 'crecimiento':
      return {
        clave, titulo: e?.oferta ? `Investigar evidencia para ofrecer ${e.oferta}` : 'Buscar evidencia de crecimiento',
        pasos: [
          e?.peldano ? `Hoy está en el peldaño «${e.peldano}».` : 'Revisa en qué peldaño de producto está.',
          e?.oferta
            ? `El siguiente escalón que le corresponde es ${e.oferta}. Busca la evidencia que lo justifique ANTES de proponerlo.`
            : 'Identifica qué producto sigue y qué evidencia lo justificaría.',
          n(e?.llamadas_entrantes) > 0 || n(e?.llamadas_salientes) > 0
            ? `Datos que puedes usar: ${n(e?.llamadas_entrantes)} llamadas entrantes y ${n(e?.llamadas_salientes)} salientes` +
              (n(e?.pct_entrantes) > 0 ? `, ${n(e?.pct_entrantes).toFixed(0)}% entrantes` : '') + '.'
            : 'Busca el dato de llamadas en Atención de llamadas antes de proponer.',
          /* El `||` va DENTRO del paréntesis a propósito. Escrito como
             `'Módulos: ' + lista || 'ninguno'`, la concatenación gana por
             precedencia, el `||` nunca dispara y una cuenta sin módulos
             registrados imprimía «Módulos activos:» y nada más. */
          'Módulos activos: ' + ([
            e?.tiene_CE ? 'CE' : null, e?.tiene_VyC ? 'VyC' : null, e?.tiene_Chat ? 'Chat' : null,
            e?.tiene_AV ? 'AV' : null, e?.tiene_API ? 'API' : null,
          ].filter(Boolean).join(', ') || 'ninguno registrado') + '.',
          'Presenta la propuesta con el dato que la sostiene. Sin evidencia no es upsell, es insistencia.',
        ],
      }
    case 'relacion':
    default: {
      /* Si la cuenta cuelga de una sola persona, la pregunta del decisor va YA,
         dentro de la primera conversación. No se espera a la vuelta del Mapa de
         Decisores: preguntar «¿quién más autoriza esto?» no cuesta nada cuando
         ya tienes a alguien al teléfono, y es el momento natural de hacerlo.
         Son 128 de 179 cuentas vivas. */
      const solos = _personas(c).filter(p => p.nombre).length <= 1
      return {
        clave, titulo: 'Hablar con el cliente y dejar registro',
        pasos: [
          `Contacta al responsable de ${nom} y pregunta cómo va la operación.`,
          'No es una llamada de cortesía: confirma que el servicio opera bien, si hubo cambios de equipo o de prioridades, y qué esperan de los próximos meses.',
          ...(solos ? [
            'ESTA CUENTA CUELGA DE UNA SOLA PERSONA, así que en esta misma conversación ' +
            'pregunta quién más autoriza el gasto y quién más usa el sistema. Pide nombre y ' +
            'cargo, y guárdalos en la ficha. No es una tarea aparte: es una pregunta que ya ' +
            'estás en posición de hacer.',
          ] : []),
          'Acuerda UNA acción concreta con fecha.',
          'Registra el resultado aunque sea malo. «No contesta desde el 3 de agosto» es información valiosa; el silencio en el sistema no lo es.',
        ],
      }
    }
  }
}

/**
 * Cuántos seguimientos entrega esta semana. SIEMPRE diez.
 *
 * No se recorta por «cuentas disponibles», y es la corrección de un error de
 * concepto mío. Dirección lo dijo así: «siempre hay que hacer con los clientes:
 * que hagan análisis y los presenten, que robustezcan la información, que
 * analicen los tickets, la factura, que investiguen si hay más evidencia para
 * hacer upsell o crosssell. No me digas que se agota.»
 *
 * Y es cierto: una cuenta no se queda sin trabajo por haberla llamado la semana
 * pasada — necesita OTRO trabajo. Lo que rota no es la lista de cuentas, es el
 * tipo de trabajo sobre cada una. Ver `TRABAJOS`.
 */
export function loteSemanal(_cuentasVivas: number): number {
  return SEGUIMIENTOS_POR_SEMANA
}

/**
 * Los focos de una cartera: TODAS las cuentas vivas, ordenadas por turno.
 *
 * `ultimoSeguimiento` es un mapa cuenta_id -> 'AAAA-MM-DD' del último
 * seguimiento registrado. Se recibe ya leído para no consultar Supabase desde
 * aquí.
 */
export async function focosDeRiesgo(
  cuentas: CuentaParaFoco[],
  ultimoSeguimiento: Map<string, string>,
  hoy: string,
  /**
   * Cuántas actividades de foco lleva ya cada cuenta (cuenta_id -> número).
   * Es lo que decide QUÉ trabajo le toca ahora: la cuenta avanza un trabajo
   * cada vez que vuelve a salir. Sin el mapa, todas empiezan por «relación»,
   * que es el orden correcto para una cartera que arranca.
   */
  vueltasPrevias: Map<string, number> = new Map(),
): Promise<Foco[]> {
  const mapa = await todosLosCortes()
  const ultimoMes = await ultimoMesDeCorte()
  const escalera = await cargarEscalera()
  const auditadas = new Set(auditadasEnRiesgo().map(a => normalizarNombre(a.nombre)))
  const out: Foco[] = []

  for (const c of cuentas) {
    /* CANDADO DE CHURN, primero que nada. Regla expresa y no se toca: a una
       cuenta ya perdida no se le pide trabajo de retención — le corresponde la
       Aclaración de baja, que va por su lado y fuera de este presupuesto.
       Estas actividades NO pasan por `evaluarElegibilidad` a propósito, así que
       el candado se pone aquí o no se pone en ningún lado. */
    const bloqueo = bloqueoComercialDeCuenta(c as never)
    if (bloqueo.codigos.includes('churn_grc') || bloqueo.codigos.includes('cancelacion')) continue

    const estado = String(c.estado ?? '').trim()
    if (estado !== 'activo' && estado !== 'en_riesgo') continue

    const fact = Number(c.facturacion ?? 0)
    const cid = String(c.cid ?? '').trim()
    const cortes = cid ? (mapa.get(cid) ?? []) : []
    const ultimoCorte = cortes.length ? cortes[cortes.length - 1] : null
    const u = ultimoCorte ? uso(ultimoCorte) : null
    const chat = Boolean(c.tiene_chat_activo)

    const ult = ultimoSeguimiento.get(c.id) ?? ''
    let dias: number | null = null
    if (ult) {
      const ms = new Date(hoy + 'T12:00:00').getTime() - new Date(ult + 'T12:00:00').getTime()
      dias = Math.floor(ms / 86400000)
    }

    const tk = ticketStatsCuenta(c.cid, c.empresa)

    /* ── La razón de la conversación ──────────────────────────────────
       Se elige UNA: la que manda según lo medido. Las demás se mencionan
       dentro del texto, porque todas son motivo de conversación aunque no
       decidan el turno. */
    let clase: ClaseFoco = 'rotacion'
    let titulo = 'Le toca su turno de seguimiento'
    if (!ult) {
      clase = 'nunca_tocada'
      titulo = 'Nunca ha tenido un seguimiento registrado'
    } else if (dias !== null && dias > DIAS_SIN_CONTACTO_LIMITE) {
      clase = 'sin_contacto'
      titulo = `${dias} días sin contacto registrado`
    } else if (u !== null && u < 40) {
      clase = 'uso_bajo'
      titulo = `Usa el ${u.toFixed(0)}% de su plan`
    } else if (auditadas.has(normalizarNombre(c.empresa))) {
      clase = 'auditoria'
      titulo = 'Auditoría entregada y cuenta en riesgo'
    } else if (tk.total >= 15 || tk.fallas >= 2) {
      clase = 'soporte'
      titulo = `${tk.total} tickets · ${tk.fallas} fallas`
    } else if (ultimoCorte && ultimoMes && ultimoCorte.mes < ultimoMes) {
      clase = 'sin_corte'
      titulo = `No aparece en el corte de ${ultimoMes}`
    }

    /* El contexto: todo lo que hay que saber antes de llamar, en un solo sitio,
       para que el asesor no tenga que ir a buscarlo a cuatro pantallas. */
    const ctx: string[] = []
    ctx.push(ult
      ? `Último seguimiento registrado: ${ult} (${dias} días).`
      : 'NUNCA se le ha registrado un seguimiento.')
    if (ultimoCorte) {
      ctx.push(u !== null
        ? `Corte de ${ultimoCorte.mes}: usó ${Math.round(ultimoCorte.cons)} de ${ultimoCorte.base} min (${u.toFixed(0)}%), plan «${ultimoCorte.plan}».`
        : `Corte de ${ultimoCorte.mes}: plan «${ultimoCorte.plan}», sin base de minutos medible.`)
      if (ultimoMes && ultimoCorte.mes < ultimoMes) {
        ctx.push(`OJO: no aparece en el corte de ${ultimoMes}. Verifica con facturación si sigue activa.`)
      }
    } else {
      ctx.push('Sin cortes de facturación cruzados por su CID.')
    }
    if (tk.comoCruzo === 'ninguno') {
      ctx.push('Sin tickets cruzados en el export de Zoho (puede operar con otro CID).')
    } else {
      ctx.push(`Tickets históricos: ${tk.total}, de los cuales ${tk.fallas} marcados como falla.`)
    }
    /* LA DEPENDENCIA DE UNA SOLA PERSONA SE DICE SIEMPRE, toque el trabajo que
       toque. Es un riesgo estructural: no se manifiesta poco a poco como el
       consumo, se manifiesta de golpe el día que esa persona no contesta.
       Son 128 de 179 cuentas vivas. */
    const personas = _personas(c).filter(p => p.nombre)
    if (personas.length === 0) {
      ctx.push('SIN UNA SOLA PERSONA con nombre registrada. No sabemos a quién llamar.')
    } else if (personas.length === 1) {
      const p = personas[0]
      ctx.push(
        `CUELGA DE UNA SOLA PERSONA: ${p.nombre}` +
        (p.cargo ? ` (${p.cargo})` : ' — sin cargo registrado') +
        (p.telUtil ? '.' : ', y sin teléfono marcable: el correo es el único canal.'),
      )
    }
    /* La atención de llamadas, en una línea y en TODA tarea. Dos veredictos se
       dicen siempre porque no esperan: `en_silencio` es un teléfono que dejó de
       sonar —una cuenta apagándose, no un problema de atención— y `llama` es un
       deterioro contra su propia base, no contra un promedio ajeno. */
    const ll = leerLlamadas(LLAMADAS, LLAMADAS_META, c.cid, c.empresa)
    if (!ll) {
      ctx.push('Sin lectura de llamadas: su CID no aparece en el archivo (no es que atienda bien).')
    } else if (ll.veredicto === 'en_silencio' || ll.veredicto === 'llama' || ll.veredicto === 'vigilar') {
      ctx.push(`Atención de llamadas — ${ll.etiqueta}: ${ll.portada}`)
    }
    if (chat) ctx.push('Tiene CHAT activo: su consumo de voz no cuenta toda su operación.')
    if (auditadas.has(normalizarNombre(c.empresa))) {
      ctx.push('Tiene auditoría entregada — ábrela en /auditoria antes de llamar.')
    }

    /* ── EL TRABAJO DE ESTA VUELTA ────────────────────────────────────
       Dos reglas, y la primera manda:

       1. Si la cuenta está sin contacto —nunca tocada o pasada de los 60
          días— el trabajo es HABLAR con ella, sin importar cuántas vueltas
          lleve. Es la señal medida más fuerte (×2.25 y ×2.02) y ninguna
          rotación de análisis la sustituye.
       2. En cualquier otro caso rota: la cuenta avanza un trabajo cada vez
          que vuelve a salir, así que nunca se queda sin qué hacer. En cinco
          vueltas se le hizo relación, tickets, factura, datos y crecimiento;
          a la sexta se vuelve a empezar, con datos nuevos. */
    const vueltas = vueltasPrevias.get(c.id) ?? 0
    const clave: ClaveTrabajo = (clase === 'nunca_tocada' || clase === 'sin_contacto')
      ? 'relacion'
      : TRABAJOS[vueltas % TRABAJOS.length]
    const fila = escalera.get(c.id) ?? (cid ? escalera.get(cid) ?? null : null)
    const trabajo = armarTrabajo(clave, c, fila, tk.total, tk.fallas)

    out.push({
      cuenta: c, clase, titulo, diasSinContacto: dias, peso: fact,
      detalle: ctx.join('\n  · '),
      trabajo,
    })
  }

  return out
}

/**
 * El turno. Primero la clase que más predice, y dentro de ella la que lleva más
 * tiempo sin contacto; a igualdad, la que más factura.
 */
export function ordenarFocos(focos: Foco[]): Foco[] {
  return focos.slice().sort((a, b) => {
    const ia = ORDEN_FOCO.indexOf(a.clase)
    const ib = ORDEN_FOCO.indexOf(b.clase)
    if (ia !== ib) return ia - ib
    const da = a.diasSinContacto ?? 99999
    const db = b.diasSinContacto ?? 99999
    if (da !== db) return db - da
    return b.peso - a.peso
  })
}

export function repartoFocos(focos: Foco[]): Record<string, Record<string, number>> {
  const r: Record<string, Record<string, number>> = {}
  for (const f of focos) {
    const a = f.cuenta.asesor || '[sin asesor]'
    r[a] = r[a] ?? {}
    r[a][f.clase] = (r[a][f.clase] ?? 0) + 1
  }
  return r
}

export function descripcionFoco(f: Foco): string {
  return [
    /* El marcador lleva la CLASE y el TRABAJO, y el trabajo va ahí por una razón
       práctica: la tabla `actividades` no tiene columna para él y agregarla exige
       una migración. El cierre necesita saber qué trabajo era —el Mapa de
       Decisores se valida distinto— así que se codifica en el texto, igual que
       hace la aclaración con su `marcadorAclaracion`. Lo lee
       `trabajoDeDescripcion` en lib/cierre-seguimiento.ts. */
    `[SEGUIMIENTO·${f.clase.toUpperCase()}·${f.trabajo.clave.toUpperCase()}] ${f.titulo} — ${f.cuenta.empresa}`,
    '',
    'LO QUE SE SABE DE ESTA CUENTA HOY:',
    `  · ${f.detalle}`,
    '',
    `EL TRABAJO DE ESTA VUELTA — ${f.trabajo.titulo.toUpperCase()}:`,
    ...f.trabajo.pasos.map(p => `  · ${p}`),
    '',
    'QUÉ HAY QUE DEJAR REGISTRADO PARA CERRARLA:',
    '  1. CON QUIÉN HABLASTE: nombre, puesto y por qué vía. Y si esa persona',
    '     DECIDE o solo opera — hablar con quien no decide explica muchos «no».',
    '  2. QUÉ HICISTE: las acciones concretas con fechas. Qué le presentaste, con',
    '     qué datos y en qué formato. Si no lograste contacto, cuántas veces lo',
    '     intentaste, por qué vías y en qué fechas.',
    '  3. POR QUÉ QUEDÓ ASÍ: la causa de fondo y el siguiente paso con fecha.',
    '',
    'Los tres son obligatorios y se validan al cerrar. «El cliente no quiere» es',
    'un resultado, no una explicación: si esa es la respuesta, hay que decir a',
    'quién se le presentó, qué objeción puso y qué se le ofreció para rebatirla.',
    '',
    'Por qué importa registrarlo, con números: de las cuentas SIN seguimiento',
    'registrado se dio de baja el 28%; de las que sí lo tienen, el 13%. Es la',
    'señal más fuerte que tenemos — más que el health score, más que los tickets.',
    '',
    'Esta actividad NO vence y NO ocupa uno de los cuatro lugares semanales.',
  ].join('\n')
}
