import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Reporte mensual del book de preguntas.
 *
 * Para qué sirve: la bitácora diaria dice qué pasó ayer; el reporte mensual
 * dice qué NO sabe la plataforma. Cada pregunta que Atlas no pudo contestar es
 * un hueco de conocimiento, y agrupadas por mes muestran dónde hay que cargar
 * datos o construir módulo — no por intuición, sino porque los asesores lo
 * preguntaron y se quedaron sin respuesta.
 *
 * GET /api/chat/reporte-mensual?mes=YYYY-MM  (por omisión, el mes en curso)
 */

interface FilaBitacora {
  fecha:            string
  usuario_email:    string | null
  usuario_nombre:   string | null
  pregunta:         string | null
  tipo:             string | null
  confianza:        string | null
  modulos_contexto: string[] | null
  created_at:       string
}

/** Palabras sin valor temático — no dicen de qué trata la pregunta. */
const VACIAS = new Set([
  'que','cual','cuales','como','donde','cuando','quien','porque','para','por','con','sin',
  'del','las','los','una','uno','unos','unas','the','and','dame','puedes','tengo','hay',
  'este','esta','estos','estas','sus','mis','nos','les','tiene','tienen','son','esta',
  'mas','muy','todo','todos','toda','todas','sobre','entre','desde','hasta','cuenta',
  'cuentas','informacion','favor','necesito','quiero','decir','saber','hacer','ver',
])

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
}

export async function GET(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const hoy = new Date()
  const mes = req.nextUrl.searchParams.get('mes')
    ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'mes debe venir como YYYY-MM' }, { status: 400 })
  }

  // Rango del mes: del día 1 al 1 del siguiente, exclusivo.
  const [anio, m] = mes.split('-').map(Number)
  const desde = `${mes}-01`
  const sigMes = m === 12 ? `${anio + 1}-01-01` : `${anio}-${String(m + 1).padStart(2, '0')}-01`

  const [bitRes, penRes] = await Promise.all([
    supabaseAdmin.from('atlas_bitacora')
      .select('fecha,usuario_email,usuario_nombre,pregunta,tipo,confianza,modulos_contexto,created_at')
      .gte('fecha', desde).lt('fecha', sigMes)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('atlas_pendientes')
      .select('id,pregunta,motivo,usuario_email,usuario_nombre,estado,created_at,resuelto_en')
      .order('created_at', { ascending: false }),
  ])

  if (bitRes.error) {
    return NextResponse.json({ mes, error: bitRes.error.message, total: 0 })
  }

  const filas = (bitRes.data ?? []) as FilaBitacora[]
  const pendientes = penRes.data ?? []

  const cuenta = <T extends string>(xs: T[]) => {
    const acc: Record<string, number> = {}
    for (const x of xs) acc[x] = (acc[x] ?? 0) + 1
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }

  const porUsuario = cuenta(filas.map(f => f.usuario_nombre || f.usuario_email || 'sin identificar'))
  const porTipo    = cuenta(filas.map(f => f.tipo || 'normal'))
  const porDia     = cuenta(filas.map(f => f.fecha))
  const porModulo  = cuenta(filas.flatMap(f => (f.modulos_contexto ?? []).map(x => String(x).split(':')[0])))

  // Temas: palabras significativas repetidas. Es un indicio de sobre qué se
  // pregunta, no una clasificación — por eso se devuelve con su conteo y se
  // corta en las que aparecen al menos dos veces.
  const palabras = filas.flatMap(f =>
    norm(f.pregunta ?? '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 4 && !VACIAS.has(w)))
  const temas = cuenta(palabras).filter(([, n]) => n >= 2).slice(0, 15)

  const delMes = (iso: string) => iso.slice(0, 7) === mes
  const pendientesDelMes = pendientes.filter(p => delMes(p.created_at))
  const abiertos = pendientes.filter(p => p.estado === 'pendiente')
  const resueltosDelMes = pendientes.filter(p => p.estado === 'resuelto' && p.resuelto_en && delMes(p.resuelto_en))

  const sinResponder = filas.filter(f => f.tipo === 'pendiente' || f.tipo === 'requiere_busqueda_web').length
  const pctResueltas = filas.length ? Math.round(((filas.length - sinResponder) / filas.length) * 100) : 0

  return NextResponse.json({
    mes,
    generado: new Date().toISOString(),
    total: filas.length,
    diasConActividad: porDia.length,
    sinResponder,
    pctResueltas,
    porUsuario,
    porTipo,
    porDia,
    porModulo,
    temas,
    // La lista de trabajo: lo que quedó sin contestar, con nombre de quien preguntó.
    pendientesAbiertos: abiertos.map(p => ({
      id: p.id, pregunta: p.pregunta, motivo: p.motivo,
      quien: p.usuario_nombre || p.usuario_email, fecha: p.created_at,
      delMes: delMes(p.created_at),
    })),
    pendientesDelMes: pendientesDelMes.length,
    resueltosDelMes: resueltosDelMes.length,
  })
}
