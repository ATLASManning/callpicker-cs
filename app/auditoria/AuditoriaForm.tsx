'use client'
import { useState } from 'react'
import type { AuditoriaCase, TipoEvento, EstadoAuditoria } from './types'
import { emptyCase } from './types'
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

/* ─── Tipos ──────────────────────────────────────────────────────────── */
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEPS = [
  'Datos Generales',
  'Resumen & Hallazgos',
  'Cronología',
  'Perfil & Tácticas',
  'Problema Raíz',
  'Plan de Acción',
  'Perfiles de Actores',
  'FODA & Conclusión',
]

/* ─── Helpers de estilo ──────────────────────────────────────────────── */
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 bg-white'
const textareaCls = `${inputCls} resize-y min-h-[80px]`
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1'
const sectionTitle = 'text-sm font-bold text-gray-800 mb-3'
const addBtn = 'flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-2'
const removeBtn = 'text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-1'

/* ─── Sub-componente: lista editable de strings ───────────────────────── */
function StringList({
  value, onChange, placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => j === i ? v : x))
  const add = () => onChange([...value, ''])
  const del = (i: number) => onChange(value.filter((_, j) => j !== i))
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input value={v} onChange={e => set(i, e.target.value)} placeholder={placeholder} className={inputCls} />
          {value.length > 1 && (
            <button type="button" onClick={() => del(i)} className={removeBtn}><Trash2 size={14} /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className={addBtn}><Plus size={13} /> Agregar</button>
    </div>
  )
}

/* ─── Props del componente ───────────────────────────────────────────── */
interface Props {
  onClose: () => void
  onSave: (c: AuditoriaCase) => void
}

/* ─── Componente principal ───────────────────────────────────────────── */
export default function AuditoriaForm({ onClose, onSave }: Props) {
  const [step, setStep] = useState<Step>(0)
  const [data, setData] = useState<AuditoriaCase>(emptyCase())

  /* helpers genéricos */
  const set = <K extends keyof AuditoriaCase>(key: K, value: AuditoriaCase[K]) =>
    setData(d => ({ ...d, [key]: value }))

  const setKpi = (i: number, field: 'label' | 'value' | 'color', v: string) =>
    setData(d => ({ ...d, kpis: d.kpis.map((k, j) => j === i ? { ...k, [field]: v } : k) }))

  const addRow = <T,>(key: keyof AuditoriaCase, empty: T) =>
    setData(d => ({ ...d, [key]: [...(d[key] as T[]), empty] }))

  const setRow = <T,>(key: keyof AuditoriaCase, i: number, patch: Partial<T>) =>
    setData(d => ({
      ...d,
      [key]: (d[key] as T[]).map((r, j) => j === i ? { ...r, ...patch } : r),
    }))

  const delRow = (key: keyof AuditoriaCase, i: number) =>
    setData(d => ({ ...d, [key]: (d[key] as unknown[]).filter((_, j) => j !== i) }))

  /* foda helper */
  const setFoda = (quad: keyof AuditoriaCase['foda'], v: string[]) =>
    setData(d => ({ ...d, foda: { ...d.foda, [quad]: v } }))

  const canSave = data.nombre.trim().length > 0 && data.id.trim().length > 0

  /* ─── Render por paso ──────────────────────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      /* ── PASO 0: Datos Generales ──────────────────────────────────── */
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ID único <span className="text-red-400">*</span></label>
              <input value={data.id} onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="ej. acme-2026" className={inputCls} />
              <p className="text-[10px] text-gray-400 mt-1">Sin espacios, solo letras y guiones</p>
            </div>
            <div>
              <label className={labelCls}>Nombre del cliente <span className="text-red-400">*</span></label>
              <input value={data.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Razón social o nombre comercial" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sector</label>
              <input value={data.sector} onChange={e => set('sector', e.target.value)}
                placeholder="ej. Educación Superior" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tipo de cliente</label>
              <input value={data.tipo_cliente} onChange={e => set('tipo_cliente', e.target.value)}
                placeholder="ej. Enterprise AAA" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Período</label>
              <input value={data.fecha_periodo} onChange={e => set('fecha_periodo', e.target.value)}
                placeholder="ej. Marzo – Abril 2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha de auditoría</label>
              <input value={data.fecha_auditoria} onChange={e => set('fecha_auditoria', e.target.value)}
                placeholder="ej. Abr 2026" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Estado del caso</label>
              <CustomSelect value={data.estado} onChange={v => set('estado', v as EstadoAuditoria)} className={inputCls}
                options={[
                  { value: 'en_riesgo', label: 'En Riesgo' },
                  { value: 'rescatable', label: 'Rescatable' },
                  { value: 'recuperado', label: 'Recuperado' },
                  { value: 'perdido', label: 'Perdido' },
                  { value: 'activo', label: 'Activo' },
                ]} />
            </div>
            <div>
              <label className={labelCls}>Versión del informe</label>
              <input value={data.version} onChange={e => set('version', e.target.value)}
                placeholder="1.0" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Descripción / Subtítulo del caso</label>
            <input value={data.descripcion_contexto} onChange={e => set('descripcion_contexto', e.target.value)}
              placeholder="ej. Integración Genjo + CP Chat via WhatsApp API" className={inputCls} />
          </div>

          <div>
            <p className={sectionTitle}>KPIs del caso (máx. 4)</p>
            <div className="space-y-3">
              {data.kpis.map((k, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px] gap-2 items-start">
                  <div>
                    {i === 0 && <label className={labelCls}>Etiqueta</label>}
                    <input value={k.label} onChange={e => setKpi(i, 'label', e.target.value)}
                      placeholder="ej. Días en crisis" className={inputCls} />
                  </div>
                  <div>
                    {i === 0 && <label className={labelCls}>Valor</label>}
                    <input value={k.value} onChange={e => setKpi(i, 'value', e.target.value)}
                      placeholder="ej. 35 días" className={inputCls} />
                  </div>
                  <div>
                    {i === 0 && <label className={labelCls}>Color</label>}
                    <input type="color" value={k.color} onChange={e => setKpi(i, 'color', e.target.value)}
                      className="w-full h-[38px] rounded-lg border border-gray-200 cursor-pointer p-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

      /* ── PASO 1: Resumen & Hallazgos ──────────────────────────────── */
      case 1: return (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Resumen ejecutivo</label>
            <textarea value={data.resumen_ejecutivo} onChange={e => set('resumen_ejecutivo', e.target.value)}
              placeholder="Descripción general del caso, contexto y cronología de la crisis..." className={textareaCls} rows={5} />
          </div>
          <div>
            <label className={labelCls}>Resultado positivo / resolución</label>
            <textarea value={data.resultado_positivo} onChange={e => set('resultado_positivo', e.target.value)}
              placeholder="¿Cómo se estabilizó o resolvió el caso?" className={textareaCls} rows={3} />
          </div>
          <div>
            <label className={labelCls}>Hallazgos críticos</label>
            <StringList value={data.hallazgos}
              onChange={v => set('hallazgos', v)}
              placeholder="Describe el hallazgo crítico..." />
          </div>
        </div>
      )

      /* ── PASO 2: Cronología ───────────────────────────────────────── */
      case 2: return (
        <div className="space-y-3">
          <p className={sectionTitle}>Eventos cronológicos del caso</p>
          {data.cronologia.map((e, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
              <button type="button" onClick={() => delRow('cronologia', i)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha</label>
                  <input value={e.fecha} onChange={ev => setRow('cronologia', i, { fecha: ev.target.value })}
                    placeholder="ej. Mar 11" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipo de evento</label>
                  <CustomSelect value={e.tipo}
                    onChange={v => setRow('cronologia', i, { tipo: v as TipoEvento })}
                    className={inputCls}
                    options={[
                      { value: 'neutral', label: 'Neutral' },
                      { value: 'problema', label: 'Problema' },
                      { value: 'pivote', label: 'Pivote' },
                      { value: 'ok', label: 'OK / Resolución' },
                    ]} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Responsable</label>
                <input value={e.responsable} onChange={ev => setRow('cronologia', i, { responsable: ev.target.value })}
                  placeholder="ej. José Galván (Ventas)" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descripción del evento</label>
                <textarea value={e.evento} onChange={ev => setRow('cronologia', i, { evento: ev.target.value })}
                  placeholder="¿Qué ocurrió?" className={textareaCls} rows={2} />
              </div>
            </div>
          ))}
          <button type="button" className={addBtn}
            onClick={() => addRow('cronologia', { fecha: '', responsable: '', evento: '', tipo: 'neutral' as TipoEvento })}>
            <Plus size={14} /> Agregar evento
          </button>
        </div>
      )

      /* ── PASO 3: Perfil & Tácticas ───────────────────────────────── */
      case 3: return (
        <div className="space-y-5">
          <div>
            <p className={sectionTitle}>Campos del perfil del cliente</p>
            <div className="space-y-2">
              {data.perfil_campos.map((f, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-start">
                  <input value={f.label} onChange={e => setRow('perfil_campos', i, { label: e.target.value })}
                    placeholder="Etiqueta" className={inputCls} />
                  <input value={f.value} onChange={e => setRow('perfil_campos', i, { value: e.target.value })}
                    placeholder="Valor" className={inputCls} />
                </div>
              ))}
              <button type="button" className={addBtn}
                onClick={() => addRow('perfil_campos', { label: '', value: '' })}>
                <Plus size={13} /> Agregar campo
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Necesidad de negocio</label>
            <textarea value={data.necesidad_negocio} onChange={e => set('necesidad_negocio', e.target.value)}
              placeholder="¿Qué problema vino a resolver con Callpicker?" className={textareaCls} rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Potencial a corto plazo</label>
              <StringList value={data.potencial_corto}
                onChange={v => set('potencial_corto', v)}
                placeholder="Objetivo de corto plazo" />
            </div>
            <div>
              <label className={labelCls}>Potencial a largo plazo</label>
              <StringList value={data.potencial_largo}
                onChange={v => set('potencial_largo', v)}
                placeholder="Objetivo de largo plazo" />
            </div>
          </div>

          <div>
            <p className={sectionTitle}>Tácticas de negociación del cliente</p>
            {data.tacticas.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 mb-3 relative">
                <button type="button" onClick={() => delRow('tacticas', i)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
                <div>
                  <label className={labelCls}>Nombre de la táctica</label>
                  <input value={t.nombre} onChange={e => setRow('tacticas', i, { nombre: e.target.value })}
                    placeholder="ej. Activación de deuda moral" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Descripción observable</label>
                  <textarea value={t.descripcion}
                    onChange={e => setRow('tacticas', i, { descripcion: e.target.value })}
                    placeholder="¿Cómo se manifiesta esta táctica?" className={textareaCls} rows={2} />
                </div>
                <div>
                  <label className={labelCls}>Impacto en la empresa</label>
                  <input value={t.impacto} onChange={e => setRow('tacticas', i, { impacto: e.target.value })}
                    placeholder="ej. Pérdida de leverage comercial" className={inputCls} />
                </div>
              </div>
            ))}
            <button type="button" className={addBtn}
              onClick={() => addRow('tacticas', { nombre: '', descripcion: '', impacto: '' })}>
              <Plus size={13} /> Agregar táctica
            </button>
          </div>

          <div>
            <label className={labelCls}>Señal de alarma principal (opcional)</label>
            <textarea value={data.senal_alarma ?? ''} onChange={e => set('senal_alarma', e.target.value)}
              placeholder="¿Cuándo debe alertar el equipo?" className={textareaCls} rows={2} />
          </div>
        </div>
      )

      /* ── PASO 4: Problema Raíz ────────────────────────────────────── */
      case 4: return (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Problema raíz (frase concisa)</label>
            <input value={data.problema_raiz} onChange={e => set('problema_raiz', e.target.value)}
              placeholder="ej. Ausencia de proceso formal de Discovery" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Detalle del problema raíz</label>
            <textarea value={data.problema_raiz_detalle}
              onChange={e => set('problema_raiz_detalle', e.target.value)}
              placeholder="Explica el contexto y las causas subyacentes..." className={textareaCls} rows={4} />
          </div>

          <div>
            <p className={sectionTitle}>Flujo real — Lo que ocurrió</p>
            {data.flujo_real.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 mb-3 relative">
                <button type="button" onClick={() => delRow('flujo_real', i)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Fase</label>
                    <input value={f.fase} onChange={e => setRow('flujo_real', i, { fase: e.target.value })}
                      placeholder="ej. 1. Venta" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Área / Responsable</label>
                    <input value={f.area} onChange={e => setRow('flujo_real', i, { area: e.target.value })}
                      placeholder="ej. Ventas – José Galván" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Acción tomada</label>
                  <input value={f.accion} onChange={e => setRow('flujo_real', i, { accion: e.target.value })}
                    placeholder="¿Qué hicieron?" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Resultado / consecuencia</label>
                  <input value={f.resultado} onChange={e => setRow('flujo_real', i, { resultado: e.target.value })}
                    placeholder="¿Qué consecuencia tuvo?" className={inputCls} />
                </div>
              </div>
            ))}
            <button type="button" className={addBtn}
              onClick={() => addRow('flujo_real', { fase: '', area: '', accion: '', resultado: '' })}>
              <Plus size={13} /> Agregar fase
            </button>
          </div>

          <div>
            <p className={sectionTitle}>Comparativo Real vs. Ideal</p>
            {data.comparativo.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start mb-2">
                <input value={c.metrica} onChange={e => setRow('comparativo', i, { metrica: e.target.value })}
                  placeholder="Métrica" className={inputCls} />
                <input value={c.real} onChange={e => setRow('comparativo', i, { real: e.target.value })}
                  placeholder="Proceso real" className={inputCls} />
                <input value={c.ideal} onChange={e => setRow('comparativo', i, { ideal: e.target.value })}
                  placeholder="Proceso ideal" className={inputCls} />
                {data.comparativo.length > 1 && (
                  <button type="button" onClick={() => delRow('comparativo', i)} className={removeBtn}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={addBtn}
              onClick={() => addRow('comparativo', { metrica: '', real: '', ideal: '' })}>
              <Plus size={13} /> Agregar métrica
            </button>
          </div>
        </div>
      )

      /* ── PASO 5: Plan de Acción ───────────────────────────────────── */
      case 5: {
        const planSections = [
          { key: 'plan_inmediato' as const, label: 'Plan Inmediato', color: '#ef4444' },
          { key: 'plan_mediano'   as const, label: 'Mediano Plazo',  color: '#f59e0b' },
          { key: 'plan_estrategico' as const, label: 'Estratégico (Largo Plazo)', color: '#22c55e' },
        ]
        return (
          <div className="space-y-6">
            {planSections.map(ps => (
              <div key={ps.key}>
                <p className={sectionTitle} style={{ color: ps.color }}>{ps.label}</p>
                {(data[ps.key] as { accion: string; responsable: string; criterio: string }[]).map((a, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 mb-3 relative">
                    <button type="button" onClick={() => delRow(ps.key, i)}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <label className={labelCls}>Acción</label>
                      <input value={a.accion} onChange={e => setRow(ps.key, i, { accion: e.target.value })}
                        placeholder="Describir la acción concreta" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Responsable</label>
                        <input value={a.responsable}
                          onChange={e => setRow(ps.key, i, { responsable: e.target.value })}
                          placeholder="ej. Ventas + UX" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Criterio de éxito</label>
                        <input value={a.criterio}
                          onChange={e => setRow(ps.key, i, { criterio: e.target.value })}
                          placeholder="¿Cómo saber que se logró?" className={inputCls} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className={addBtn}
                  onClick={() => addRow(ps.key, { accion: '', responsable: '', criterio: '' })}>
                  <Plus size={13} /> Agregar acción
                </button>
              </div>
            ))}

            <div>
              <p className={sectionTitle}>Áreas de Oportunidad</p>
              {data.areas_oportunidad.map((o, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 mb-3 relative">
                  <button type="button" onClick={() => delRow('areas_oportunidad', i)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <label className={labelCls}>Área de oportunidad</label>
                    <input value={o.area} onChange={e => setRow('areas_oportunidad', i, { area: e.target.value })}
                      placeholder="ej. Proceso formal de Discovery" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Impacto esperado</label>
                      <input value={o.impacto}
                        onChange={e => setRow('areas_oportunidad', i, { impacto: e.target.value })}
                        placeholder="¿Qué se mejora?" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Responsable</label>
                      <input value={o.responsable}
                        onChange={e => setRow('areas_oportunidad', i, { responsable: e.target.value })}
                        placeholder="ej. Ventas + Ingeniería" className={inputCls} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className={addBtn}
                onClick={() => addRow('areas_oportunidad', { area: '', impacto: '', responsable: '' })}>
                <Plus size={13} /> Agregar área
              </button>
            </div>
          </div>
        )
      }

      /* ── PASO 6: Perfiles de Actores ─────────────────────────────── */
      case 6: return (
        <div className="space-y-4">
          {data.perfiles.map((p, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
              <button type="button" onClick={() => delRow('perfiles', i)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-[1fr_1fr_60px] gap-3">
                <div>
                  <label className={labelCls}>Nombre del actor</label>
                  <input value={p.nombre}
                    onChange={e => setRow('perfiles', i, { nombre: e.target.value })}
                    placeholder="Nombre completo" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Rol / área</label>
                  <input value={p.rol}
                    onChange={e => setRow('perfiles', i, { rol: e.target.value })}
                    placeholder="ej. Ventas — Gestor de cuenta" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <input type="color" value={p.color}
                    onChange={e => setRow('perfiles', i, { color: e.target.value })}
                    className="w-full h-[38px] rounded-lg border border-gray-200 cursor-pointer p-1" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Campos del perfil</label>
                <div className="space-y-2">
                  {p.campos.map((c, j) => (
                    <div key={j} className="grid grid-cols-2 gap-2 items-start">
                      <input value={c.label}
                        onChange={e => {
                          const newCampos = p.campos.map((x, k) => k === j ? { ...x, label: e.target.value } : x)
                          setRow('perfiles', i, { campos: newCampos })
                        }}
                        placeholder="Etiqueta" className={inputCls} />
                      <div className="flex gap-2">
                        <input value={c.value}
                          onChange={e => {
                            const newCampos = p.campos.map((x, k) => k === j ? { ...x, value: e.target.value } : x)
                            setRow('perfiles', i, { campos: newCampos })
                          }}
                          placeholder="Valor" className={inputCls} />
                        {p.campos.length > 1 && (
                          <button type="button"
                            onClick={() => setRow('perfiles', i, { campos: p.campos.filter((_, k) => k !== j) })}
                            className={removeBtn}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className={addBtn}
                    onClick={() => setRow('perfiles', i, { campos: [...p.campos, { label: '', value: '' }] })}>
                    <Plus size={13} /> Agregar campo
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className={addBtn}
            onClick={() => addRow('perfiles', { nombre: '', rol: '', color: '#6366f1', campos: [{ label: '', value: '' }] })}>
            <Plus size={14} /> Agregar actor
          </button>
        </div>
      )

      /* ── PASO 7: FODA & Conclusión ───────────────────────────────── */
      case 7: return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: 'fortalezas' as const,    label: 'Fortalezas (internas)', color: '#22c55e', placeholder: 'ej. Alta adopción del cliente' },
              { key: 'oportunidades' as const, label: 'Oportunidades (externas)', color: '#3b82f6', placeholder: 'ej. Migración de voz en octubre' },
              { key: 'debilidades' as const,   label: 'Debilidades (internas)', color: '#f59e0b', placeholder: 'ej. Carencia de webhooks DLR' },
              { key: 'amenazas' as const,      label: 'Amenazas (externas)', color: '#ef4444', placeholder: 'ej. Presupuesto de integrador alto' },
            ] as const).map(q => (
              <div key={q.key}>
                <label className={labelCls} style={{ color: q.color }}>{q.label}</label>
                <StringList value={data.foda[q.key]}
                  onChange={v => setFoda(q.key, v)}
                  placeholder={q.placeholder} />
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>Conclusión del caso</label>
            <textarea value={data.conclusion} onChange={e => set('conclusion', e.target.value)}
              placeholder="Reflexión general sobre las lecciones aprendidas..." className={textareaCls} rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Lo que se pierde si no actúa</label>
              <StringList value={data.pierde} onChange={v => set('pierde', v)} placeholder="ej. Cliente Enterprise con potencial..." />
            </div>
            <div>
              <label className={labelCls}>Lo que se gana si actúa</label>
              <StringList value={data.gana} onChange={v => set('gana', v)} placeholder="ej. Contrato de 5 años..." />
            </div>
          </div>

          <div>
            <label className={labelCls}>Recomendación central</label>
            <textarea value={data.recomendacion_central}
              onChange={e => set('recomendacion_central', e.target.value)}
              placeholder="La acción más importante que debe tomarse..." className={textareaCls} rows={3} />
          </div>
        </div>
      )
    }
  }

  /* ─── Render del modal ───────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header del modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Nueva Auditoría de Cuenta</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Paso {step + 1} de {STEPS.length} — <span className="font-medium text-gray-700">{STEPS[step]}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                style={{ background: i <= step ? '#1B3FCC' : '#e5e7eb' }} />
            ))}
          </div>
          <div className="flex gap-0.5 mt-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i as Step)}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap transition-colors"
                style={i === step
                  ? { background: '#1B3FCC15', color: '#1B3FCC' }
                  : { color: '#9ca3af' }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStep()}
        </div>

        {/* Footer del modal */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1) as Step)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1) as Step)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: '#1B3FCC' }}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => canSave && onSave(data)}
                disabled={!canSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: canSave ? '#22c55e' : '#9ca3af' }}
              >
                <Check size={16} /> Guardar Auditoría
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
