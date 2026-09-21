'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { anteponerEntrada } from '@/lib/observaciones-kam'

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

/** Quién firma la entrada. `x-user-asesor` viene vacío para los admins. */
function quienEscribe(): string | null {
  const h = headers()
  const nombre = decodeURIComponent(h.get('x-user-nombre') ?? '').trim()
  if (nombre) return nombre
  const asesor = decodeURIComponent(h.get('x-user-asesor') ?? '').trim()
  if (asesor) return asesor
  return (h.get('x-user-email') ?? '').trim() || null
}

/**
 * Agrega un resumen semanal a la bitácora, fechado y firmado.
 *
 * Es ALTA, no edición: antepone la entrada y deja intacto todo lo anterior.
 * Para corregir algo ya escrito está `updateKam`, que sí reemplaza el campo
 * entero — separar las dos cosas evita que un resumen semanal borre por
 * descuido meses de historial, que es lo que pasaba cuando el único camino
 * era un cuadro de texto con todo dentro.
 */
export async function agregarObservacionKam(formData: FormData) {
  const cuentaId = formData.get('cuenta_id') as string
  if (!(await canEditCuenta(cuentaId))) return

  const cuerpo = ((formData.get('resumen') as string) ?? '').trim()
  if (!cuerpo) return

  // Se relee el valor actual dentro de la acción: si otro asesor guardó algo
  // mientras esta pestaña estaba abierta, se conserva. Mandar el texto
  // completo desde el formulario habría pisado lo que no vio.
  const { data } = await supabaseAdmin
    .from('cuentas').select('observaciones_kam').eq('id', cuentaId).single()

  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: anteponerEntrada(data?.observaciones_kam, cuerpo, quienEscribe()) })
    .eq('id', cuentaId)

  revalidatePath(`/cuentas/${cuentaId}`)
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
