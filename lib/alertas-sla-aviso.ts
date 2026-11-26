import { Resend } from 'resend'
import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { normalizaAsesor } from '@/lib/dueno'
import { leeConfiguracion, anota } from '@/lib/alertas-sla-sync'
import {
  semaforoDe, ordenaCola, escalamientoDe,
  type EstadoSla, type SeveridadSla, type Semaforo,
} from '@/lib/alertas-sla'
import { cuerpoDeAviso, type LineaAviso } from '@/lib/alertas-sla-correo'

/**
 * EL AVISO DIARIO POR CORREO — §7 del encargo
 *
 * ── VIENE APAGADO, Y ESO ES A PROPÓSITO ───────────────────────────────────
 *
 * Sin `SLA_CORREO=1` en el entorno, esto NO manda nada: calcula el lote y
 * devuelve lo que habría mandado. Un correo diario a los tres ejecutivos y a
 * dirección es una acción hacia afuera y la enciende quien responde por el
 * equipo, no quien escribe el código. Encenderlo es una variable; apagarlo,
 * quitarla.
 *
 * ── UN CORREO POR PERSONA Y DÍA, NO UNO POR ALERTA ────────────────────────
 *
 * El encargo pide «nunca más de una notificación por alerta por día». Un
 * resumen por persona lo cumple por construcción y además es lo único que se
 * lee: cuarenta correos en una mañana se archivan sin abrir, y entonces el
 * aviso que importaba —la crítica vencida— se pierde entre los otros treinta y
 * nueve. Quien decide QUÉ alerta entra en el resumen es `tocaNotificar`, en la
 * corrida del cron, que ya escribió `notificada_el`.
 *
 * ── QUÉ LLEVA, Y QUÉ NO ───────────────────────────────────────────────────
 *
 * Lleva nombre de cuenta, consecutivo, qué condición, para cuándo y cuánto
 * factura. NO lleva teléfonos, contactos, correos de cliente ni prosa de
 * seguimientos: un correo se reenvía, y lo que no hace falta para decidir a
 * quién llamar hoy no tiene por qué salir del tablero.
 *
 * ── Y SI EL CORREO SE CAE, NO SE CAE EL CRON ──────────────────────────────
 *
 * El aviso es el último paso de la corrida y su falla se publica aparte. Que
 * Resend esté caído no puede impedir que los compromisos se sincronicen: lo
 * segundo es el dato, lo primero es sólo cómo se cuenta.
 */

const REMITENTE = process.env.RESEND_FROM || 'Callpicker CS <noreply@callpicker.com>'

export interface ResultadoAviso {
  /** `false` cuando `SLA_CORREO` no está en 1: se calculó y no se mandó. */
  enviado: boolean
  porque: string
  /** A quién iba, con cuántas alertas. Sin direcciones: se publica en un JSON. */
  lote: Array<{ para: string; alertas: number; vencidas: number; criticas: number }>
  fallas: string[]
}

interface FilaAviso {
  id: string
  cuenta_id: string
  condicion: string
  severidad: SeveridadSla
  estado: EstadoSla
  fecha_limite: string
  fecha_atendida: string | null
  nivel_escalamiento: number
  notificada_el: string | null
  accion_sugerida: string
  mrr_en_riesgo: number | null
}

const CAMPOS = 'id, cuenta_id, condicion, severidad, estado, fecha_limite, fecha_atendida, nivel_escalamiento, notificada_el, accion_sugerida, mrr_en_riesgo' as const

const dinero = (n: number | null) =>
  n === null ? 'sin importe'
             : `$${Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`

export async function avisoDiarioSla(): Promise<ResultadoAviso> {
  const hoy = hoyEnMexico()
  const encendido = process.env.SLA_CORREO === '1'
  const fallas: string[] = []

  if (!process.env.RESEND_API_KEY) {
    return { enviado: false, lote: [], fallas: [],
             porque: 'no hay RESEND_API_KEY en el entorno' }
  }

  const cfg = await leeConfiguracion()
  /* SIN CALENDARIO NO SE AVISA. El semáforo del correo saldría de una cuenta de
     días hábiles sin festivos, así que acusaría de vencidas alertas que no lo
     están — y un aviso falso quema el canal para siempre. */
  if (cfg.calendario.falla) {
    return { enviado: false, lote: [], fallas: [cfg.calendario.falla],
             porque: 'no se pudo leer el calendario de días inhábiles' }
  }

  let filas: FilaAviso[]
  try {
    filas = await traerPorPaginas<FilaAviso>((d, h) =>
      supabaseAdmin.from('alertas_sla').select(CAMPOS).neq('estado', 'cerrada').range(d, h))
  } catch (e) {
    if (esTablaInexistente(e)) {
      return { enviado: false, lote: [], fallas: [],
               porque: 'no hay compromisos que avisar: falta correr la migración' }
    }
    return { enviado: false, lote: [], fallas: [(e as Error)?.message ?? 'error'],
             porque: 'no se pudieron leer los compromisos' }
  }

  /* El dueño sale de `cuentas.asesor` AL LEER, nunca de `asesor_apertura`: la
     cartera se rebalancea y el correo tiene que llegarle a quien la tiene hoy. */
  const { data: cs, error: eCs } = await supabaseAdmin
    .from('cuentas').select('id, asesor, empresa, consecutivo')
  if (eCs) {
    return { enviado: false, lote: [], fallas: [eCs.message],
             porque: 'no se pudo leer la cartera' }
  }
  const cuenta = new Map<string, { asesor: string; empresa: string; consecutivo: string }>()
  for (const c of (cs ?? []) as Array<Record<string, unknown>>) {
    cuenta.set(String(c.id), {
      asesor: String(c.asesor ?? ''),
      empresa: String(c.empresa ?? 'cuenta sin nombre'),
      consecutivo: String(c.consecutivo ?? ''),
    })
  }

  /* Los correos salen de `usuarios`, y SÓLO de los activos. Mandarle el resumen
     a alguien dado de baja es entregarle cartera a quien ya no la tiene. */
  const { data: us, error: eUs } = await supabaseAdmin
    .from('usuarios').select('email, nombre, rol, asesor_nombre, activo')
  if (eUs) {
    return { enviado: false, lote: [], fallas: [eUs.message],
             porque: 'no se pudo leer la tabla de usuarios' }
  }
  const correoDe = new Map<string, { email: string; nombre: string }>()
  for (const u of (us ?? []) as Array<Record<string, unknown>>) {
    if (u.activo !== true) continue
    const nombreAsesor = String(u.asesor_nombre ?? '').trim()
    if (!nombreAsesor) continue
    correoDe.set(normalizaAsesor(nombreAsesor),
                 { email: String(u.email), nombre: String(u.nombre ?? nombreAsesor) })
  }

  /* ── El semáforo de cada compromiso, y a quién le toca ─────────────────── */
  type Linea = FilaAviso & { semaforo: Semaforo; empresa: string
                             consecutivo: string; mrr: number | null }
  const porAsesor = new Map<string, Linea[]>()
  const paraDireccion: Linea[] = []

  for (const f of filas) {
    const c = cuenta.get(String(f.cuenta_id))
    if (!c) continue
    const semaforo = semaforoDe(
      { estado: f.estado, severidad: f.severidad,
        fechaLimite: String(f.fecha_limite).slice(0, 10),
        fechaAtendida: f.fecha_atendida ? String(f.fecha_atendida).slice(0, 10) : null },
      hoy, cfg.calendario.inhabiles, cfg.parametros)

    /* SÓLO ENTRA LO QUE APREMIA. Un resumen con las cuarenta abiertas, incluidas
       las que vencen la semana que viene, es la forma más rápida de que el
       correo deje de abrirse. Entra lo que vence hoy o ya venció. */
    const esc3 = escalamientoDe(semaforo)
    if (esc3.nivel === 0) continue

    const linea: Linea = { ...f, semaforo, empresa: c.empresa,
                           consecutivo: c.consecutivo,
                           mrr: f.mrr_en_riesgo === null ? null : Number(f.mrr_en_riesgo) }
    const clave = normalizaAsesor(c.asesor)
    const lista = porAsesor.get(clave) ?? []
    lista.push(linea)
    porAsesor.set(clave, lista)
    if (esc3.nivel === 3) paraDireccion.push(linea)
  }

  const lote: ResultadoAviso['lote'] = []

  /* ── 1 · UN RESUMEN POR EJECUTIVO ──────────────────────────────────────── */
  for (const [clave, lineas] of porAsesor.entries()) {
    const quien = correoDe.get(clave)
    if (!quien) {
      /* SE DICE, no se calla: una cartera con alertas vencidas y sin usuario
         activo a quien avisar es un hueco de administración, no un cero. */
      fallas.push(`la cartera «${clave || 'sin asesor'}» tiene ${lineas.length} `
                + 'alertas que avisar y ningún usuario activo con ese nombre')
      continue
    }
    const ordenadas = ordenaCola(lineas.map(l => ({ ...l, mrr: l.mrr })))
    const vencidas = ordenadas.filter(l => l.semaforo.vencida).length
    const criticas = ordenadas.filter(
      l => l.semaforo.vencida && l.severidad === 'critica').length

    lote.push({ para: quien.nombre, alertas: ordenadas.length, vencidas, criticas })

    if (!encendido) continue
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const r = await resend.emails.send({
        from: REMITENTE,
        to: quien.email,
        subject: criticas > 0
          ? `⚠ ${criticas} alerta${criticas === 1 ? '' : 's'} crítica${criticas === 1 ? '' : 's'} vencida${criticas === 1 ? '' : 's'} en tu cartera`
          : vencidas > 0
            ? `${vencidas} alerta${vencidas === 1 ? '' : 's'} vencida${vencidas === 1 ? '' : 's'} en tu cartera`
            : `${ordenadas.length} alerta${ordenadas.length === 1 ? '' : 's'} vence${ordenadas.length === 1 ? '' : 'n'} hoy`,
        html: cuerpoDeAviso(quien.nombre, ordenadas, hoy),
      })
      /* El SDK de Resend devuelve `{data, error}` y NO lanza: sin mirar `error`
         esto publicaría «enviado» con el correo rechazado. Es el mismo defecto
         que dejó «nuevos: 4, falla: null» un día entero en este repo. */
      if (r.error) fallas.push(`${quien.nombre}: ${r.error.message ?? String(r.error)}`)
    } catch (e) {
      fallas.push(`${quien.nombre}: ${(e as Error)?.message ?? 'error al enviar'}`)
    }
  }

  /* ── 2 · EL NIVEL 3 VA TAMBIÉN A DIRECCIÓN ─────────────────────────────── */
  const admin = process.env.ADMIN_EMAIL
  if (paraDireccion.length > 0 && admin) {
    const criticas = paraDireccion.filter(l => l.severidad === 'critica').length
    lote.push({ para: 'dirección', alertas: paraDireccion.length,
                vencidas: paraDireccion.length, criticas })
    if (encendido) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const r = await resend.emails.send({
          from: REMITENTE,
          to: admin,
          subject: `Tablero de incumplimientos: ${paraDireccion.length} alerta${paraDireccion.length === 1 ? '' : 's'} en nivel 3`,
          html: cuerpoDeAviso('dirección', ordenaCola(paraDireccion), hoy, true),
        })
        if (r.error) fallas.push(`dirección: ${r.error.message ?? String(r.error)}`)
      } catch (e) {
        fallas.push(`dirección: ${(e as Error)?.message ?? 'error al enviar'}`)
      }
    }
  }

  /* El envío se anota en la bitácora SIN alerta concreta: es un hecho del día,
     no de un compromiso. Así queda el rastro de que se avisó —o de que estaba
     apagado— el día que alguien pregunte por qué nadie se enteró. */
  if (lote.length > 0) {
    await anota({
      slaId: null, cuentaId: null, usuario: 'cron', rol: 'sistema',
      evento: 'notificada', deDia: true,
      detalle: { canal: 'correo', enviado: encendido, destinatarios: lote.length,
                 alertas: lote.reduce((a, b) => a + b.alertas, 0),
                 fallas: fallas.length },
    }).catch(() => { /* la bitácora no puede tumbar el aviso */ })
  }

  return {
    enviado: encendido && fallas.length === 0 && lote.length > 0,
    lote,
    fallas,
    porque: !encendido
      ? 'SLA_CORREO no está en 1: el lote se calculó y NO se mandó. '
      + 'Poner SLA_CORREO=1 en el entorno de Vercel para encenderlo.'
      : lote.length === 0
        ? 'no había ninguna alerta que venza hoy o esté vencida'
        : `${lote.length} resumen(es) enviado(s)`,
  }
}

