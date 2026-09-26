import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TipoSeguimiento } from '@/lib/types'
import { detectDataGaps, CAMPOS_GAP_SELECT, type CuentaGapInput } from '@/lib/data-gaps'
import { contarRespuestasRadar, preguntasRadarFaltantes } from '@/lib/radar'
import {
  evaluarElegibilidad, CAMPOS_ELEGIBILIDAD_SELECT, MSG,
  type CuentaElegibilidadInput, type ResultadoElegibilidad,
} from '@/lib/elegibilidad'
import { evaluarCierre } from '@/lib/actividades/cierre'
import { anteponerEntrada } from '@/lib/observaciones-kam'
import {
  TIPO_ACLARACION, validarCierreAclaracion, componerResultadoAclaracion,
} from '@/lib/aclaraciones'
/* Del módulo ligero, NO de `@/lib/focos-riesgo`: ese arrastra los 3.5 MB de
   `lib/tickets-data.json` y el Excel de cortes, y esta ruta es interactiva. */
import {
  TIPO_FOCO, validarCierreSeguimiento, componerResultadoSeguimiento,
  trabajoDeDescripcion, MIN_MOTIVO_DECISOR_UNICO,
  puedeAutorizarDecisorUnico, marcaSolicitudAutorizacion, selloAutorizacion,
  AUTORIZA_NOMBRE,
} from '@/lib/cierre-seguimiento'
import { personasDeCuenta, buscaDecisor } from '@/lib/personas-cuenta'
import { hoyEnMexico } from '@/lib/fecha-local'

export const dynamic = 'force-dynamic'

/**
 * Re-valida la elegibilidad en el momento de actuar sobre la actividad.
 * Una cuenta puede haber cambiado de estatus DESPUÉS de que se generó la
 * actividad; iniciar o completar sobre una cuenta ya dormida/cancelada/en
 * churn no debe ser posible. Fail-closed: si no se puede leer la cuenta,
 * se bloquea.
 *
 * No consulta Zoho aquí (esa llamada tarda y este endpoint es interactivo):
 * se pasa un Set vacío, con lo que siguen aplicando estado, GRC-AAA-2026,
 * alertas de cancelación y completitud de contacto. La conciliación con Zoho
 * es responsabilidad del generador semanal.
 */
async function revalidarCuenta(cuentaId: string, tipo: string): Promise<ResultadoElegibilidad> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select(CAMPOS_ELEGIBILIDAD_SELECT)
    .eq('id', cuentaId)
    .single()

  if (error || !data) {
    return { elegible: false, codigo: 'estatus_no_validable', motivo: MSG.estatus_no_validable, contactoFaltante: [] }
  }
  return evaluarElegibilidad(data as unknown as CuentaElegibilidadInput, new Set<string>(), tipo)
}

/**
 * Códigos que significan "la cuenta ya no es cliente" (o fue retirada del
 * programa por dirección). Una actividad viva sobre una cuenta así NO se
 * bloquea: se deja llegar a su cierre para que el asesor justifique qué pasó y
 * qué acciones tomó. Ver el bloque de elegibilidad en PATCH.
 *
 * OJO: esta lista es SOLO para actividades YA EXISTENTES. Para generar
 * actividades nuevas estos mismos códigos siguen bloqueando (fail-closed) en
 * app/api/actividades/generar/route.ts.
 */
const BAJA_COMERCIAL: ReadonlySet<string> = new Set([
  'churn_grc', 'cancelacion', 'dormida', 'estado_no_activo', 'exclusion_manual',
])

/** Bloquea la actividad en BD cuando su cuenta dejó de ser elegible. */
async function bloquearActividad(actividadId: string, motivo: string) {
  try {
    await supabaseAdmin
      .from('actividades')
      .update({ estado: 'bloqueada', motivo_pendiente: motivo, actualizado_en: new Date().toISOString() })
      .eq('id', actividadId)
  } catch (e) {
    console.warn(`[Actividades ${actividadId}] No se pudo bloquear:`, e)
  }
}

function mapTipo(tipo: string): TipoSeguimiento {
  const m: Record<string, TipoSeguimiento> = {
    llamada: 'llamada', reunion: 'reunion',
    analisis: 'nota', kam: 'nota', upsell: 'upsell',
    tickets: 'nota', pagos: 'nota', validacion: 'nota',
  }
  return m[tipo] ?? 'nota'
}

// ── Detección de intención de cancelación en el texto que escribe el asesor ──
// No cambia la cuenta a "cancelado" solo por una palabra — eso requiere
// confirmación humana. Sube el estado a "en_riesgo" (si estaba "activo") y
// deja una nota visible en Observaciones KAM para que el KAM/supervisor lo
// verifique. Ver [[atlas_dashboard_contrast_architecture]]-style: detectar y
// avisar, nunca ejecutar la baja de forma automática.
const RX_CANCELACION = /cancelar|cancelaci[oó]n|dar(?:se)? de baja|no (?:va|van) a renovar|no renovar[áa]?|quiere(?:n)? (?:darse de )?baja|termin(?:ar|ó) (?:el )?(?:servicio|contrato)|cerrar (?:la )?cuenta/i

async function etiquetarSiHayIntencionDeCancelacion(cuentaId: string, texto: string, actividadId: string) {
  if (!texto || !RX_CANCELACION.test(texto)) return
  try {
    const { data: cuenta } = await supabaseAdmin
      .from('cuentas')
      .select('estado, observaciones_kam')
      .eq('id', cuentaId)
      .single()
    if (!cuenta) return

    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    const nota  = `🔴 [Detectado automáticamente ${fecha} · actividad] Posible intención de cancelación en el reporte del asesor — verificar con el cliente antes de dar de baja. Texto: "${texto.slice(0, 240)}"`
    // Pasa por `anteponerEntrada` para que la nota quede fechada como una
    // entrada más de la bitácora. Antes se pegaba suelta y, al no traer
    // separador, la ficha la leía como parte del resumen de esa semana.
    const observacionesNuevas = anteponerEntrada(cuenta.observaciones_kam, nota, 'sistema')

    const patch: Record<string, unknown> = { observaciones_kam: observacionesNuevas }
    if (cuenta.estado === 'activo') patch.estado = 'en_riesgo'

    await supabaseAdmin.from('cuentas').update(patch).eq('id', cuentaId)
  } catch (e) {
    console.warn(`[Actividades ${actividadId}] No se pudo etiquetar intención de cancelación:`, e)
  }
}

interface ActualRow {
  id: string; tipo: string; cuenta_id: string | null; empresa: string
  descripcion: string; asesor: string; completada: boolean
  iniciada_en?: string | null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // Cronómetro (iniciada_en, tiempo_medido_min, tiempo_reportado_min) requiere
    // una migración en `actividades` que puede no haberse corrido todavía —
    // se lee/escribe con fallback para no romper el flujo de completar/no
    // realizar que ya funciona hoy en el resto de las actividades semanales.
    let actual: ActualRow | null = null
    {
      const { data, error } = await supabaseAdmin
        .from('actividades')
        .select('id, tipo, cuenta_id, empresa, descripcion, asesor, completada, iniciada_en')
        .eq('id', params.id)
        .single()
      if (error) {
        const { data: dataFallback, error: errFallback } = await supabaseAdmin
          .from('actividades')
          .select('id, tipo, cuenta_id, empresa, descripcion, asesor, completada')
          .eq('id', params.id)
          .single()
        if (errFallback || !dataFallback) return NextResponse.json({ error: errFallback?.message ?? 'Actividad no encontrada' }, { status: 404 })
        actual = dataFallback as ActualRow
      } else {
        actual = data as ActualRow
      }
    }
    if (!actual) return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })

    // ── Elegibilidad al momento de actuar ────────────────────────────────────
    // Se revalida antes de iniciar el cronómetro y antes de completar, pero el
    // desenlace depende de POR QUÉ la cuenta dejó de ser elegible.
    //
    // INSTRUCCIÓN DE DIRECCIÓN (9-sep-2026): "si tiene una actividad debe
    // seguir el curso de justificar porque se dio, acciones, etc."
    //
    // Antes, cualquier inelegibilidad mataba la actividad (estado 'bloqueada'
    // + 409). Cuando la causa era la baja de la cuenta eso era exactamente lo
    // contrario de lo que se necesita: el asesor se quedaba SIN forma de
    // registrar por qué se perdió al cliente y qué se intentó — la información
    // más valiosa que produce un churn. La actividad moría muda.
    //
    // Ahora la baja comercial NO detiene la actividad: se deja seguir su curso
    // para que se documente el cierre. Lo que sigue siendo fail-closed es
    // GENERAR actividades nuevas sobre esa cuenta — eso vive en
    // app/api/actividades/generar/route.ts y no se toca (regla del 24-ago-2026).
    if ((body.accion === 'iniciar' || body.completada) && actual.cuenta_id) {
      const eleg = await revalidarCuenta(actual.cuenta_id, actual.tipo)
      if (!eleg.elegible && !BAJA_COMERCIAL.has(String(eleg.codigo)) && body.accion === 'iniciar') {
        // Aquí la causa NO es la baja, es falta de datos (contacto incompleto)
        // o estatus no validable. Ese bloqueo sí se conserva porque es un
        // empujón para capturar lo que falta — pero SOLO al ARRANCAR. Nunca al
        // cerrar: una actividad ya iniciada jamás debe quedar atrapada sin
        // poder documentarse.
        await bloquearActividad(actual.id, eleg.motivo!)
        return NextResponse.json({
          error:  eleg.motivo,
          codigo: eleg.codigo,
          contactoFaltante: eleg.contactoFaltante,
          bloqueada: true,
        }, { status: 409 })
      }
    }

    // ── Iniciar cronómetro — clic en "Iniciar actividad" ─────────────────────
    if (body.accion === 'iniciar') {
      if (actual.iniciada_en) return NextResponse.json(actual) // ya estaba iniciada, no reiniciar el reloj
      const { data, error } = await supabaseAdmin
        .from('actividades')
        .update({ iniciada_en: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single()
      if (error) {
        // Columna aún no existe en Supabase (falta correr la migración) — no
        // rompemos la actividad, solo dejamos el reloj sin iniciar por ahora.
        return NextResponse.json({ ...actual, migracionPendiente: true })
      }
      return NextResponse.json(data)
    }

    // ── Marcar como completada ────────────────────────────────────────────────
    let extra: Record<string, unknown> = {}
    if (body.completada) {
      // Gate: "Completar Perfil" (Radar de Cuenta incluido) solo se puede cerrar
      // si los datos críticos de la cuenta y las 12 preguntas del Radar ya están
      // guardados de verdad — no basta con escribir un resultado.
      if (actual.tipo === 'validacion' && actual.cuenta_id) {
        const { data: cuenta } = await supabaseAdmin
          .from('cuentas')
          .select(CAMPOS_GAP_SELECT)
          .eq('id', actual.cuenta_id)
          .single()

        const { data: radarRow } = await supabaseAdmin
          .from('radar_respuestas')
          .select('respuestas')
          .eq('cuenta_id', actual.cuenta_id)
          .order('creado_en', { ascending: false })
          .limit(1)

        if (cuenta) {
          const gaps      = detectDataGaps(cuenta as CuentaGapInput)
          const criticos  = gaps.filter(g => g.nivel === 'critico')
          const respuestas = radarRow?.[0]?.respuestas ?? null
          const radarResp  = contarRespuestasRadar(respuestas)
          const radarFaltan = preguntasRadarFaltantes(respuestas)

          if (criticos.length > 0 || radarResp < 12) {
            return NextResponse.json({
              error: 'Esta actividad no se puede marcar como completada: aún faltan datos por registrar en la cuenta.',
              perfilFaltante: criticos.map(g => g.campo),
              radarFaltante:  radarFaltan.map(p => `${p.n}. ${p.texto}`),
              radarRespondidas: radarResp,
            }, { status: 409 })
          }
        }
      }

      /* ── Candado de ACLARACIÓN por Churn confirmado / Downgrade ────────────
       * Instrucción de dirección (9-sep-2026): la actividad "no se cierra
       * hasta cumplir con el requisito de la aclaración explícita, con las
       * acciones previas".
       *
       * Va ANTES del candado general porque es más estricto y más específico:
       * exige DOS campos separados (causa y acciones previas), no un texto
       * único. Con un solo cuadro, "se fue por precio" pasa el mínimo y no
       * dice nada de lo que se intentó, que es el aprendizaje que se busca. */
      if (actual.tipo === TIPO_ACLARACION) {
        const vered = validarCierreAclaracion({
          causa:           body.aclaracion_causa,
          accionesPrevias: body.aclaracion_acciones,
        })
        if (!vered.permitido) {
          return NextResponse.json({
            error:     vered.mensaje,
            codigo:    'aclaracion_incompleta',
            faltantes: vered.faltantes,
          }, { status: 409 })
        }
        // El resultado guardado conserva la estructura de los dos campos.
        body.resultado = componerResultadoAclaracion(
          String(body.aclaracion_causa), String(body.aclaracion_acciones),
        )
      }

      /* ── Candado del SEGUIMIENTO por foco de riesgo ────────────────────────
       * Instrucción de dirección (25-sep-2026): «si responden que el cliente no
       * quiere o cualquier respuesta corta, oblígalos a que te expliquen y
       * detallen qué acciones tomaron, a quién le presentaron, si es la persona
       * correcta, por qué no contratan más servicios, una integración, etc.»
       *
       * Tres campos separados, como la aclaración y por el mismo motivo: con un
       * solo cuadro de texto, «el cliente no quiere» pasa cualquier mínimo de
       * longitud si lo acompañan de relleno. Separados, el hueco se ve.
       *
       * NO exime del candado general de abajo, a diferencia de la aclaración.
       * Ahí está lo que este validador no sabe hacer: una baja declarada abre
       * expediente en vez de cerrar. Un seguimiento donde el cliente anuncia que
       * se va tiene que abrir ese expediente igual que cualquier otra actividad.
       */
      if (actual.tipo === TIPO_FOCO) {
        const vered = validarCierreSeguimiento({
          contacto: body.seguimiento_contacto,
          acciones: body.seguimiento_acciones,
          motivo:   body.seguimiento_motivo,
        })
        if (!vered.permitido) {
          return NextResponse.json({
            error:     vered.mensaje,
            codigo:    'seguimiento_incompleto',
            faltantes: vered.faltantes,
          }, { status: 409 })
        }
        body.resultado = componerResultadoSeguimiento(
          String(body.seguimiento_contacto), String(body.seguimiento_acciones),
          String(body.seguimiento_motivo),
        )

        /* ── MAPA DE DECISORES: se valida sobre la FICHA, no sobre el texto ──
         * El producto de este trabajo no es un párrafo, son personas guardadas
         * en la cuenta. Validarlo leyendo prosa sería adivinar si un nombre
         * propio aparece en una frase; validarlo contra `contactos_json` es
         * verificable y no se puede simular escribiendo bonito.
         *
         * Es el mismo patrón que ya usa «Completar Perfil», que exige los datos
         * guardados y las 12 preguntas del Radar respondidas de verdad.
         *
         * SE PIDE por Clikauto (25 sep 2026): la actividad se llamaba «Mapa de
         * decisores» y se cerró con UN nombre, el que la propia ficha clasifica
         * como «Contacto Operativo». Opera, no decide.
         *
         * LA ESCOTILLA Y QUIÉN LA ABRE: hay cuentas donde de verdad decide una
         * sola persona —un dueño, una empresa de tres—. Para ésas el asesor
         * marca `decisor_unico`, pero eso NO cierra la actividad: registra la
         * investigación y la deja esperando. Daniel Martínez da el Vobo y
         * dirección instruye el cierre. Una escotilla que abre quien la usa no
         * es una escotilla, es un botón de saltarse el trabajo.
         * Instrucción de dirección, 25 sep 2026.
         */
        if (trabajoDeDescripcion(actual.descripcion) === 'decisores' && actual.cuenta_id) {
          const { data: ficha } = await supabaseAdmin
            .from('cuentas')
            .select('contacto_nombre, contacto_cargo, contacto_email, contacto_tel, contactos_json')
            .eq('id', actual.cuenta_id)
            .single()

          // Fail-OPEN a propósito: si no se puede leer la ficha, no se le
          // atribuye al asesor un trabajo mal hecho. El resto de candados sigue.
          if (ficha) {
            const gente = personasDeCuenta(ficha as never).filter(p => p.nombre)
            const conCargo = gente.filter(p => p.cargo)
            const unico = body.decisor_unico === true
            const motivo = String(body.seguimiento_motivo ?? '').trim()
            /* Quien cierra con la escotilla abierta tiene que ser dirección, y
               se identifica por la cabecera que pone el middleware — no por un
               campo del cuerpo, que lo pondría cualquiera. */
            const quien = req.headers.get('x-user-email')
            const autorizando = body.autorizar_decisor_unico === true
              && puedeAutorizarDecisorUnico(quien)

            if (!unico && !autorizando && conCargo.length < 2) {
              return NextResponse.json({
                error: 'El Mapa de Decisores no se puede cerrar todavía: sigue habiendo ' +
                       `${conCargo.length === 0 ? 'ninguna persona' : 'una sola persona'} con nombre y ` +
                       'cargo en la ficha de la cuenta.',
                codigo: 'decisores_incompleto',
                faltantes: [
                  'Registra en la ficha de la cuenta (sección Contactos) al menos DOS personas ' +
                  'con NOMBRE y CARGO. El trabajo de esta actividad es que queden guardadas: ' +
                  'un decisor que encuentras y no guardas se pierde igual que si no lo hubieras ' +
                  'encontrado.',
                  'Clasifícalas: quién DECIDE (autoriza el gasto), quién INFLUYE y quién OPERA. ' +
                  'Si todos los que tienes operan, el mapa está incompleto y eso es el hallazgo.',
                  'Si de verdad decide una sola persona en esta cuenta, marca «solo existe un ' +
                  `decisor» y explica por qué en el campo 3 (mínimo ${MIN_MOTIVO_DECISOR_UNICO} ` +
                  'caracteres): tamaño de la empresa, estructura, a quién reporta y qué pasaría ' +
                  'si esa persona se va.',
                ],
                personasRegistradas: gente.length,
                conCargo: conCargo.length,
              }, { status: 409 })
            }

            if (unico && !autorizando && motivo.length < MIN_MOTIVO_DECISOR_UNICO) {
              return NextResponse.json({
                error: 'Declaraste que solo existe un decisor. Esa es una afirmación fuerte sobre ' +
                       'la cuenta y necesita sustento.',
                codigo: 'decisor_unico_sin_sustento',
                faltantes: [
                  `Explica en el campo 3, con al menos ${MIN_MOTIVO_DECISOR_UNICO} caracteres: ` +
                  'cuántas personas tiene la empresa, quién autoriza el gasto, a quién reporta esa ' +
                  'persona, y qué pasaría con la cuenta si mañana deja la empresa.',
                ],
              }, { status: 409 })
            }

            /* Y ADEMÁS: hay que decir QUIÉN DECIDE, por nombre.
             *
             * Contar personas no basta. Clikauto ya tenía dos registradas
             * —«Contacto Operativo» y «Aclaraciones»— así que habría cerrado el
             * mapa sin que nadie identificara a un decisor. Dos contactos
             * operativos no son un mapa: son la misma dependencia repartida.
             *
             * El nombre tiene que existir en la ficha, así que no se puede
             * cumplir escribiendo bien. Y como queda registrado con su cargo,
             * declarar que decide el contacto operativo se lee solo. */
            const decisor = buscaDecisor(ficha as never, body.seguimiento_decide)
            if (!decisor) {
              const declarado = String(body.seguimiento_decide ?? '').trim()
              return NextResponse.json({
                error: declarado
                  ? `«${declarado}» no está registrada en la ficha de esta cuenta, así que no se ` +
                    'puede dar por identificada.'
                  : 'Falta lo principal del mapa: QUIÉN DECIDE, por nombre.',
                codigo: 'decisor_no_identificado',
                faltantes: [
                  'Escribe el NOMBRE de quien autoriza el gasto en esta cuenta. Tiene que ser una ' +
                  'de las personas registradas en la ficha — si la encontraste y no la has ' +
                  'guardado, guárdala primero en la sección Contactos.',
                  gente.length
                    ? `Personas registradas hoy: ${gente.map(p => p.nombre + (p.cargo ? ` (${p.cargo})` : '')).join(' · ')}.`
                    : 'Hoy no hay ninguna persona registrada en la ficha.',
                  'Si ninguna de ellas decide, ése ES el hallazgo: significa que la cuenta se ' +
                  'sostiene sobre gente que opera, y hay que subir un nivel.',
                ],
              }, { status: 409 })
            }

            // La declaración queda dentro del resultado, con el cargo tal como
            // está registrado. Es lo que hace auditable la afirmación.
            body.resultado = `DECIDE: ${decisor.nombre}` +
              (decisor.cargo ? ` — ${decisor.cargo}` : ' — SIN CARGO REGISTRADO') +
              (unico ? ' (declarado como único decisor de la cuenta)' : '') +
              `\n\n${body.resultado}`

            /* ── LA ESCOTILLA NO LA ABRE QUIEN LA USA ──────────────────────
             * Instrucción de dirección, 25 sep 2026: «puede ser que alguna
             * cuenta tenga esa limitante, pero si ya se investigó deberá
             * solicitar autorización a Daniel Martínez para que se cierre la
             * actividad, con la nota de la investigación y el OK de Daniel
             * Martínez», y después: «con que me lo pase a mí Daniel o el asesor
             * con el Vobo. Yo te daré la instrucción de dar por concluida la
             * actividad.»
             *
             * Así que el sistema hace UNA cosa y la hace bien: guarda la
             * investigación y deja la actividad ABIERTA, esperando. El Vobo de
             * Daniel y la instrucción de dirección viajan fuera del tablero —es
             * como trabaja dirección— y el cierre se ejecuta con
             * `autorizar_decisor_unico`, que solo vale desde un correo de la
             * lista (ver `puedeAutorizarDecisorUnico`).
             *
             * Para ver qué hay esperando: `python scripts/autorizaciones.py`. */
            if (unico && !autorizando) {
              const hoy = hoyEnMexico()
              const nota = marcaSolicitudAutorizacion(hoy, String(body.resultado))
              const { error: errSol } = await supabaseAdmin
                .from('actividades')
                .update({
                  motivo_pendiente: nota,
                  tiempo_reportado_min: Number(body.tiempo_reportado_min) || null,
                  actualizado_en: new Date().toISOString(),
                })
                .eq('id', params.id)

              if (errSol) return NextResponse.json({ error: errSol.message }, { status: 500 })

              return NextResponse.json({
                error: 'Tu investigación quedó registrada y la actividad queda en espera de ' +
                       `autorización. Pásasela a ${AUTORIZA_NOMBRE} con tu resumen para su Vobo; ` +
                       'el cierre lo instruye Dirección.',
                codigo: 'autorizacion_solicitada',
                faltantes: [
                  'No tienes que volver a capturarla: la nota ya quedó guardada en la actividad.',
                  'Mientras tanto la actividad sigue abierta y contando — no es un cierre.',
                ],
                solicitudEnviada: true,
              }, { status: 409 })
            }

            if (autorizando) {
              // El sello dice quién autorizó y cuándo. Va dentro del resultado
              // para que quede en el expediente de la cuenta, no solo en un log.
              body.resultado = `${selloAutorizacion(String(quien), hoyEnMexico())}\n\n${body.resultado}`
              body.motivo_pendiente = null
            }
          }
        }
      }

      /* ── Candado de calidad del cierre (1 Sep 2026) ────────────────────────
       * Antes bastaba cualquier texto para cerrar. Ahora una declaración de
       * baja abre expediente en vez de cerrar, "no contesta" abre secuencia, y
       * una respuesta sin análisis no pasa. Ver lib/actividades/cierre.ts.
       *
       * Importante: la cuenta NO cambia de estatus por lo que escriba el
       * asesor. Se etiqueta como riesgo y se avisa; la baja la valida
       * Dirección con la evidencia del expediente. */
      /* Una ACLARACIÓN no pasa por este candado: ya pasó por el suyo, que es
       * más estricto (dos campos obligatorios, mínimo de longitud y rechazo de
       * relleno, contra un solo texto libre aquí).
       *
       * No basta con marcarle `expedienteAdjunto`: eso solo exime la regla 1
       * ("declaración de baja"). Las reglas 2 y 3 seguirían aplicando, y son
       * justamente las que más chocan con una aclaración bien escrita:
       *   · regla 2 rechaza los textos con "no contesta" — una causa de baja
       *     perfectamente real;
       *   · regla 3 rechaza los de cambio de interlocutor, que el propio
       *     archivo describe como "una de las causas más frecuentes de baja".
       * Un asesor que explicara con precisión POR QUÉ se fue el cliente se
       * habría quedado sin poder cerrar la actividad. */
      if (actual.tipo !== TIPO_ACLARACION) {
        const veredicto = evaluarCierre({
          resultado: body.resultado,
          tipo: actual.tipo,
          expedienteAdjunto:   body.expediente_baja === true,
          secuenciaRegistrada: body.secuencia_contacto === true,
        })

        if (!veredicto.permitido) {
          // Una declaración de baja se registra aunque la actividad no cierre:
          // deja la cuenta en riesgo y la nota visible para el supervisor.
          if (
            (veredicto.codigo === 'declaracion_baja' || veredicto.codigo === 'declaracion_downgrade') &&
            actual.cuenta_id
          ) {
            await etiquetarSiHayIntencionDeCancelacion(actual.cuenta_id, String(body.resultado ?? ''), actual.id)
          }
          return NextResponse.json({
            error:     veredicto.mensaje,
            codigo:    veredicto.codigo,
            exige:     veredicto.exige,
            preguntas: veredicto.preguntas,
            cierreBloqueado: true,
          }, { status: 409 })
        }
      }

      // Auto-reporte de tiempo — obligatorio para cerrar cualquier actividad.
      const tiempoReportado = Number(body.tiempo_reportado_min)
      if (!tiempoReportado || tiempoReportado <= 0) {
        return NextResponse.json({ error: 'Indica cuánto tiempo te tomó esta actividad antes de marcarla como completada.' }, { status: 400 })
      }

      const tiempoMedido = actual.iniciada_en
        ? Math.max(1, Math.round((Date.now() - new Date(actual.iniciada_en).getTime()) / 60000))
        : null

      extra = { tiempo_reportado_min: tiempoReportado, tiempo_medido_min: tiempoMedido }
    }

    // Campos de control del candado de cierre: viajan en el body pero NO son
    // columnas de `actividades`. Si se colaran al update, romperían el cierre.
    const {
      expediente_baja: _eb, secuencia_contacto: _sc,
      // Los dos campos de la Aclaración de baja tampoco son columnas: el
      // servidor ya los fusionó en `resultado` (componerResultadoAclaracion).
      // Si se colaran aquí, PostgREST respondería "Could not find the
      // 'aclaracion_causa' column" y NINGUNA aclaración podría cerrarse —
      // ni siquiera por el reintento de abajo, que reusa este mismo objeto.
      aclaracion_causa: _ac, aclaracion_acciones: _aa,
      // Los tres del seguimiento por foco, por lo mismo: ya se fusionaron en
      // `resultado` (componerResultadoSeguimiento). Si viajaran al update,
      // PostgREST respondería "Could not find the 'seguimiento_contacto'
      // column" y ningún seguimiento podría cerrarse.
      seguimiento_contacto: _sgc, seguimiento_acciones: _sga, seguimiento_motivo: _sgm,
      // La escotilla del Mapa de Decisores tampoco es columna: es una señal
      // para el candado de arriba, y ya se consumió ahí.
      decisor_unico: _du, seguimiento_decide: _sd, autorizar_decisor_unico: _ad,
      ...bodyColumnas
    } = body as Record<string, unknown>
    void _eb; void _sc; void _ac; void _aa; void _sgc; void _sga; void _sgm
    void _du; void _sd; void _ad

    let { data, error } = await supabaseAdmin
      .from('actividades')
      .update({ ...bodyColumnas, ...extra, actualizado_en: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error && Object.keys(extra).length > 0) {
      // Columnas de tiempo aún no existen en Supabase — reintenta sin ellas
      // para no bloquear el cierre de la actividad (que ya funcionaba antes).
      ;({ data, error } = await supabaseAdmin
        .from('actividades')
        .update({ ...bodyColumnas, actualizado_en: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single())
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Si se marcó como completada: crear seguimiento KAM + actualizar ultimo_contacto
    if (body.completada && data.cuenta_id) {
      // El seguimiento se fecha en el día de México. Con `toISOString()`, una
      // actividad cerrada a las 19:00 quedaba registrada como del día siguiente.
      const today = hoyEnMexico()

      await supabaseAdmin.from('seguimientos').insert({
        cuenta_id:    data.cuenta_id,
        fecha:        today,
        tipo:         mapTipo(data.tipo),
        descripcion:  data.descripcion,
        resultado:    body.resultado ?? null,
        asesor:       data.asesor,
        duracion_min: data.tiempo_medido_min ?? null,
      })

      await supabaseAdmin
        .from('cuentas')
        .update({ ultimo_contacto: today })
        .eq('id', data.cuenta_id)
    }

    // Cualquier actividad (completada o no) puede traer una señal de baja en
    // el texto que escribió el asesor — se revisa siempre, no solo en "validación".
    if (data.cuenta_id) {
      const texto = body.completada ? body.resultado : body.motivo_pendiente
      if (texto) await etiquetarSiHayIntencionDeCancelacion(data.cuenta_id, String(texto), data.id)
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
