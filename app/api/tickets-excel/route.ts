import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'Tickets.xlsx')
    const fileBuffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    const result: Record<string, any[]> = {}

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet)
      result[sheetName] = data
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
