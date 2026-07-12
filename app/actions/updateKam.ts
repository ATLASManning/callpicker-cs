'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

async function canEditCuenta(cuentaId: string): Promise<boolean> {
  const h      = headers()
  const rol    = h.get('x-user-rol') ?? 'viewer'
  const asesor = decodeURIComponent(h.get('x-user-asesor') ?? '')
  if (rol === 'admin') return true
  if (rol !== 'asesor') return false
  const { data } = await supabaseAdmin
    .from('cuentas').select('asesor').eq('id', cuentaId).single()
  return data?.asesor === asesor
}

export async function updateKam(formData: FormData) {
  const cuentaId = formData.get('cuenta_id') as string
  if (!(await canEditCuenta(cuentaId))) return
  const texto = ((formData.get('observaciones_kam') as string) ?? '').trim()
  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: texto || null })
    .eq('id', cuentaId)
  revalidatePath(`/cuentas/${cuentaId}`)
}

export async function deleteKam(formData: FormData) {
  const cuentaId = formData.get('cuenta_id') as string
  if (!(await canEditCuenta(cuentaId))) return
  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: null })
    .eq('id', cuentaId)
  revalidatePath(`/cuentas/${cuentaId}`)
}
