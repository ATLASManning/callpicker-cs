'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X, Save, Loader2, Globe, Phone, Mail, MapPin, Building2, Briefcase, Users, Hash } from 'lucide-react'
import type { Cuenta } from '@/lib/types'

interface Props {
  cuenta: Cuenta
}

const ASESORES = ['Fátima', 'Dan', 'Claudia'] as const
const TAMANOS = ['Micro', 'Pequeña', 'Mediana', 'Grande', 'Enterprise'] as const

export default function CuentaInfoEditor({ cuenta }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    empresa:          cuenta.empresa ?? '',
    servicio:         cuenta.servicio ?? '',
    asesor:           cuenta.asesor ?? '',
    giro:             cuenta.giro ?? '',
    tamano_empresa:   cuenta.tamano_empresa ?? '',
    total_empleados:  cuenta.total_empleados ?? '',
    num_oficinas:     cuenta.num_oficinas ?? '',
    grupo_empresarial: cuenta.grupo_empresarial ?? '',
    contacto_nombre:  cuenta.contacto_nombre ?? '',
    contacto_cargo:   cuenta.contacto_cargo ?? '',
    contacto_email:   cuenta.contacto_email ?? '',
    contacto_tel:     cuenta.contacto_tel ?? '',
    pagina_web:       cuenta.pagina_web ?? '',
    direccion_fiscal: cuenta.direccion_fiscal ?? '',
    zoho_link:        cuenta.zoho_link ?? '',
    cid:              cuenta.cid ?? '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // Build payload — send only non-empty or explicitly set values
      const payload: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(form)) {
        payload[k] = v.trim() === '' ? null : v.trim()
      }

      const res = await fetch(`/api/cuentas/${cuenta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
      }

      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Trigger button — integrado en la card de Información */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] text-textLow hover:text-cp transition-colors"
        title="Editar información"
      >
        <Pencil size={11} />
        Editar
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => !saving && setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl
        flex flex-col transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-textHi">Editar Información</h2>
            <p className="text-[11px] text-textLow mt-0.5">{cuenta.empresa} · {cuenta.consecutivo}</p>
          </div>
          <button
            onClick={() => !saving && setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface text-textLow hover:text-textHi transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Sección: Empresa */}
          <Section title="Empresa">
            <Field label="Nombre de empresa">
              <input
                value={form.empresa}
                onChange={e => set('empresa', e.target.value)}
                className="cp-input"
                placeholder="Nombre comercial"
              />
            </Field>
            <Field label="Servicio contratado">
              <input
                value={form.servicio}
                onChange={e => set('servicio', e.target.value)}
                className="cp-input"
                placeholder="Ej: AV Agentes Virtuales"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Asesor">
                <select
                  value={form.asesor}
                  onChange={e => set('asesor', e.target.value)}
                  className="cp-input"
                >
                  <option value="">— Sin asignar —</option>
                  {ASESORES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="CID (Zoho)">
                <input
                  value={form.cid}
                  onChange={e => set('cid', e.target.value)}
                  className="cp-input font-mono"
                  placeholder="123456"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giro / Industria">
                <input
                  value={form.giro}
                  onChange={e => set('giro', e.target.value)}
                  className="cp-input"
                  placeholder="Automotriz, Tech, Salud…"
                />
              </Field>
              <Field label="Tamaño">
                <select
                  value={form.tamano_empresa}
                  onChange={e => set('tamano_empresa', e.target.value)}
                  className="cp-input"
                >
                  <option value="">— Seleccionar —</option>
                  {TAMANOS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Empleados" icon={<Users size={11} />}>
                <input
                  value={form.total_empleados}
                  onChange={e => set('total_empleados', e.target.value)}
                  className="cp-input"
                  placeholder="Ej: 1200"
                />
              </Field>
              <Field label="Oficinas" icon={<Hash size={11} />}>
                <input
                  value={form.num_oficinas}
                  onChange={e => set('num_oficinas', e.target.value)}
                  className="cp-input"
                  placeholder="Ej: 5"
                />
              </Field>
            </div>
            <Field label="Grupo empresarial">
              <input
                value={form.grupo_empresarial}
                onChange={e => set('grupo_empresarial', e.target.value)}
                className="cp-input"
                placeholder="Ej: Grupo Torres"
              />
            </Field>
          </Section>

          {/* Sección: Contacto */}
          <Section title="Contacto principal">
            <Field label="Nombre">
              <input
                value={form.contacto_nombre}
                onChange={e => set('contacto_nombre', e.target.value)}
                className="cp-input"
                placeholder="Nombre completo"
              />
            </Field>
            <Field label="Cargo" icon={<Briefcase size={11} />}>
              <input
                value={form.contacto_cargo}
                onChange={e => set('contacto_cargo', e.target.value)}
                className="cp-input"
                placeholder="Ej: Director de TI"
              />
            </Field>
            <Field label="Email" icon={<Mail size={11} />}>
              <input
                type="email"
                value={form.contacto_email}
                onChange={e => set('contacto_email', e.target.value)}
                className="cp-input"
                placeholder="correo@empresa.com"
              />
            </Field>
            <Field label="Teléfono" icon={<Phone size={11} />}>
              <input
                type="tel"
                value={form.contacto_tel}
                onChange={e => set('contacto_tel', e.target.value)}
                className="cp-input"
                placeholder="55 1234 5678"
              />
            </Field>
          </Section>

          {/* Sección: Web y ubicación */}
          <Section title="Web y ubicación">
            <Field label="Página web" icon={<Globe size={11} />}>
              <input
                value={form.pagina_web}
                onChange={e => set('pagina_web', e.target.value)}
                className="cp-input"
                placeholder="https://www.empresa.com"
              />
            </Field>
            <Field label="Dirección fiscal" icon={<MapPin size={11} />}>
              <textarea
                value={form.direccion_fiscal}
                onChange={e => set('direccion_fiscal', e.target.value)}
                className="cp-input resize-none"
                rows={3}
                placeholder="Calle, colonia, ciudad, CP"
              />
            </Field>
          </Section>

          {/* Sección: Links */}
          <Section title="Integraciones">
            <Field label="Zoho CRM Link" icon={<Building2 size={11} />}>
              <input
                value={form.zoho_link}
                onChange={e => set('zoho_link', e.target.value)}
                className="cp-input"
                placeholder="https://crm.zoho.com/..."
              />
            </Field>
          </Section>

          {/* Error */}
          {error && (
            <div className="text-xs text-rojo bg-rojo/10 border border-rojo/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={() => !saving && setOpen(false)}
            disabled={saving}
            className="cp-btn cp-btn-ghost flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="cp-btn cp-btn-primary flex-1 justify-center"
          >
            {saving ? (
              <><Loader2 size={13} className="animate-spin" /> Guardando…</>
            ) : (
              <><Save size={13} /> Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-textLow uppercase tracking-widest mb-3 pb-1.5 border-b border-border">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] text-textLow mb-1 font-medium">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
