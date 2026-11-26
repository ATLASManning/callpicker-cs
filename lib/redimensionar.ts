import { MINUTOS_POR_EXTENSION, type OrigenBase } from '@/lib/plan-minutos'

/**
 * LA JUGADA DE REDIMENSIONAR — «que lo que pague el cliente sea lo que use»
 *
 * Instrucción de dirección del 26 nov 2026. La alerta de subutilización pasa a
 * ser la primera de la cola, y el asesor no debe leer «contactar al cliente»
 * sino la jugada con números: cuánto sobra, a cuánto bajar la bolsa, y con qué
 * producto se sustituye para que el MRR no se mueva.
 *
 * ── POR QUÉ NO SIRVE LA «OFERTA» QUE YA EXISTE ────────────────────────────
 *
 * `data/crecimiento-escalera.json` trae un campo `oferta`, y va en dirección
 * CONTRARIA: es una escalera de CRECIMIENTO. A Cargo Lift —8% de uso,
 * $18,953 al mes— le dice «Integración CRM con API», o sea venderle más encima
 * de una capacidad que no usa. Un asesor que abre así la conversación de
 * blindaje recibe «no, al revés: quiero bajarle». Son dos preguntas distintas
 * («qué le vendo» vs «cómo hago que pague lo que usa») y se derivan aparte.
 *
 * ── EL PICO, NO EL PROMEDIO ───────────────────────────────────────────────
 *
 * La bolsa se dimensiona sobre el MES MÁS ALTO de los últimos tres, no sobre
 * el promedio, y encima se le suma un 25%. El promedio deja al cliente corto
 * justo el mes que repunta, y un cliente que se queda sin minutos llama
 * enojado — que es exactamente lo que esta alerta intenta evitar. El pico es
 * lo que cubre el imponderable; el 25% es la holgura que dirección fijó.
 *
 * ── Y SI NO SE PUEDE MEDIR, SE DICE ───────────────────────────────────────
 *
 * Un plan sin minutos medibles (`origenBase: 'sin_medicion'`) no se
 * redimensiona: su `base` no es cero, es desconocida. Devolver aquí una
 * recomendación numérica sobre una base inventada pondría una cifra falsa
 * delante del cliente. [[feedback-cero-sin-medicion]]
 * [[feedback-contexto-ia-sin-huecos]]
 *
 * Este módulo NO importa nada de Supabase ni del sistema de archivos a
 * propósito: así se puede probar con `ts-node` fuera de Next.
 * [[feedback-verificar-antes-asegurar]]
 */

/** La holgura sobre el pico. Dirección, 26 nov 2026. */
export const HOLGURA = 1.25

/** Cuántos cortes entran al pico. Tres: un trimestre de estacionalidad. */
export const MESES_DEL_PICO = 3

/**
 * A cuánto se redondea la bolsa propuesta. Los planes se venden en escalones,
 * no en minutos sueltos: proponer «1,437 min» delata un número calculado y no
 * una oferta que exista.
 */
const ESCALON = 100

export interface MesDeConsumo {
  mes: string
  cons: number
  base: number | null
  origenBase: OrigenBase
  /** Extensiones del plan, cuando la base sale de ellas. */
  extensiones?: number | null
}

export interface InsumosRedimension {
  /** Lo que factura al mes. `null` = no medido, nunca 0 por omisión. */
  mrr: number | null
  /** Cortes de la cuenta, en cualquier orden: aquí se ordenan. */
  meses: readonly MesDeConsumo[]
  plan: string | null
  tieneCE: boolean | null
  tieneVyC: boolean | null
  tieneChat: boolean | null
  tieneAV: boolean | null
  tieneAPI: boolean | null
}

export interface JugadaMedible {
  medible: true
  mesesMirados: number
  mesPico: string
  picoMin: number
  baseMin: number
  /** % que representa el PICO sobre la base. El pico, no el último mes. */
  pctPico: number
  bolsaObjetivo: number
  sobranMin: number
  /**
   * En un plan POR EXTENSIONES la palanca comercial son las extensiones, no
   * los minutos: nadie vende «4,900 minutos» a quien compró 16 extensiones.
   * `null` cuando el plan es de bolsa.
   */
  extensionesHoy: number | null
  extensionesObjetivo: number | null
  producto: string
  porQueEseProducto: string
  /** Segundo movimiento del mix, cuando aplica. */
  ademas: string | null
  texto: string
}

export interface JugadaSinMedir {
  medible: false
  porque: string
  texto: string
}

export type Jugada = JugadaMedible | JugadaSinMedir

const miles = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 0 })

/**
 * Qué producto sustituye el gasto que sobra.
 *
 * EL ORDEN NO ES ARBITRARIO. Chat va primero porque **no consume minutos**:
 * a un cliente que llama poco, un canal que no depende de llamadas convierte
 * gasto parado en algo que sí va a usar. Después la subida de plataforma
 * (CE → VyC), que es la que dirección nombró. Y al final las integraciones,
 * que exigen un proyecto del lado del cliente y por eso tardan más en
 * convertirse en consumo real.
 *
 * Ver [[crecimiento-escalera-producto]] para la escalera completa.
 */
function eligeProducto(i: InsumosRedimension): {
  producto: string; porque: string; ademas: string | null
} {
  /* NO CONSTA NO ES NO TIENE. Si la cuenta no aparece en la escalera, los cinco
     llegan nulos: ofrecerle Chat entonces es apostar a que no lo tiene, y el
     asesor se entera delante del cliente. El hueco se dice con palabras.
     [[feedback-contexto-ia-sin-huecos]] */
  const consta = [i.tieneCE, i.tieneVyC, i.tieneChat, i.tieneAV, i.tieneAPI]
    .some(v => typeof v === 'boolean')
  if (!consta) {
    return {
      producto: 'producto por confirmar',
      porque: 'no consta qué productos tiene contratados hoy, y proponerle uno '
            + 'que ya tenga quema la conversación: revisar la ficha antes de '
            + 'llamar',
      ademas: null,
    }
  }

  const subeDePlataforma = i.tieneCE === true && i.tieneVyC !== true
    ? 'subir de Comunicación Empresarial a Visibilidad y Control'
    : null

  if (i.tieneChat !== true) {
    return {
      producto: 'Callpicker Chat',
      porque: 'no lo tiene y no consume minutos: a un cliente que llama poco '
            + 'le convierte gasto parado en un canal que sí va a usar',
      ademas: subeDePlataforma,
    }
  }
  if (subeDePlataforma) {
    return {
      producto: 'Visibilidad y Control',
      porque: 'hoy está en Comunicación Empresarial, que es el peldaño donde '
            + 'el plan se mide sólo por minutos',
      ademas: null,
    }
  }
  if (i.tieneAV !== true) {
    return {
      producto: 'Asistente Virtual',
      porque: 'no lo tiene: atiende lo repetitivo sin gastar agente ni minutos '
            + 'de la bolsa',
      ademas: null,
    }
  }
  if (i.tieneAPI !== true) {
    return {
      producto: 'Integración CRM con API',
      porque: 'no lo tiene: amarra el teléfono al CRM y vuelve costoso cambiarse '
            + 'de proveedor',
      ademas: null,
    }
  }
  return {
    producto: 'ningún producto nuevo: ya tiene todo el catálogo',
    porque: 'el ajuste sale del MRR y eso no lo decide el asesor — llevarlo a '
          + 'la mesa con el número',
    ademas: null,
  }
}

/**
 * La jugada de redimensionamiento de una cuenta.
 *
 * Devuelve `medible: false` —con el porqué escrito— cuando no hay cortes, la
 * base no se puede medir, o la cuenta NO está subutilizada. Ese último caso
 * importa: si el pico ya se come su plan, decirle que le sobra sería falso, y
 * la alerta habría que mirarla por otro lado.
 */
export function jugadaDeRedimension(i: InsumosRedimension): Jugada {
  if (!i.meses.length) {
    return {
      medible: false,
      porque: 'sin cortes de facturación',
      texto: 'No hay cortes de facturación de esta cuenta, así que no se puede '
           + 'decir cuánto le sobra. Pedir el corte antes de proponer nada: una '
           + 'cifra inventada delante del cliente cuesta la conversación.',
    }
  }

  /* Los más recientes primero; de ahí salen los tres del pico. El orden del
     origen no se da por supuesto porque no siempre viene ordenado. */
  const recientes = [...i.meses].sort((a, b) => (a.mes < b.mes ? 1 : -1))
                                .slice(0, MESES_DEL_PICO)
  const medibles = recientes.filter(
    m => m.origenBase !== 'sin_medicion' && m.base !== null && m.base > 0)

  if (!medibles.length) {
    return {
      medible: false,
      porque: 'el plan no declara minutos medibles',
      texto: `El plan${i.plan ? ` «${i.plan}»` : ''} no declara minutos contra los `
           + 'que medir, así que su consumo no es bajo: es DESCONOCIDO. '
           + 'Confirmar la bolsa real antes de proponer un ajuste.',
    }
  }

  /* La base es la del corte más reciente MEDIBLE: es el plan que tiene hoy.
     Usar la del pico pintaría el plan de hace tres meses. */
  const baseMin = medibles[0].base as number
  const pico = medibles.reduce((a, b) => (b.cons > a.cons ? b : a))
  const picoMin = Math.round(pico.cons)
  const pctPico = (100 * picoMin) / baseMin

  const bolsaCruda = picoMin * HOLGURA
  const bolsaObjetivo = Math.max(
    ESCALON, Math.ceil(bolsaCruda / ESCALON) * ESCALON)

  if (bolsaObjetivo >= baseMin) {
    return {
      medible: false,
      porque: 'no le sobra plan al medir el pico',
      texto: `Con el pico de ${MESES_DEL_PICO} meses (${miles(picoMin)} min en `
           + `${pico.mes}) más la holgura del 25%, la bolsa a la medida sería `
           + `${miles(bolsaObjetivo)} min y hoy tiene ${miles(baseMin)}: NO le `
           + 'sobra plan. Si el último mes se ve bajo, es estacionalidad, no '
           + 'subutilización — atenderla por consumo, no por dimensionamiento.',
    }
  }

  const sobranMin = baseMin - bolsaObjetivo
  const { producto, porque, ademas } = eligeProducto(i)
  const importe = i.mrr === null ? null : Math.round(i.mrr)

  /* ── LA PALANCA DEPENDE DE CÓMO SE VENDIÓ EL PLAN ──────────────────────
     En un plan de bolsa se bajan minutos; en uno de extensiones se bajan
     EXTENSIONES, y proponerle «4,900 min» a quien compró 16 extensiones no es
     una jugada que exista en la lista de precios. Son 57 de las 224 cuentas de
     la escalera: una cuarta parte de la cartera. No lo cazó ninguna prueba —lo
     cazó leer la frase de Azyco Guadalajara. [[reglas-minutos-callpicker]] */
  const porExtensiones = medibles[0].origenBase === 'extensiones'
    && typeof medibles[0].extensiones === 'number'
    && (medibles[0].extensiones as number) > 0
  const extensionesHoy = porExtensiones ? (medibles[0].extensiones as number) : null
  const extensionesObjetivo = porExtensiones
    ? Math.max(1, Math.ceil(bolsaObjetivo / MINUTOS_POR_EXTENSION))
    : null

  const laPalanca = porExtensiones && extensionesHoy !== null && extensionesObjetivo !== null
    /* UNA EXTENSIÓN ES UN PUESTO, NO UNA BOLSA. Aquí se publicaba «de 41 a 1
       extensión» para ATP Sofom, y un asesor que lleve eso a una llamada queda
       en ridículo: 41 extensiones son 41 personas con teléfono, y que hablen
       poco no significa que sobren 40 empleados. El minuto se dimensiona por
       consumo; la extensión, por cuánta gente la usa — y eso NO está en el
       consumo de minutos.

       Así que el número se publica como lo que es —cuántas extensiones
       bastarían para el tráfico— y la frase dice en voz alta que la palanca
       real es cuántas están ocupadas. El dato que falta se nombra en vez de
       taparse con una cifra. [[feedback-contexto-ia-sin-huecos]]

       (`extensión` + `es` daría «extensiónes»: el plural pierde la tilde, así
       que las dos palabras van enteras.) */
    ? `Su tráfico cabe en ${extensionesObjetivo} `
      + `${extensionesObjetivo === 1 ? 'extensión' : 'extensiones'} `
      + `(${miles(extensionesObjetivo * MINUTOS_POR_EXTENSION)} min, holgura `
      + `incluida) de las ${extensionesHoy} que paga. OJO: una extensión es un `
      + 'PUESTO, no una bolsa — antes de proponer bajar hay que confirmar '
      + 'cuántas están realmente en uso, porque hablar poco no es sobrar.'
    : `Bolsa a la medida con 25% de holgura: ${miles(bolsaObjetivo)} min — `
      + `sobran ${miles(sobranMin)}.`

  const texto =
    `Usa el ${pctPico.toFixed(0)}% de sus ${miles(baseMin)} min `
    + `(pico de ${medibles.length} ${medibles.length === 1 ? 'mes' : 'meses'}: `
    + `${miles(picoMin)} min en ${pico.mes}). ${laPalanca} `
    + `Sustituir ese sobrante con ${producto}, porque ${porque}`
    + (ademas ? `, y además ${ademas}` : '')
    + '. '
    + (importe === null
        ? 'Objetivo: que el ajuste no salga de la facturación. '
          + '(No hay importe medido de esta cuenta: confirmarlo antes de la llamada.)'
        /* EL SEGUNDO PORCENTAJE ES EL SUYO, NO UNO DE EJEMPLO. Aquí estuvo
           escrito «no en el 8% de lo viejo» —el número de la cuenta con la que
           se diseñó la frase— y salía igual en las 104 propuestas, incluidas
           las que usan el 15% o el 39%. Una cifra falsa dicha con aplomo
           delante del cliente. No lo cazó ninguna prueba ni el compilador: lo
           cazó LEER la reproducción con datos reales.
           [[feedback-verificar-antes-asegurar]]

           El 80% no es de ejemplo y por eso sí puede ir fijo: la bolsa se
           dimensiona en pico × 1.25, así que el pico ES el 80% de lo nuevo por
           construcción. */
        : `Objetivo: sostener los $${miles(importe)} al mes y que el consumo `
          + `quede en el 80% de lo nuevo, no en el ${pctPico.toFixed(0)}% de `
          + 'lo que paga hoy.')

  return {
    medible: true,
    mesesMirados: medibles.length,
    mesPico: pico.mes,
    picoMin,
    baseMin,
    pctPico,
    bolsaObjetivo,
    sobranMin,
    extensionesHoy,
    extensionesObjetivo,
    producto,
    porQueEseProducto: porque,
    ademas,
    texto,
  }
}
