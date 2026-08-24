import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID
const LTV_TOP_THRESHOLD = 2500 // Cancelaciones con LTV > $2,500 son TOP

interface CancelacionDetectada {
  empresa: string
  cid: string
  ltv: number
  ultimoPago: { monto: number; fecha: string }
  mesesEnCallpicker: number
  esTop: boolean
}

/**
 * POST /api/slack/sync-cancelaciones
 * Lee canal #alertas-cuentas-canceladas y actualiza cuentas canceladas
 * Si una cuenta TOP (LTV > $2,500) está cancelada, actualiza su estado
 */
export async function POST(request: Request) {
  try {
    if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
      return NextResponse.json(
        { error: 'SLACK_BOT_TOKEN o SLACK_CHANNEL_ID no configurados' },
        { status: 400 }
      )
    }

    // 1. Leer últimos 7 días del canal Slack
    const now = Math.floor(Date.now() / 1000)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60

    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL_ID}&oldest=${sevenDaysAgo}&limit=100`,
      { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } }
    )

    const slackData = await res.json()
    if (!slackData.ok) {
      return NextResponse.json(
        { error: `Slack API: ${slackData.error}` },
        { status: 400 }
      )
    }

    // 2. Parsear mensajes para encontrar cancelaciones
    const cancelaciones = parseCancelaciones(slackData.messages || [])

    // 3. Filtrar TOP (LTV > $2,500)
    const cancelacionesTop = cancelaciones.filter(c => c.esTop)

    // 4. Actualizar en Supabase
    const resultados = []
    for (const canc of cancelacionesTop) {
      const { data, error } = await supabaseAdmin
        .from('cuentas')
        .update({
          estado: 'cancelado',
          fecha_cancelacion: new Date().toISOString(),
          motivo_cancelacion: `Cancelación detectada (LTV: $${canc.ltv}) - Slack sync ${new Date().toLocaleDateString('es-MX')}`,
        })
        .eq('cid', parseInt(canc.cid))
        .select()

      if (error) {
        resultados.push({ cid: canc.cid, empresa: canc.empresa, status: 'error', error: error.message })
      } else {
        resultados.push({ cid: canc.cid, empresa: canc.empresa, status: 'actualizado', ltv: canc.ltv })
      }
    }

    return NextResponse.json({
      success: true,
      totalDetectadas: cancelaciones.length,
      totalTop: cancelacionesTop.length,
      actualizaciones: resultados,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

/**
 * Parsea mensajes de Slack para extraer cancelaciones
 * Busca patrón: "Empresa (CID xxx)" + "LTV: $X"
 */
function parseCancelaciones(messages: any[]): CancelacionDetectada[] {
  const cancelaciones: CancelacionDetectada[] = []

  for (const msg of messages) {
    if (!msg.text) continue

    const lines = msg.text.split('\n')
    let i = 0

    while (i < lines.length) {
      const line = lines[i].trim()

      // Buscar patrón: "• Empresa (CID 123456)"
      const cidMatch = line.match(/•\s+(.+?)\s+\(CID\s+(\d+)\)/)
      if (!cidMatch) {
        i++
        continue
      }

      const empresa = cidMatch[1]
      const cid = cidMatch[2]
      let ltv = 0
      let ultimoPago = { monto: 0, fecha: '' }
      let mesesEnCallpicker = 0

      // Leer líneas siguientes para extraer datos
      i++
      while (i < lines.length && !lines[i].trim().startsWith('•')) {
        const dataLine = lines[i].trim()

        // Último pago: $1,135.64 · 2026-06-24
        const pagoMatch = dataLine.match(/Último pago:\s*\$([0-9,]+\.?\d*)\s*·\s*(\d{4}-\d{2}-\d{2})/)
        if (pagoMatch) {
          ultimoPago = {
            monto: parseFloat(pagoMatch[1].replace(/,/g, '')),
            fecha: pagoMatch[2],
          }
        }

        // LTV: $2,937.00
        const ltvMatch = dataLine.match(/LTV:\s*\$([0-9,]+\.?\d*)/)
        if (ltvMatch) {
          ltv = parseFloat(ltvMatch[1].replace(/,/g, ''))
        }

        // Meses en Callpicker: 2
        const mesesMatch = dataLine.match(/Meses en Callpicker:\s*(\d+)/)
        if (mesesMatch) {
          mesesEnCallpicker = parseInt(mesesMatch[1])
        }

        i++
      }

      if (ltv > 0) {
        cancelaciones.push({
          empresa,
          cid,
          ltv,
          ultimoPago,
          mesesEnCallpicker,
          esTop: ltv > LTV_TOP_THRESHOLD,
        })
      }
    }
  }

  return cancelaciones
}
