'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function updateKam(formData: FormData) {
  const cuentaId = formData.get('cuenta_id') as string
  const texto    = ((formData.get('observaciones_kam') as string) ?? '').trim()
  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: texto || null })
    .eq('id', cuentaId)
  revalidatePath(`/cuentas/${cuentaId}`)
}

export async function deleteKam(formData: FormData) {
  const cuentaId = formData.get('cuenta_id') as string
  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: null })
    .eq('id', cuentaId)
  revalidatePath(`/cuentas/${cuentaId}`)
}
