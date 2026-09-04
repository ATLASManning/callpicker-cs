'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { UserPlus, Loader2, Search, Trash2, X } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

/**
 * Lead — captura de prospectos.
 *
 * Guarda en Supabase, no en localStorage. El registro de oportunidades que
 * vive arriba usa el navegador, y por eso lo que captura un asesor no lo ve
 * nadie más y se pierde al limpiar la caché. Un lead es dinero potencial:
 * tiene que sobrevivir al navegador y poder repartirse.
 */

/* Portafolio real de Callpicker. Un catálogo cerrado permite reportar después
 * qué servicio está jalando prospectos; texto libre no. */
const SERVICIOS = [
  'Extensiones / Comunicación Empresarial',
  'Visibilidad y Control (VyC)',
  'Callpicker Chat (omnicanalidad)',
  'IA de Voz',
  'IA de Chat',
  'Integración vía API / CRM',
  'Callpicker Pay',
  'Calltracking',
  'Migración desde otra plataforma',
  'Aún no definido',
]

const ESTADOS = [
  { value: 'nuevo',        label: 'Nuevo',          color: '#3B82F6' },
  { value: 'contactado',   label: 'Contactado',     color: '#0EA5E9' },
  { value: 'seguimiento',  label: 'En seguimiento', color: '#F97316' },
  { value: 'propuesta',    label: 'Propuesta',      color: '#8B5CF6' },
  { value: 'ganado',       label: 'Ganado',         color: '#22C55E' },
  { value: 'perdido',      label: 'Perdido',        color: '#EF4444' },
]

const ASESORES = ['Fátima', 'Dan', 'Claudia']

interface Lead {
  id: string; consecutivo: number
  empresa: string; contacto: string | null; telefono: string | null
  email: string | null; interes_servicio: string | null
  asesor: string | null; estado: string; notas: string | null
  creado_por: string | null; created_at: string
}

const vacio = () => ({
  empresa: '', contacto: '', telefono: '', email: '',
  interes_servicio: '', asesor: '', notas: '',
})

const colorEstado = (e: string) => ESTADOS.find(x => x.value === e)?.color ?? '#94A3B8'
const labelEstado = (e: string) => ESTADOS.find(x => x.value === e)?.label ?? e

export default function Leads() {
  const [lista, setLista]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [form, setForm]       = useState(vacio())
  const [guardando, setGuardando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [busca, setBusca]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => { setLista(d.leads ?? []); setError(d.error ?? null) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = () => {
    setGuardando(true); setError(null)
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setForm(vacio()); setAbierto(false); cargar()
      })
      .catch(e => setError(String(e)))
      .finally(() => setGuardando(false))
  }

  const cambiarEstado = (id: string, estado: string) => {
    setLista(l => l.map(x => x.id === id ? { ...x, estado } : x))   // respuesta inmediata
    fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    }).then(r => r.json()).then(d => { if (d.error) { setError(d.error); cargar() } })
  }

  const borrar = (id: string, empresa: string) => {
    if (!confirm(`¿Borrar el lead de ${empresa}? No se puede deshacer.`)) return
    fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else cargar() })
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return lista.filter(l =>
      (filtroEstado === 'Todos' || l.estado === filtroEstado) &&
      (!q || [l.empresa, l.contacto, l.email, l.telefono, l.interes_servicio]
        .some(v => (v ?? '').toLowerCase().includes(q))),
    )
  }, [lista, busca, filtroEstado])

  const campo = (k: keyof ReturnType<typeof vacio>, label: string, placeholder: string, tipo = 'text') => (
    <div>
      <label className="block text-[11px] uppercase tracking-wide text-textLow mb-1">{label}</label>
      <input
        type={tipo}
        value={form[k]}
        onChange={e => setForm({ ...form, [k]: e.target.value })}
        placeholder={placeholder}
        className="cp-input w-full"
      />
    </div>
  )

  return (
    <div className="px-6 pb-8">
      <div className="cp-card">
        {/* Encabezado */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-cpTeal" />
            <h3 className="text-sm font-bold text-textHi">Lead</h3>
            <span className="text-[10px] text-textLow uppercase tracking-wide ml-1">
              Prospectos capturados · {lista.length}
            </span>
          </div>
          <button
            onClick={() => { setAbierto(!abierto); setError(null) }}
            className="cp-btn cp-btn-primary text-xs flex items-center gap-1.5"
          >
            {abierto ? <X size={13} /> : <UserPlus size={13} />}
            {abierto ? 'Cancelar' : 'Nuevo lead'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-4"
               style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }}>
            <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>
          </div>
        )}

        {/* Alta */}
        {abierto && (
          <div className="rounded-xl p-4 mb-5"
               style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.18)' }}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-3">
              {campo('empresa',  'Nombre empresa *', 'Razón social o nombre comercial')}
              {campo('contacto', 'Contacto',         'Nombre de quien atiende')}
              {campo('telefono', 'Teléfono',         '55 1234 5678', 'tel')}
              {campo('email',    'Email',            'contacto@empresa.com', 'email')}
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-textLow mb-1">
                  Interés por servicio
                </label>
                <CustomSelect
                  value={form.interes_servicio || 'Selecciona…'}
                  onChange={v => setForm({ ...form, interes_servicio: v === 'Selecciona…' ? '' : v })}
                  options={['Selecciona…', ...SERVICIOS]}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-textLow mb-1">
                  Asesor que lo atiende
                </label>
                <CustomSelect
                  value={form.asesor || 'Sin asignar'}
                  onChange={v => setForm({ ...form, asesor: v === 'Sin asignar' ? '' : v })}
                  options={['Sin asignar', ...ASESORES]}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-textLow mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                rows={2}
                placeholder="De dónde salió, qué pidió, qué se acordó…"
                className="cp-input w-full resize-y"
              />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={guardar} disabled={guardando || !form.empresa.trim()}
                      className="cp-btn cp-btn-primary text-xs disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Guardar lead'}
              </button>
              <span className="text-[11px] text-textLow">
                Solo el nombre de la empresa es obligatorio.
              </span>
            </div>
          </div>
        )}

        {/* Filtros */}
        {lista.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative w-56 flex-shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
              <input className="cp-input w-full pl-8" placeholder="Buscar lead…"
                     value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <div className="w-44 flex-shrink-0">
              <CustomSelect value={filtroEstado} onChange={setFiltroEstado}
                            options={['Todos', ...ESTADOS.map(e => e.value)]} />
            </div>
            <span className="text-[11px] text-textLow ml-auto">
              {filtrados.length} de {lista.length}
            </span>
          </div>
        )}

        {/* Listado */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-textMid py-6">
            <Loader2 size={14} className="animate-spin" /> Cargando leads…
          </div>
        )}

        {!loading && lista.length === 0 && !error && (
          <div className="text-center py-10">
            <UserPlus size={24} className="mx-auto mb-2 text-textLow" />
            <p className="text-sm text-textMid font-semibold">Todavía no hay leads capturados</p>
            <p className="text-xs text-textLow mt-1">
              Cada prospecto que llegue por referencia, evento o llamada entra aquí.
            </p>
          </div>
        )}

        {!loading && filtrados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="cp-table w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Interés por servicio</th>
                  <th>Asesor</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrados.map(l => (
                  <tr key={l.id}>
                    <td className="text-xs text-textLow font-mono">
                      {String(l.consecutivo ?? 0).padStart(3, '0')}
                    </td>
                    <td className="text-sm font-semibold text-textHi">{l.empresa}</td>
                    <td className="text-xs text-textMid">{l.contacto || '—'}</td>
                    <td className="text-xs text-textMid whitespace-nowrap">
                      {l.telefono
                        ? <a href={`tel:${l.telefono}`} className="hover:text-cpTeal">{l.telefono}</a>
                        : '—'}
                    </td>
                    <td className="text-xs text-textMid">
                      {l.email
                        ? <a href={`mailto:${l.email}`} className="hover:text-cpTeal">{l.email}</a>
                        : '—'}
                    </td>
                    <td className="text-xs">
                      {l.interes_servicio
                        ? <span className="px-2 py-0.5 rounded text-[10px]"
                                style={{ background: 'rgba(14,165,233,0.12)', color: '#0EA5E9' }}>
                            {l.interes_servicio}
                          </span>
                        : <span className="text-textLow">—</span>}
                    </td>
                    <td className="text-xs text-textMid">{l.asesor || <span className="text-textLow">Sin asignar</span>}</td>
                    <td>
                      <select
                        value={l.estado}
                        onChange={e => cambiarEstado(l.id, e.target.value)}
                        className="text-[10px] font-bold rounded px-2 py-1 border-0 outline-none cursor-pointer"
                        style={{ background: `${colorEstado(l.estado)}20`, color: colorEstado(l.estado) }}
                      >
                        {/* El desplegable de un <select> nativo lo pinta el
                            sistema, no la tarjeta: dentro de .cp-card hereda
                            texto claro sobre el fondo blanco del sistema y
                            queda ilegible. Se fuerzan ambos colores. Aquí no
                            se usa CustomSelect porque la tabla vive dentro de
                            un overflow-x-auto que recortaría su desplegable. */}
                        {ESTADOS.map(e => (
                          <option key={e.value} value={e.value}
                                  style={{ color: '#0F172A', background: '#FFFFFF' }}>
                            {labelEstado(e.value)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => borrar(l.id, l.empresa)}
                              className="text-textLow hover:text-red-400 transition-colors"
                              title="Borrar lead">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && lista.length > 0 && filtrados.length === 0 && (
          <p className="text-xs text-textMid text-center py-6">Ningún lead con esos filtros.</p>
        )}
      </div>
    </div>
  )
}
