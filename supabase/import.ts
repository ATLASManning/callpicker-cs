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

// ── Excel reader ──────────────────────────────────────────────────────────────
function readExcel(filePath: string) {
  const wb = XLSX.readFile(filePath)
  return wb
}

function getCellValue(ws: XLSX.WorkSheet, row: number, col: string): string {
  const cell = ws[`${col}${row}`]
  if (!cell) return ''
  return String(cell.v ?? '').trim()
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

// ── Parse TOP sheet ───────────────────────────────────────────────────────────
function parseTopSheet(wb: XLSX.WorkBook) {
  const ws = wb.Sheets['TOP']
  if (!ws) { console.warn('No TOP sheet found'); return [] }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E200')
  const accounts: { consecutivo: string; empresa: string; facturacion: number; servicio: string }[] = []

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec = getCellValue(ws, row, 'A')
    const empresa = getCellValue(ws, row, 'C')
    const facStr = getCellValue(ws, row, 'D')
    const servicio = getCellValue(ws, row, 'E')

    if (!consec || !empresa) continue
    if (!/^[FDC]\d+$/.test(consec)) continue

    const facturacion = parseFloat(facStr.replace(/[^0-9.]/g, '')) || 0
    accounts.push({ consecutivo: consec, empresa, facturacion, servicio })
  }
  return accounts
}

// ── Parse individual Ficha UX sheet ──────────────────────────────────────────
function parseFichaSheet(wb: XLSX.WorkBook, sheetName: string) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return null

  function get(row: number, col: string) { return getCellValue(ws, row, col) }

  // Map of known cell positions in the Ficha UX layout
  const cid           = get(1, 'D')
  const nombre        = get(2, 'C')
  const contacto      = get(3, 'C')
  const cargo         = get(4, 'C')
  const telOficina    = get(5, 'C')
  const telCelular    = get(7, 'C')
  const direccion     = get(2, 'G')
  const web           = get(3, 'G')
  const zohoLink      = get(6, 'G')
  const numOficinas   = get(7, 'G')
  const empleados     = get(8, 'G')
  const giro          = get(9, 'G')
  const tamano        = get(10, 'G')
  const servicio      = get(11, 'G')
  const activoDesde   = ws['C13']?.v  // Could be date serial
  const asesorComercial = get(14, 'G')
  const ejecutivoPost = get(15, 'G')

  // Determine asesor from sheet name prefix and postvent executive
  let asesor: 'Fátima' | 'Dan' | 'Claudia' = 'Fátima'
  const prefix = sheetName.charAt(0)
  if (prefix === 'D') asesor = 'Dan'
  else if (prefix === 'C') asesor = 'Claudia'
  else {
    // Fallback: check ejecutivo name
    if (ejecutivoPost.toLowerCase().includes('dan')) asesor = 'Dan'
    else if (ejecutivoPost.toLowerCase().includes('claudia')) asesor = 'Claudia'
  }

  // Determine asesor from ejecutivo postvent field
  if (ejecutivoPost.toLowerCase().includes('fátima') || ejecutivoPost.toLowerCase().includes('fatima')) asesor = 'Fátima'
  else if (ejecutivoPost.toLowerCase().includes('dan')) asesor = 'Dan'
  else if (ejecutivoPost.toLowerCase().includes('claudia')) asesor = 'Claudia'

  return {
    cid: cid || null,
    contacto_nombre: contacto || null,
    contacto_cargo: cargo || null,
    contacto_tel: telOficina || telCelular || null,
    contacto_email: null,
    direccion_fiscal: direccion || null,
    pagina_web: web || null,
    zoho_link: zohoLink || null,
    num_oficinas: numOficinas || null,
    total_empleados: empleados || null,
    giro: giro || null,
    tamano_empresa: tamano || null,
    servicio: servicio || null,
    activo_desde: excelDateToISO(activoDesde),
    asesor,
  }
}

// ── Main import ───────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2] || path.join(__dirname, '../../Top Customer.xlsx')
  console.log(`Reading: ${xlsxPath}`)

  const wb = readExcel(xlsxPath)
  const topAccounts = parseTopSheet(wb)
  console.log(`Found ${topAccounts.length} accounts in TOP sheet`)

  // Get all individual sheet names
  const fichaSheets = wb.SheetNames.filter(n => /^[FDC]\d+$/.test(n))
  console.log(`Found ${fichaSheets.length} Ficha UX sheets`)

  // Build merged account map
  const accountMap = new Map<string, Record<string, unknown>>()

  // Start with TOP sheet data
  for (const acc of topAccounts) {
    accountMap.set(acc.consecutivo, {
      consecutivo: acc.consecutivo,
      empresa: acc.empresa,
      facturacion: acc.facturacion,
      servicio: acc.servicio,
      // Default health scores (will be updated as team uses the app)
      score_actividad: 50,
      score_adopcion: 50,
      score_pago: 50,
      score_relacional: 50,
      estado: 'activo',
    })
  }

  // Enrich with Ficha UX data
  for (const sheet of fichaSheets) {
    const ficha = parseFichaSheet(wb, sheet)
    if (!ficha) continue

    const existing = accountMap.get(sheet) || {}

    // If not in TOP, try to get empresa from ficha sheet context
    if (!existing.empresa) {
      // Try to get from Concentrado
      continue
    }

    accountMap.set(sheet, {
      ...existing,
      ...ficha,
      consecutivo: sheet,
    })
  }

  // Parse Concentrado sheet for additional info
  const concentrado = wb.Sheets['Concentrado']
  if (concentrado) {
    const range = XLSX.utils.decode_range(concentrado['!ref'] || 'A1:AJ200')
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const row = r + 1
      const consec = getCellValue(concentrado, row, 'A')
      if (!consec || !/^[FDC]\d+$/.test(consec)) continue

      const cid = getCellValue(concentrado, row, 'B')
      const empresa = getCellValue(concentrado, row, 'C')
      const contactoNombre = getCellValue(concentrado, row, 'D')
      const web = getCellValue(concentrado, row, 'Q')
      const zohoLink = getCellValue(concentrado, row, 'T')
      const empleados = getCellValue(concentrado, row, 'V')
      const giro = getCellValue(concentrado, row, 'W')
      const tamano = getCellValue(concentrado, row, 'X')
      const servicio = getCellValue(concentrado, row, 'Y')
      const ejecutivoPost = getCellValue(concentrado, row, 'AB')
      const observaciones = getCellValue(concentrado, row, 'AD')
      const grupo = getCellValue(concentrado, row, 'AE')

      let asesor: 'Fátima' | 'Dan' | 'Claudia' = 'Fátima'
      if (ejecutivoPost.toLowerCase().includes('dan')) asesor = 'Dan'
      else if (ejecutivoPost.toLowerCase().includes('claudia')) asesor = 'Claudia'

      const existing = accountMap.get(consec) || {}
      if (!existing.empresa && empresa) {
        accountMap.set(consec, {
          ...existing,
          consecutivo: consec,
          cid: cid || null,
          empresa,
          asesor,
          contacto_nombre: contactoNombre || null,
          pagina_web: web || null,
          zoho_link: zohoLink || null,
          total_empleados: empleados || null,
          giro: giro || null,
          tamano_empresa: tamano || null,
          servicio: servicio || null,
          observaciones_kam: observaciones || null,
          grupo_empresarial: grupo || null,
          facturacion: (existing as {facturacion?: number}).facturacion || 0,
          score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
          estado: 'activo',
        })
      }
    }
  }

  const rows = Array.from(accountMap.values()).filter(r => r.empresa)
  console.log(`Upserting ${rows.length} accounts to Supabase…`)

  // Batch upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const { error } = await supabase.from('cuentas').upsert(chunk, { onConflict: 'consecutivo' })
    if (error) console.error(`Chunk ${i/50 + 1} error:`, error.message)
    else console.log(`✓ Chunk ${i/50 + 1}: ${chunk.length} records`)
  }

  console.log('✅ Import complete!')
}

main().catch(console.error)
