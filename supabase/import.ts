/**
 * Import script — Top Customer.xlsx → Supabase
 * Run: npx ts-node --project tsconfig.import.json supabase/import.ts
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

// Safe truncate — only applies to VARCHAR columns, TEXT cols pass through
function trunc(val: string | null | undefined, max: number): string | null {
  if (!val) return null
  return val.length > max ? val.slice(0, max) : val
}

function excelDateToISO(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  if (typeof val === 'string') {
    const date = new Date(val)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }
  return null
}

function detectAsesor(text: string, prefix?: string): 'Fátima' | 'Dan' | 'Claudia' {
  const t = text.toLowerCase()
  if (t.includes('fátima') || t.includes('fatima')) return 'Fátima'
  if (t.includes('dan')) return 'Dan'
  if (t.includes('claudia')) return 'Claudia'
  if (prefix === 'D') return 'Dan'
  if (prefix === 'C') return 'Claudia'
  return 'Fátima'
}

// ── Parse TOP sheet ───────────────────────────────────────────────────────────
function parseTopSheet(wb: XLSX.WorkBook) {
  const ws = wb.Sheets['TOP']
  if (!ws) { console.warn('No TOP sheet found'); return [] }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E200')
  const accounts: { consecutivo: string; empresa: string; facturacion: number; servicio: string }[] = []

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec  = getCellValue(ws, row, 'A')
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

// ── Parse Concentrado sheet (source of truth for contact / company data) ──────
function parseConcentrado(wb: XLSX.WorkBook): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>()
  const ws = wb.Sheets['Concentrado']
  if (!ws) return map

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AJ200')

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec = getCellValue(ws, row, 'A')
    if (!consec || !/^[FDC]\d+$/.test(consec)) continue

    const ejecutivoPost = getCellValue(ws, row, 'AB')
    const asesor = detectAsesor(ejecutivoPost, consec.charAt(0))

    // activo_desde from column Z (may be date serial)
    const activoDesdeRaw = ws[`Z${row}`]?.v
    const activoDesde = excelDateToISO(activoDesdeRaw)

    map.set(consec, {
      consecutivo:      trunc(consec, 10),
      cid:              trunc(getCellValue(ws, row, 'B'), 20),
      empresa:          getCellValue(ws, row, 'C') || null,          // TEXT
      asesor,
      contacto_nombre:  trunc(getCellValue(ws, row, 'D'), 250),
      contacto_cargo:   trunc(getCellValue(ws, row, 'E'), 250),
      contacto_tel:     trunc(getCellValue(ws, row, 'F') || getCellValue(ws, row, 'H'), 100),
      direccion_fiscal: getCellValue(ws, row, 'P') || null,          // TEXT
      pagina_web:       getCellValue(ws, row, 'Q') || null,          // TEXT
      zoho_link:        getCellValue(ws, row, 'T') || null,          // TEXT
      num_oficinas:     getCellValue(ws, row, 'U') || null,          // TEXT
      total_empleados:  trunc(getCellValue(ws, row, 'V'), 250),
      giro:             getCellValue(ws, row, 'W') || null,          // TEXT
      tamano_empresa:   trunc(getCellValue(ws, row, 'X'), 250),
      servicio:         getCellValue(ws, row, 'Y') || null,          // TEXT
      activo_desde:     activoDesde,
      grupo_empresarial: trunc(getCellValue(ws, row, 'AE'), 250),
      observaciones_kam: getCellValue(ws, row, 'AD') || null,        // TEXT
    })
  }

  return map
}

// ── Main import ───────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2] || path.join(__dirname, '../../Top Customer.xlsx')
  console.log(`Reading: ${xlsxPath}`)

  const wb = readExcel(xlsxPath)
  const topAccounts = parseTopSheet(wb)
  console.log(`Found ${topAccounts.length} accounts in TOP sheet`)

  const fichaSheets = wb.SheetNames.filter(n => /^[FDC]\d+$/.test(n))
  console.log(`Found ${fichaSheets.length} Ficha UX sheets`)

  // 1. Seed with TOP sheet (facturación is the authoritative source)
  const accountMap = new Map<string, Record<string, unknown>>()
  for (const acc of topAccounts) {
    accountMap.set(acc.consecutivo, {
      consecutivo:     trunc(acc.consecutivo, 10),
      empresa:         acc.empresa,   // TEXT
      facturacion:     acc.facturacion,
      servicio:        acc.servicio,  // TEXT
      score_actividad: 50,
      score_adopcion:  50,
      score_pago:      50,
      score_relacional:50,
      estado:          'activo',
    })
  }

  // 2. Merge Concentrado data into ALL accounts (not just new ones)
  const concentradoMap = parseConcentrado(wb)
  for (const [consec, conData] of concentradoMap) {
    const existing = accountMap.get(consec) || {}
    accountMap.set(consec, {
      // Defaults
      score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
      estado: 'activo',
      // Concentrado data
      ...conData,
      // TOP data wins for facturación and empresa name (more up-to-date)
      facturacion: (existing as any).facturacion ?? (conData as any).facturacion ?? 0,
      empresa:     (existing as any).empresa     || conData.empresa,
      servicio:    (existing as any).servicio    || conData.servicio,
    })
  }

  // 3. Enrich with individual Ficha UX sheets (contact details, asesor)
  for (const sheet of fichaSheets) {
    const ws = wb.Sheets[sheet]
    if (!ws) continue

    const get = (row: number, col: string) => getCellValue(ws, row, col)
    const ejecutivoPost = get(15, 'G')
    const asesor = detectAsesor(ejecutivoPost, sheet.charAt(0))

    const activoDesde = excelDateToISO(ws['C13']?.v)

    const fichaData: Record<string, unknown> = {
      asesor,
      cid:             trunc(get(1, 'D'), 20)  || undefined,
      contacto_nombre: trunc(get(3, 'C'), 250) || undefined,
      contacto_cargo:  trunc(get(4, 'C'), 250) || undefined,
      contacto_tel:    trunc(get(5, 'C') || get(7, 'C'), 100) || undefined,
      direccion_fiscal: get(2, 'G') || undefined,
      pagina_web:      get(3, 'G') || undefined,
      zoho_link:       get(6, 'G') || undefined,
      num_oficinas:    get(7, 'G') || undefined,
      total_empleados: trunc(get(8, 'G'), 250) || undefined,
      giro:            get(9, 'G') || undefined,
      tamano_empresa:  trunc(get(10, 'G'), 250) || undefined,
    }
    if (activoDesde) fichaData.activo_desde = activoDesde

    // Remove undefined keys
    Object.keys(fichaData).forEach(k => fichaData[k] === undefined && delete fichaData[k])

    const existing = accountMap.get(sheet) || {}
    if (existing.empresa) {
      accountMap.set(sheet, { ...existing, ...fichaData })
    }
  }

  const rows = Array.from(accountMap.values()).filter(r => r.empresa)
  console.log(`Upserting ${rows.length} accounts to Supabase…`)

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const { error } = await supabase.from('cuentas').upsert(chunk, { onConflict: 'consecutivo' })
    if (error) console.error(`Chunk ${i/50 + 1} error:`, error.message)
    else console.log(`✓ Chunk ${i/50 + 1}: ${chunk.length} records`)
  }

  console.log('✅ Import complete!')
}

main().catch(console.error)
