/**
 * Import script — Top Customer.xlsx → Supabase
 * Run: npx ts-node --project tsconfig.import.json supabase/import.ts "path/to/Top Customer.xlsx"
 */
import * as XLSX from 'xlsx'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function readExcel(filePath: string) {
  return XLSX.readFile(filePath)
}

function getCellValue(ws: XLSX.WorkSheet, row: number, col: string): string {
  const cell = ws[`${col}${row}`]
  if (!cell) return ''
  return String(cell.v ?? '').trim()
}

/** Truncate to max characters — use for every VARCHAR column */
function trunc(val: string | null | undefined, max: number): string | null {
  if (!val) return null
  return val.length > max ? val.slice(0, max) : val
}

function excelDateToISO(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  if (typeof val === 'string') {
    const date = new Date(val)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }
  return null
}

function detectAsesor(text: string, prefix?: string): 'Fátima' | 'Dan' | 'Claudia' {
  const t = text.toLowerCase()
  if (t.includes('fátima') || t.includes('fatima') || t.includes('fã¡tima') || t.includes('gonzalez') || t.includes('gonzález')) return 'Fátima'
  if (t.includes('dan')) return 'Dan'
  if (t.includes('claudia')) return 'Claudia'
  // Fall back to prefix
  if (prefix === 'D') return 'Dan'
  if (prefix === 'C') return 'Claudia'
  return 'Fátima'
}

// ── Parse TOP sheet ───────────────────────────────────────────────────────────
// Columns: A=CONSEC, B=CID(numeric), C=EMPRESA, D=FACTURACION, E=SERVICIO
function parseTopSheet(wb: XLSX.WorkBook) {
  const ws = wb.Sheets['TOP']
  if (!ws) { console.warn('⚠  No TOP sheet found'); return [] }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E200')
  const accounts: { consecutivo: string; empresa: string; facturacion: number; servicio: string }[] = []

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec   = getCellValue(ws, row, 'A')
    const empresa  = getCellValue(ws, row, 'C')
    const facStr   = getCellValue(ws, row, 'D')
    const servicio = getCellValue(ws, row, 'E')

    if (!consec || !empresa) continue
    if (!/^[FDC]\d+$/.test(consec)) continue

    const facturacion = parseFloat(facStr.replace(/[^0-9.]/g, '')) || 0
    accounts.push({ consecutivo: consec, empresa, facturacion, servicio })
  }
  return accounts
}

// ── Parse Concentrado sheet ───────────────────────────────────────────────────
// A=FICHA UX, B=CID, C=NOMBRE CLIENTE, D=CONTACTO, E=CARGO, F=TEL OFICINA,
// G=CONTACTO FACT, H=TEL CELULAR, P=DIRECCIÓN FISCAL, Q=PAGINA WEB,
// T=LINK ZOHO, U=CUANTAS OFICINAS, V=TOTAL EMPLEADOS, W=ACTIVIDAD/GIRO,
// X=TAMAÑO EMPRESA, Y=SERVICIO, Z=ACTIVA DESDE, AB=EJECUTIVO POSTVENTA,
// AD=OBSERVACIONES, AE=NOMBRE DEL GRUPO
function parseConcentrado(wb: XLSX.WorkBook): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>()
  const ws = wb.Sheets['Concentrado']
  if (!ws) { console.warn('⚠  No Concentrado sheet found'); return map }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AJ200')

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec = getCellValue(ws, row, 'A')
    if (!consec || !/^[FDC]\d+$/.test(consec)) continue

    const ejecutivoPost = getCellValue(ws, row, 'AB')
    const asesor = detectAsesor(ejecutivoPost, consec.charAt(0))

    const activoDesde = excelDateToISO(ws[`Z${row}`]?.v)

    // NOTE: direccion_fiscal, pagina_web, zoho_link, num_oficinas, giro,
    // observaciones_kam are stored as TEXT in DB — no 255 limit.
    // We still trunc large fields defensively to 500 chars max.
    map.set(consec, {
      consecutivo:       trunc(consec, 10),
      cid:               trunc(getCellValue(ws, row, 'B'), 20),
      empresa:           getCellValue(ws, row, 'C') || null,
      asesor,
      contacto_nombre:   trunc(getCellValue(ws, row, 'D'), 250),
      contacto_cargo:    trunc(getCellValue(ws, row, 'E'), 250),
      contacto_tel:      trunc(getCellValue(ws, row, 'F') || getCellValue(ws, row, 'H'), 100),
      direccion_fiscal:  getCellValue(ws, row, 'P') || null,
      pagina_web:        getCellValue(ws, row, 'Q') || null,
      zoho_link:         getCellValue(ws, row, 'T') || null,
      num_oficinas:      getCellValue(ws, row, 'U') || null,
      total_empleados:   trunc(getCellValue(ws, row, 'V'), 250),
      giro:              trunc(getCellValue(ws, row, 'W'), 250),   // ← truncated to fit VARCHAR(255)
      tamano_empresa:    trunc(getCellValue(ws, row, 'X'), 50),
      servicio:          getCellValue(ws, row, 'Y') || null,
      activo_desde:      activoDesde,
      grupo_empresarial: trunc(getCellValue(ws, row, 'AE'), 250),
      observaciones_kam: getCellValue(ws, row, 'AD') || null,
    })
  }

  return map
}

// ── Parse individual Ficha UX sheets ─────────────────────────────────────────
// Layout (verified against F1):
//   D1  = CID
//   C2  = empresa name
//   C3  = contacto_nombre
//   C4  = contacto_cargo
//   C5  = contacto_tel (oficina)
//   C7  = contacto_tel (celular, fallback)
//   G2  = direccion_fiscal
//   G3  = pagina_web
//   G6  = zoho_link
//   G7  = num_oficinas
//   G8  = total_empleados
//   G9  = giro
//   G10 = tamano_empresa
//   G11 = servicio name
//   G12 = activo_desde (Excel date serial)
//   G13 = asesor comercial
//   G14 = ejecutivo postventa ← THIS is the asesor for CS
function parseFichaUX(ws: XLSX.WorkSheet, sheet: string): Record<string, unknown> {
  const get = (row: number, col: string) => getCellValue(ws, row, col)

  const ejecutivoPost = get(14, 'G')   // row 14 = EJECUTIVO POSTVENTA
  const asesor = detectAsesor(ejecutivoPost, sheet.charAt(0))

  const activoDesde = excelDateToISO(ws['G12']?.v)   // G12 = CUENTA ACTIVA DESDE

  const fichaData: Record<string, unknown> = {
    asesor,
    cid:              trunc(get(1, 'D'), 20)   || undefined,
    contacto_nombre:  trunc(get(3, 'C'), 250)  || undefined,
    contacto_cargo:   trunc(get(4, 'C'), 250)  || undefined,
    contacto_tel:     trunc(get(5, 'C') || get(7, 'C'), 100) || undefined,
    direccion_fiscal: get(2, 'G')  || undefined,
    pagina_web:       get(3, 'G')  || undefined,
    zoho_link:        get(6, 'G')  || undefined,
    num_oficinas:     get(7, 'G')  || undefined,
    total_empleados:  trunc(get(8, 'G'), 250)  || undefined,
    giro:             trunc(get(9, 'G'), 250)  || undefined,
    tamano_empresa:   trunc(get(10, 'G'), 50)  || undefined,
  }

  if (activoDesde) fichaData.activo_desde = activoDesde

  // Remove undefined keys
  Object.keys(fichaData).forEach(k => fichaData[k] === undefined && delete fichaData[k])

  return fichaData
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2] || path.join(__dirname, '../../Top Customer.xlsx')
  console.log(`Reading: ${xlsxPath}\n`)

  const wb = readExcel(xlsxPath)
  const topAccounts = parseTopSheet(wb)
  console.log(`TOP sheet    → ${topAccounts.length} accounts`)

  const fichaSheets = wb.SheetNames.filter(n => /^[FDC]\d+$/.test(n))
  console.log(`Ficha sheets → ${fichaSheets.length} sheets (${fichaSheets.filter(n=>n.startsWith('F')).length}F / ${fichaSheets.filter(n=>n.startsWith('D')).length}D / ${fichaSheets.filter(n=>n.startsWith('C')).length}C)`)

  // Pass 1 — seed from TOP sheet
  const accountMap = new Map<string, Record<string, unknown>>()
  for (const acc of topAccounts) {
    accountMap.set(acc.consecutivo, {
      consecutivo:      trunc(acc.consecutivo, 10),
      empresa:          acc.empresa,
      facturacion:      acc.facturacion,
      servicio:         acc.servicio || null,
      score_actividad:  50,
      score_adopcion:   50,
      score_pago:       50,
      score_relacional: 50,
      estado:           'activo',
    })
  }

  // Pass 2 — merge Concentrado into ALL accounts
  const concentradoMap = parseConcentrado(wb)
  console.log(`Concentrado  → ${concentradoMap.size} accounts`)

  for (const [consec, conData] of concentradoMap) {
    const existing = accountMap.get(consec) || {}
    accountMap.set(consec, {
      score_actividad:  50,
      score_adopcion:   50,
      score_pago:       50,
      score_relacional: 50,
      estado:           'activo',
      ...conData,
      // TOP-sheet values win for facturación and empresa (more up-to-date)
      facturacion: (existing as any).facturacion ?? (conData as any).facturacion ?? 0,
      empresa:     (existing as any).empresa     || conData.empresa,
      servicio:    (existing as any).servicio    || conData.servicio,
    })
  }

  // Pass 3 — enrich with individual Ficha UX sheets
  let fichaEnriched = 0
  for (const sheet of fichaSheets) {
    const ws = wb.Sheets[sheet]
    if (!ws) continue

    const existing = accountMap.get(sheet)
    if (!existing?.empresa) continue   // skip orphan sheets

    const fichaData = parseFichaUX(ws, sheet)
    accountMap.set(sheet, { ...existing, ...fichaData })
    fichaEnriched++
  }
  console.log(`Ficha UX     → ${fichaEnriched} accounts enriched\n`)

  const rows = Array.from(accountMap.values()).filter(r => r.empresa)
  console.log(`Upserting ${rows.length} accounts to Supabase…\n`)

  let totalErrors = 0
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const label = `Chunk ${Math.floor(i / 50) + 1}`
    const { error } = await supabase.from('cuentas').upsert(chunk, { onConflict: 'consecutivo' })
    if (error) {
      console.error(`✗ ${label} error:`, error.message)
      totalErrors++
    } else {
      console.log(`✓ ${label}: ${chunk.length} records`)
    }
  }

  if (totalErrors === 0) {
    console.log('\n✅ Import complete! All accounts loaded successfully.')
    console.log(`   Fátima: F1-F47 (${rows.filter(r => String(r.consecutivo).startsWith('F')).length} accounts)`)
    console.log(`   Dan:    D1-D14 (${rows.filter(r => String(r.consecutivo).startsWith('D')).length} accounts)`)
    console.log(`   Claudia: C1-C47 (${rows.filter(r => String(r.consecutivo).startsWith('C')).length} accounts)`)
  } else {
    console.error(`\n❌ Import finished with ${totalErrors} chunk error(s). Check messages above.`)
  }
}

main().catch(console.error)
