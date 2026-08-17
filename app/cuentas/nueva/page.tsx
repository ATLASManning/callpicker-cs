'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Search, CheckCircle2, AlertCircle, Loader2,
  Building2, User, Phone, Mail, Globe, MapPin, DollarSign,
  Activity, Save, RefreshCw,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'
import type { Asesor, EstadoCuenta } from '@/lib/types'
import { formatMXN } from '@/lib/types'

const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']
const ASESOR_INITIALS: Record<Asesor, string> = { 'Fátima': 'F', 'Dan': 'D', 'Claudia': 'C' }

// ── Estado inicial del formulario ─────────────────────────────────────────────
const DEFAULTS = {
  empresa:              '',
  asesor:               '' as Asesor | '',
  consecutivo:          '',
  cid:                  '',
  estado:               'activo' as EstadoCuenta,
  activo_desde:         '',
  servicio:             '',
  grupo_empresarial:    '',

  // Contacto
  contacto_nombre:      '',
  contacto_cargo:       '',
  contacto_email:       '',
  contacto_tel:         '',

  // Empresa
  giro:                 '',
  tamano_empresa:       '',
  total_empleados:      '',
  num_oficinas:         '',
  pagina_web:           '',
  zoho_link:            '',
  direccion_fiscal:     '',

  // Facturación
  facturacion:          '' as string | number,

  // Health Score
  health_score:         50,
  score_actividad:      50,
  score_adopcion:       50,
  score_pago:           50,
  score_relacional:     50,

  // Flags adopción
  tiene_chat_activo:        false,
  tiene_integracion_api:    false,
  tiene_pago_automatico:    false,
  tiene_ia_voz:             false,
  tiene_ia_chat:            false,
  dashboard_revisado:       false,
  pagos_al_corriente:       true,

  // Notas
  notas:                '',
  observaciones_kam:    '',
}

type FormState = typeof DEFAULTS

// ── Sección ───────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="cp-card p-5 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Icon size={15} className="text-cp" />
        <h3 className="text-sm font-bold text-textHi">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Campo de formulario ───────────────────────────────────────────────────────
function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-textMid uppercase tracking-wide">
        {label}{required && <span className="text-rojo ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Slider de score ───────────────────────────────────────────────────────────
function ScoreSlider({ label, color, value, onChange }: {
  label: string; color: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-textMid">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function NuevaCuentaPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(DEFAULTS)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [zohoLoading, setZohoLoading] = useState(false)
  const [zohoResult, setZohoResult]   = useState<{
    mrr: number; factura_mensual: number; semaforo: string; found: boolean
  } | null>(null)

  // ── Actualizar campo ──────────────────────────────────────────────────────
  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  // ── Sugerir consecutivo al elegir asesor ──────────────────────────────────
  function handleAsesor(a: Asesor | '') {
    set('asesor', a)
    if (a && !form.consecutivo) {
      const initial = ASESOR_INITIALS[a as Asesor]
      set('consecutivo', `${initial}`)
    }
  }

  // ── Lookup Zoho ───────────────────────────────────────────────────────────
  async function buscarZoho() {
    const empresa = form.empresa.trim()
    if (!empresa) return
    setZohoLoading(true)
    setZohoResult(null)
    try {
      const res  = await fetch(`/api/zoho-lookup?empresa=${encodeURIComponent(empresa)}`)
      const data = await res.json()
      const found = data.mrr > 0 || data.factura_mensual > 0
      setZohoResult({ ...data, found })
      if (found) {
        // Auto-llenar facturación con el valor de Zoho
        const val = data.factura_mensual > 0 ? data.factura_mensual : data.mrr
        set('facturacion', Math.round(val))
      }
    } catch {
      setZohoResult({ mrr: 0, factura_mensual: 0, semaforo: '', found: false })
    } finally {
      setZohoLoading(false)
    }
  }

  // ── Health score compuesto ────────────────────────────────────────────────
  function recalcHS(s: Partial<FormState>) {
    const act = Number(s.score_actividad  ?? form.score_actividad)
    const ado = Number(s.score_adopcion   ?? form.score_adopcion)
    const pag = Number(s.score_pago       ?? form.score_pago)
    const rel = Number(s.score_relacional ?? form.score_relacional)
    return Math.round(act * 0.35 + ado * 0.30 + pag * 0.20 + rel * 0.15)
  }

  function setScore(key: 'score_actividad' | 'score_adopcion' | 'score_pago' | 'score_relacional', val: number) {
    const patch = { [key]: val }
    const hs = recalcHS(patch)
    setForm(prev => ({ ...prev, ...patch, health_score: hs }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')

    // Validaciones básicas
    if (!form.empresa.trim()) { setSaveError('El nombre de empresa es requerido'); return }
    if (!form.asesor)         { setSaveError('El asesor es requerido'); return }
    if (!form.consecutivo.trim()) { setSaveError('El consecutivo es requerido'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        empresa:    form.empresa.trim().toUpperCase(),
        consecutivo: form.consecutivo.trim().toUpperCase(),
        cid:        form.cid.trim() || null,
        facturacion: form.facturacion === '' ? 0 : Number(form.facturacion),
        // Defaults para campos numéricos no editados
        dias_sin_actividad:     0,
        llamadas_cambio_pct:    0,
        llamadas_atendidas_pct: 0,
        incidencias_pago:       0,
        tickets_abiertos:       0,
        tiene_ticket_reincidente: false,
        dias_como_cliente:      0,
        upsell_producto:        null,
        crossell_producto:      null,
        valor_upsell_estimado:  null,
        ultimo_contacto:        null,
        proximo_contacto:       null,
        fecha_ultima_llamada:   null,
        nps_score:              null,
        contactos_json:         null,
        servicios_json:         null,
        activo_desde:           form.activo_desde || null,
        grupo_empresarial:      form.grupo_empresarial || null,
        // nullify empty strings
        contacto_nombre:  form.contacto_nombre  || null,
        contacto_cargo:   form.contacto_cargo   || null,
        contacto_email:   form.contacto_email   || null,
        contacto_tel:     form.contacto_tel     || null,
        giro:             form.giro             || null,
        tamano_empresa:   form.tamano_empresa   || null,
        total_empleados:  form.total_empleados  || null,
        num_oficinas:     form.num_oficinas     || null,
        pagina_web:       form.pagina_web       || null,
        zoho_link:        form.zoho_link        || null,
        direccion_fiscal: form.direccion_fiscal || null,
        servicio:         form.servicio         || null,
        notas:            form.notas            || null,
        observaciones_kam: form.observaciones_kam || null,
      }

      const res = await fetch('/api/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        const msg = typeof err.error === 'string'
          ? err.error
          : (err.error?.message ?? err.message ?? 'Error al guardar')
        throw new Error(msg)
      }

      const created = await res.json()
      router.push(`/cuentas/${created.id}`)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const hsColor = form.health_score >= 80 ? '#22C55E'
    : form.health_score >= 60 ? '#3B82F6'
    : form.health_score >= 40 ? '#EAB308'
    : form.health_score >= 20 ? '#F97316' : '#EF4444'

  return (
    <div className="min-h-screen pb-16">
      <PageHeader
        title="Nueva Cuenta"
        subtitle="Completa los datos para registrar una cuenta estratégica"
        actions={
          <Link href="/cuentas" className="cp-btn cp-btn-ghost text-sm flex items-center gap-1.5">
            <ArrowLeft size={14} /> Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="px-6 pt-4 space-y-4 max-w-5xl">

        {/* ── 1. Información Principal ─────────────────────────────────── */}
        <Section title="Información Principal" icon={Building2}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre de Empresa" required>
              <input
                className="cp-input"
                placeholder="Ej. GRUPO TORRES CORZO"
                value={form.empresa}
                onChange={e => set('empresa', e.target.value)}
              />
            </Field>

            <Field label="Asesor" required>
              <CustomSelect className="cp-select" value={form.asesor}
                onChange={v => handleAsesor(v as Asesor | '')}
                options={[{ value: '', label: 'Seleccionar asesor...' }, ...ASESORES.map(a => ({ value: a, label: a }))]} />
            </Field>

            <Field label="Consecutivo" required>
              <input
                className="cp-input font-mono"
                placeholder={form.asesor ? `Ej. ${ASESOR_INITIALS[form.asesor as Asesor]}1` : 'Ej. F47'}
                value={form.consecutivo}
                onChange={e => set('consecutivo', e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="CID (Zoho)">
              <input
                className="cp-input font-mono"
                placeholder="ID de cliente en Zoho"
                value={form.cid}
                onChange={e => set('cid', e.target.value)}
              />
            </Field>

            <Field label="Estado">
              <CustomSelect className="cp-select" value={form.estado}
                onChange={v => set('estado', v as EstadoCuenta)}
                options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'en_riesgo', label: 'En riesgo' },
                  { value: 'hibernacion', label: 'Hibernación' },
                  { value: 'cancelado', label: 'Cancelado' },
                ]} />
            </Field>

            <Field label="Activo desde">
              <input type="date" className="cp-input"
                value={form.activo_desde}
                onChange={e => set('activo_desde', e.target.value)} />
            </Field>

            <Field label="Servicio / Producto">
              <input className="cp-input"
                placeholder="Ej. SD-WAN, Callpicker Pro..."
                value={form.servicio}
                onChange={e => set('servicio', e.target.value)} />
            </Field>

            <Field label="Grupo Empresarial">
              <input className="cp-input"
                placeholder="Nombre del grupo (si aplica)"
                value={form.grupo_empresarial}
                onChange={e => set('grupo_empresarial', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── 2. Contacto Principal ────────────────────────────────────── */}
        <Section title="Contacto Principal" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre">
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
                <input className="cp-input pl-8"
                  placeholder="Nombre del contacto"
                  value={form.contacto_nombre}
                  onChange={e => set('contacto_nombre', e.target.value)} />
              </div>
            </Field>

            <Field label="Cargo">
              <input className="cp-input"
                placeholder="Director TI, Gerente, CEO..."
                value={form.contacto_cargo}
                onChange={e => set('contacto_cargo', e.target.value)} />
            </Field>

            <Field label="Email">
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
                <input type="email" className="cp-input pl-8"
                  placeholder="correo@empresa.com"
                  value={form.contacto_email}
                  onChange={e => set('contacto_email', e.target.value)} />
              </div>
            </Field>

            <Field label="Teléfono">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
                <input type="tel" className="cp-input pl-8"
                  placeholder="442 123 4567"
                  value={form.contacto_tel}
                  onChange={e => set('contacto_tel', e.target.value)} />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── 3. Datos de Empresa ──────────────────────────────────────── */}
        <Section title="Datos de Empresa" icon={Building2}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Giro / Industria">
              <input className="cp-input"
                placeholder="Venta de vehículos, Manufactura..."
                value={form.giro}
                onChange={e => set('giro', e.target.value)} />
            </Field>

            <Field label="Tamaño de Empresa">
              <CustomSelect className="cp-select" value={form.tamano_empresa}
                onChange={v => set('tamano_empresa', v)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'micro', label: 'Micro (1–10)' },
                  { value: 'pequena', label: 'Pequeña (11–50)' },
                  { value: 'mediana', label: 'Mediana (51–250)' },
                  { value: 'grande', label: 'Grande (250+)' },
                ]} />
            </Field>

            <Field label="Total de Empleados">
              <input type="number" className="cp-input"
                placeholder="Ej. 120"
                value={form.total_empleados}
                onChange={e => set('total_empleados', e.target.value)} />
            </Field>

            <Field label="Número de Oficinas / Sitios">
              <input type="number" className="cp-input"
                placeholder="Ej. 3"
                value={form.num_oficinas}
                onChange={e => set('num_oficinas', e.target.value)} />
            </Field>

            <Field label="Sitio Web">
              <div className="relative">
                <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
                <input className="cp-input pl-8"
                  placeholder="https://empresa.com"
                  value={form.pagina_web}
                  onChange={e => set('pagina_web', e.target.value)} />
              </div>
            </Field>

            <Field label="Zoho CRM Link">
              <input className="cp-input"
                placeholder="URL en Zoho CRM"
                value={form.zoho_link}
                onChange={e => set('zoho_link', e.target.value)} />
            </Field>

            <div className="col-span-2">
              <Field label="Dirección Fiscal">
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-3 text-textLow" />
                  <textarea className="cp-input pl-8 resize-none" rows={2}
                    placeholder="Calle, Col., Ciudad, Estado, CP"
                    value={form.direccion_fiscal}
                    onChange={e => set('direccion_fiscal', e.target.value)} />
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* ── 4. Facturación (Zoho) ────────────────────────────────────── */}
        <Section title="Facturación" icon={DollarSign}>
          {/* Lookup Zoho */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-[11px] text-textLow mb-1.5">
                Ingresa el nombre de empresa y haz clic en <strong>Verificar en Zoho</strong> para obtener la facturación automáticamente.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-textMid font-semibold">Empresa:</span>
                <span className="text-xs text-textHi font-bold">
                  {form.empresa || <span className="text-textLow italic">sin nombre aún</span>}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={buscarZoho}
              disabled={!form.empresa.trim() || zohoLoading}
              className="cp-btn cp-btn-ghost flex items-center gap-1.5 text-sm"
            >
              {zohoLoading
                ? <><Loader2 size={13} className="animate-spin" /> Buscando...</>
                : <><Search size={13} /> Verificar en Zoho</>
              }
            </button>
          </div>

          {/* Resultado Zoho */}
          {zohoResult !== null && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
              zohoResult.found
                ? 'bg-verde/5 border-verde/30'
                : 'bg-surface border-border'
            }`}>
              {zohoResult.found
                ? <CheckCircle2 size={16} className="text-verde flex-shrink-0" />
                : <AlertCircle size={16} className="text-textLow flex-shrink-0" />
              }
              {zohoResult.found ? (
                <div className="flex items-center gap-4">
                  <span className="text-textMid">Encontrado en Zoho:</span>
                  <span className="font-bold text-textHi">
                    Factura mensual: {formatMXN(zohoResult.factura_mensual || zohoResult.mrr)}
                  </span>
                  {zohoResult.factura_mensual > 0 && zohoResult.mrr > 0 && (
                    <span className="text-xs text-textLow">MRR: {formatMXN(zohoResult.mrr)}</span>
                  )}
                  {zohoResult.semaforo && (
                    <span className="text-xs px-2 py-0.5 rounded-full border text-textMid border-border">
                      {zohoResult.semaforo}
                    </span>
                  )}
                  <span className="text-xs text-verde">✓ Facturación actualizada</span>
                </div>
              ) : (
                <span className="text-textLow">No se encontró esta empresa en Zoho Facturación. Ingresa la facturación manualmente.</span>
              )}
            </div>
          )}

          {/* Campo manual */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Factura Mensual (MXN)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow text-sm">$</span>
                <input
                  type="number"
                  className="cp-input pl-7"
                  placeholder="0"
                  value={form.facturacion}
                  onChange={e => set('facturacion', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Pagos al corriente">
              <div className="flex items-center gap-3 h-[38px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.pagos_al_corriente}
                    onChange={e => set('pagos_al_corriente', e.target.checked)}
                    className="w-4 h-4 rounded accent-cp" />
                  <span className="text-sm text-textMid">Sí, pagos al corriente</span>
                </label>
              </div>
            </Field>
          </div>
        </Section>

        {/* ── 5. Health Score ──────────────────────────────────────────── */}
        <Section title="Health Score" icon={Activity}>
          {/* Score compuesto */}
          <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-surface mb-2">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2"
                style={{ borderColor: hsColor, color: hsColor, background: `${hsColor}10` }}>
                {form.health_score}
              </div>
              <span className="text-[10px] text-textLow mt-1">HS Global</span>
            </div>
            <div className="flex-1 space-y-2.5">
              <ScoreSlider label="Actividad (35%)" color="#3B82F6"
                value={form.score_actividad}
                onChange={v => setScore('score_actividad', v)} />
              <ScoreSlider label="Adopción (30%)" color="#A855F7"
                value={form.score_adopcion}
                onChange={v => setScore('score_adopcion', v)} />
              <ScoreSlider label="Pago (20%)" color="#22C55E"
                value={form.score_pago}
                onChange={v => setScore('score_pago', v)} />
              <ScoreSlider label="Relacional (15%)" color="#F97316"
                value={form.score_relacional}
                onChange={v => setScore('score_relacional', v)} />
            </div>
          </div>
        </Section>

        {/* ── 6. Adopción de Producto ──────────────────────────────────── */}
        <Section title="Adopción de Producto" icon={CheckCircle2}>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['tiene_chat_activo',     'Chat Activo'],
              ['tiene_integracion_api', 'Integración API'],
              ['tiene_pago_automatico', 'Pago Automático'],
              ['tiene_ia_voz',          'IA Voz'],
              ['tiene_ia_chat',         'IA Chat'],
              ['dashboard_revisado',    'Dashboard Revisado'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-border hover:border-cp/30 transition-colors">
                <input type="checkbox"
                  checked={form[key]}
                  onChange={e => set(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-cp flex-shrink-0" />
                <span className="text-sm text-textMid">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* ── 7. Notas ─────────────────────────────────────────────────── */}
        <Section title="Notas" icon={Mail}>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Notas internas">
              <textarea className="cp-input resize-none" rows={3}
                placeholder="Contexto general de la cuenta, acuerdos, particularidades..."
                value={form.notas}
                onChange={e => set('notas', e.target.value)} />
            </Field>
            <Field label="Observaciones KAM">
              <textarea className="cp-input resize-none" rows={2}
                placeholder="Observaciones del Key Account Manager..."
                value={form.observaciones_kam}
                onChange={e => set('observaciones_kam', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Error y botón guardar ─────────────────────────────────────── */}
        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rojo/10 border border-rojo/30 text-sm text-rojo">
            <AlertCircle size={15} />
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link href="/cuentas" className="cp-btn cp-btn-ghost flex items-center gap-1.5">
            <ArrowLeft size={14} /> Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="cp-btn cp-btn-primary flex items-center gap-2 px-6"
          >
            {saving
              ? <><RefreshCw size={14} className="animate-spin" /> Guardando...</>
              : <><Save size={14} /> Guardar Cuenta</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
