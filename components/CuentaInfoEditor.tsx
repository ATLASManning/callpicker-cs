'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil, X, Save, Loader2, Globe, Phone, Mail, MapPin,
  Building2, Briefcase, Users, Hash, Plus, Trash2, UserPlus,
  Package, ChevronDown, FileText,
} from 'lucide-react'
import type { Cuenta, ContactoCuenta, ServicioCuenta } from '@/lib/types'
import CustomSelect from './CustomSelect'

interface Props { cuenta: Cuenta; canEdit?: boolean }

const ASESORES = ['Fátima', 'Dan', 'Claudia'] as const
const TAMANOS  = ['Micro', 'Pequeña', 'Mediana', 'Grande', 'Enterprise'] as const

const EMPTY_CONTACTO: ContactoCuenta = { nombre: '', cargo: '', email: '', tel: '' }
const EMPTY_SERVICIO: ServicioCuenta  = { nombre: '', descripcion: '' }

type Tab = 'info' | 'contactos' | 'servicios' | 'kam'

function seedContactos(cuenta: Cuenta): ContactoCuenta[] {
  if (cuenta.contactos_json && cuenta.contactos_json.length > 0) return cuenta.contactos_json
  if (cuenta.contacto_nombre) {
    return [{
      nombre: cuenta.contacto_nombre ?? '',
      cargo:  cuenta.contacto_cargo  ?? '',
      email:  cuenta.contacto_email  ?? '',
      tel:    cuenta.contacto_tel    ?? '',
    }]
  }
  return []
}

function seedServicios(cuenta: Cuenta): ServicioCuenta[] {
  if (cuenta.servicios_json && cuenta.servicios_json.length > 0) return cuenta.servicios_json
  if (cuenta.servicio) return [{ nombre: cuenta.servicio, descripcion: '' }]
  return []
}

export default function CuentaInfoEditor({ cuenta, canEdit = false }: Props) {
  if (!canEdit) return null
  const router   = useRouter()
  const dropRef  = useRef<HTMLDivElement>(null)

  const [open,       setOpen]       = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [tab,        setTab]        = useState<Tab>('info')
  const [migrated,   setMigrated]   = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)

  const [info, setInfo] = useState({
    empresa:           cuenta.empresa           ?? '',
    asesor:            cuenta.asesor            ?? '',
    cid:               cuenta.cid               ?? '',
    giro:              cuenta.giro              ?? '',
    tamano_empresa:    cuenta.tamano_empresa     ?? '',
    total_empleados:   cuenta.total_empleados   ?? '',
    num_oficinas:      cuenta.num_oficinas      ?? '',
    grupo_empresarial: cuenta.grupo_empresarial ?? '',
    pagina_web:        cuenta.pagina_web        ?? '',
    direccion_fiscal:  cuenta.direccion_fiscal  ?? '',
    zoho_link:         cuenta.zoho_link         ?? '',
  })

  const [contactos, setContactos] = useState<ContactoCuenta[]>(seedContactos(cuenta))
  const [servicios, setServicios] = useState<ServicioCuenta[]>(seedServicios(cuenta))
  const [obsKam,    setObsKam]    = useState(cuenta.observaciones_kam ?? '')

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Escuchar evento de KamCard para abrir el tab KAM
  useEffect(() => {
    function onAbrirKam() { setTab('kam'); setOpen(true) }
    document.addEventListener('abrir-kam-editor', onAbrirKam)
    return () => document.removeEventListener('abrir-kam-editor', onAbrirKam)
  }, [])

  // Auto-migrar columnas JSONB
  useEffect(() => {
    if (migrated) return
    if (cuenta.contactos_json === undefined) {
      fetch('/api/admin/migrate-contactos', { method: 'POST' })
        .finally(() => setMigrated(true))
    } else {
      setMigrated(true)
    }
  }, [cuenta.contactos_json, migrated])

  // ── Abrir editor en un tab específico ───────────────────────────────────────
  function openAt(t: Tab, addNew = false) {
    setDropOpen(false)
    setTab(t)
    setOpen(true)
    if (addNew) {
      if (t === 'contactos') setContactos(c => [...c, { ...EMPTY_CONTACTO }])
      if (t === 'servicios') setServicios(s => [...s, { ...EMPTY_SERVICIO }])
    }
  }

  // Función pública para abrir en tab KAM (usada desde page.tsx vía ref — no disponible aún; se expone como data-attr)
  // El botón de KAM directo llama openAt('kam') a través del componente KamEditTrigger

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function setInfoField(field: keyof typeof info, value: string) {
    setInfo(f => ({ ...f, [field]: value }))
  }

  function addContacto() { setContactos(c => [...c, { ...EMPTY_CONTACTO }]) }
  function removeContacto(i: number) { setContactos(c => c.filter((_, idx) => idx !== i)) }
  function updateContacto(i: number, field: keyof ContactoCuenta, value: string) {
    setContactos(c => c.map((ct, idx) => idx === i ? { ...ct, [field]: value } : ct))
  }

  function addServicio() { setServicios(s => [...s, { ...EMPTY_SERVICIO }]) }
  function removeServicio(i: number) { setServicios(s => s.filter((_, idx) => idx !== i)) }
  function updateServicio(i: number, field: keyof ServicioCuenta, value: string) {
    setServicios(s => s.map((sv, idx) => idx === i ? { ...sv, [field]: value } : sv))
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const infoPayload: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(info)) {
        infoPayload[k] = v.trim() === '' ? null : v.trim()
      }

      const contactosClean = contactos.filter(c => c.nombre.trim() || c.email.trim() || c.tel.trim())
      const serviciosClean = servicios.filter(s => s.nombre.trim())

      const primero = contactosClean[0]
      const legacyContact = primero
        ? { contacto_nombre: primero.nombre || null, contacto_cargo: primero.cargo || null,
            contacto_email: primero.email || null, contacto_tel: primero.tel || null }
        : { contacto_nombre: null, contacto_cargo: null, contacto_email: null, contacto_tel: null }

      const primerServicio = serviciosClean[0]
      const legacyServicio = { servicio: primerServicio?.nombre || null }

      const payload = {
        ...infoPayload, ...legacyContact, ...legacyServicio,
        contactos_json: contactosClean,
        servicios_json: serviciosClean,
        observaciones_kam: obsKam.trim() || null,
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
  }, [info, contactos, servicios, cuenta.id, router])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'info',      label: 'Información' },
    { id: 'contactos', label: 'Contactos',  count: contactos.length },
    { id: 'servicios', label: 'Servicios',  count: servicios.length },
    { id: 'kam',       label: 'KAM' },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Barra de acciones en la card ── */}
      <div className="flex items-center gap-2">

        {/* Botón Editar */}
        <button
          onClick={() => openAt('info')}
          className="flex items-center gap-1.5 text-[11px] text-textLow hover:text-cp transition-colors"
        >
          <Pencil size={11} /> Editar
        </button>

        {/* Combo + Agregar ▾ */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setDropOpen(d => !d)}
            className="flex items-center gap-1 text-[11px] font-medium text-cp bg-cp/10 hover:bg-cp/20
              border border-cp/20 px-2 py-0.5 rounded-md transition-colors"
          >
            <Plus size={11} /> Agregar <ChevronDown size={10} className={`transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => openAt('contactos', true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-textMid hover:bg-surface hover:text-cp transition-colors text-left"
              >
                <UserPlus size={13} className="text-cp flex-shrink-0" />
                Agregar contacto
              </button>
              <div className="border-t border-border" />
              <button
                onClick={() => openAt('servicios', true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-textMid hover:bg-surface hover:text-cp transition-colors text-left"
              >
                <Package size={13} className="text-cp flex-shrink-0" />
                Agregar servicio
              </button>
              <div className="border-t border-border" />
              <button
                onClick={() => openAt('kam')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-textMid hover:bg-surface hover:text-cp transition-colors text-left"
              >
                <FileText size={13} className="text-cp flex-shrink-0" />
                Observaciones KAM
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => !saving && setOpen(false)}
        />
      )}

      {/* Slide-over */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl
        flex flex-col transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-textHi">Editar cuenta</h2>
            <p className="text-[11px] text-textLow mt-0.5">{cuenta.empresa} · {cuenta.consecutivo}</p>
          </div>
          <button
            onClick={() => !saving && setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface text-textLow hover:text-textHi transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5
                ${tab === t.id
                  ? 'text-cp border-b-2 border-cp'
                  : 'text-textLow hover:text-textMid border-b-2 border-transparent'}`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${tab === t.id ? 'bg-cp/20 text-cp' : 'bg-surface text-textLow'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── TAB: Información ── */}
          {tab === 'info' && (
            <div className="space-y-5">
              <Section title="Empresa">
                <Field label="Nombre de empresa">
                  <input value={info.empresa} onChange={e => setInfoField('empresa', e.target.value)}
                    className="cp-input" placeholder="Nombre comercial" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Asesor">
                    <CustomSelect value={info.asesor} onChange={v => setInfoField('asesor', v)} className="cp-input"
                      options={[{ value: '', label: '— Sin asignar —' }, ...ASESORES.map(a => ({ value: a, label: a }))]} />
                  </Field>
                  <Field label="CID (Zoho)">
                    <input value={info.cid} onChange={e => setInfoField('cid', e.target.value)}
                      className="cp-input font-mono" placeholder="123456" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Giro / Industria">
                    <input value={info.giro} onChange={e => setInfoField('giro', e.target.value)}
                      className="cp-input" placeholder="Automotriz, Tech…" />
                  </Field>
                  <Field label="Tamaño">
                    <CustomSelect value={info.tamano_empresa} onChange={v => setInfoField('tamano_empresa', v)} className="cp-input"
                      options={[{ value: '', label: '— Seleccionar —' }, ...TAMANOS.map(t => ({ value: t, label: t }))]} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Empleados" icon={<Users size={11} />}>
                    <input value={info.total_empleados} onChange={e => setInfoField('total_empleados', e.target.value)}
                      className="cp-input" placeholder="Ej: 1200" />
                  </Field>
                  <Field label="Oficinas" icon={<Hash size={11} />}>
                    <input value={info.num_oficinas} onChange={e => setInfoField('num_oficinas', e.target.value)}
                      className="cp-input" placeholder="Ej: 5" />
                  </Field>
                </div>
                <Field label="Grupo empresarial">
                  <input value={info.grupo_empresarial} onChange={e => setInfoField('grupo_empresarial', e.target.value)}
                    className="cp-input" placeholder="Ej: Grupo Torres" />
                </Field>
              </Section>

              <Section title="Web y ubicación">
                <Field label="Página web" icon={<Globe size={11} />}>
                  <input value={info.pagina_web} onChange={e => setInfoField('pagina_web', e.target.value)}
                    className="cp-input" placeholder="https://www.empresa.com" />
                </Field>
                <Field label="Dirección fiscal" icon={<MapPin size={11} />}>
                  <textarea value={info.direccion_fiscal} onChange={e => setInfoField('direccion_fiscal', e.target.value)}
                    className="cp-input resize-none" rows={3} placeholder="Calle, colonia, ciudad, CP" />
                </Field>
              </Section>

              <Section title="Integraciones">
                <Field label="Zoho CRM Link" icon={<Building2 size={11} />}>
                  <input value={info.zoho_link} onChange={e => setInfoField('zoho_link', e.target.value)}
                    className="cp-input" placeholder="https://crm.zoho.com/..." />
                </Field>
              </Section>
            </div>
          )}

          {/* ── TAB: Contactos ── */}
          {tab === 'contactos' && (
            <div className="space-y-4">
              {contactos.length === 0 && (
                <div className="text-center py-8 text-textLow">
                  <UserPlus size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Sin contactos registrados</p>
                  <p className="text-[11px] mt-0.5 opacity-60">Agrega el primer contacto de esta cuenta</p>
                </div>
              )}

              {contactos.map((ct, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-textLow uppercase tracking-widest">
                      Contacto {i + 1}{i === 0 ? ' · Principal' : ''}
                    </span>
                    <button onClick={() => removeContacto(i)}
                      className="flex items-center gap-1 text-[11px] text-rojo/60 hover:text-rojo transition-colors">
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                  <Field label="Nombre completo">
                    <input value={ct.nombre} onChange={e => updateContacto(i, 'nombre', e.target.value)}
                      className="cp-input" placeholder="Jorge García" />
                  </Field>
                  <Field label="Cargo" icon={<Briefcase size={11} />}>
                    <input value={ct.cargo} onChange={e => updateContacto(i, 'cargo', e.target.value)}
                      className="cp-input" placeholder="Director de TI" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" icon={<Mail size={11} />}>
                      <input type="email" value={ct.email} onChange={e => updateContacto(i, 'email', e.target.value)}
                        className="cp-input" placeholder="correo@empresa.com" />
                    </Field>
                    <Field label="Teléfono" icon={<Phone size={11} />}>
                      <input type="tel" value={ct.tel} onChange={e => updateContacto(i, 'tel', e.target.value)}
                        className="cp-input" placeholder="55 1234 5678" />
                    </Field>
                  </div>
                </div>
              ))}

              {/* Botón Agregar prominente */}
              <button
                onClick={addContacto}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-cp/10 hover:bg-cp/20 border border-cp/30 hover:border-cp/50
                  text-xs font-medium text-cp transition-colors"
              >
                <UserPlus size={14} /> Agregar contacto
              </button>
            </div>
          )}

          {/* ── TAB: Servicios ── */}
          {tab === 'servicios' && (
            <div className="space-y-4">
              {servicios.length === 0 && (
                <div className="text-center py-8 text-textLow">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Sin servicios registrados</p>
                  <p className="text-[11px] mt-0.5 opacity-60">Agrega los servicios contratados</p>
                </div>
              )}

              {servicios.map((sv, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-textLow uppercase tracking-widest">
                      Servicio {i + 1}
                    </span>
                    <button onClick={() => removeServicio(i)}
                      className="flex items-center gap-1 text-[11px] text-rojo/60 hover:text-rojo transition-colors">
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                  <Field label="Nombre del servicio">
                    <input value={sv.nombre} onChange={e => updateServicio(i, 'nombre', e.target.value)}
                      className="cp-input" placeholder="AV Agentes Virtuales, CP Chat, CP Voz…" />
                  </Field>
                  <Field label="Descripción / notas">
                    <textarea value={sv.descripcion} onChange={e => updateServicio(i, 'descripcion', e.target.value)}
                      className="cp-input resize-none" rows={2}
                      placeholder="Detalles del plan, configuración especial, etc." />
                  </Field>
                </div>
              ))}

              {/* Botón Agregar prominente */}
              <button
                onClick={addServicio}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-cp/10 hover:bg-cp/20 border border-cp/30 hover:border-cp/50
                  text-xs font-medium text-cp transition-colors"
              >
                <Package size={14} /> Agregar servicio
              </button>
            </div>
          )}

          {/* ── TAB: KAM ── */}
          {tab === 'kam' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-textLow uppercase tracking-widest mb-1 pb-1.5 border-b border-border">
                  Observaciones KAM
                </p>
                <p className="text-[11px] text-textLow mb-3">
                  Notas internas sobre el estado de la relación, acuerdos, riesgos y contexto de la cuenta.
                </p>
                <textarea
                  value={obsKam}
                  onChange={e => setObsKam(e.target.value)}
                  rows={10}
                  placeholder="Escribe las observaciones KAM: estado de la relación, compromisos, riesgos, acuerdos importantes, contexto relevante..."
                  className="cp-input resize-y w-full text-sm text-textHi"
                />
                {obsKam.trim() && (
                  <button
                    type="button"
                    onClick={() => setObsKam('')}
                    className="mt-2 text-[11px] text-rojo/70 hover:text-rojo transition-colors"
                  >
                    Borrar observaciones
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-xs text-rojo bg-rojo/10 border border-rojo/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={() => !saving && setOpen(false)} disabled={saving}
            className="cp-btn cp-btn-ghost flex-1 justify-center">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="cp-btn cp-btn-primary flex-1 justify-center">
            {saving
              ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
              : <><Save size={13} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

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

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] text-textLow mb-1 font-medium">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}
