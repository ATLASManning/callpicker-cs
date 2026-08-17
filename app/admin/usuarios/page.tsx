'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, RefreshCw, ShieldCheck, Eye, UserCheck,
         ToggleLeft, ToggleRight, X, Save, KeyRound, Copy, Check, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'

type Rol = 'admin' | 'asesor' | 'viewer'
type Usuario = {
  id: string; email: string; nombre: string; rol: Rol
  asesor_nombre: string | null; activo: boolean
  ultimo_acceso: string | null; creado_en: string
  password_expira: string | null
}

const ROL_CONFIG: Record<Rol, { label: string; color: string; icon: React.ElementType }> = {
  admin:  { label: 'Admin',  color: '#1B3FCC', icon: ShieldCheck },
  asesor: { label: 'Asesor', color: '#059669', icon: UserCheck  },
  viewer: { label: 'Viewer', color: '#D97706', icon: Eye        },
}
const ASESORES = ['Fátima', 'Dan', 'Claudia', 'Monse', 'José']

/* Genera contraseña legible del lado cliente (para mostrarla en modal) */
function genPass() {
  const words = ['Azul','Rojo','Verde','Luna','Pico','Toro','Bravo','Cielo','Mar','Rio']
  const syms  = ['!','#','@','$','%']
  return words[Math.floor(Math.random() * words.length)]
    + String(Math.floor(10 + Math.random() * 89))
    + syms[Math.floor(Math.random() * syms.length)]
}

function diasRestantes(expira: string | null): number {
  if (!expira) return -1
  return Math.ceil((new Date(expira).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function PassBadge({ expira }: { expira: string | null }) {
  const dias = diasRestantes(expira)
  if (dias < 0)  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Sin contraseña</span>
  if (dias === 0) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expiró hoy</span>
  if (dias <= 7)  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Expira en {dias}d</span>
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Vigente · {dias}d</span>
}

const emptyForm = () => ({ email: '', nombre: '', rol: 'viewer' as Rol, asesor_nombre: '', activo: true })

export default function AdminUsuariosPage() {
  const [usuarios,   setUsuarios]   = useState<Usuario[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [copied,     setCopied]     = useState<string | null>(null)

  /* Modal contraseña */
  const [passModal,  setPassModal]  = useState<Usuario | null>(null)
  const [passGen,    setPassGen]    = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passDone,   setPassDone]   = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/usuarios')
    setUsuarios(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openPassModal(u: Usuario) {
    setPassModal(u)
    setPassGen(genPass())
    setPassDone(false)
  }

  async function savePassword() {
    if (!passModal || !passGen) return
    setPassSaving(true)
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passModal.id, action: 'set_password', new_password: passGen }),
    })
    /* Actualizar expira en lista local: +30 días */
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    setUsuarios(prev => prev.map(x => x.id === passModal.id ? { ...x, password_expira: expira } : x))
    setPassSaving(false)
    setPassDone(true)
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function toggleActivo(u: Usuario) {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    })
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x))
  }

  async function changeRol(u: Usuario, rol: Rol) {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, rol, asesor_nombre: rol === 'asesor' ? u.asesor_nombre : null }),
    })
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, rol } : x))
  }

  async function deleteUser(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return
    await fetch('/api/admin/usuarios', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setUsuarios(prev => prev.filter(x => x.id !== id))
  }

  async function createUser() {
    if (!form.email || !form.nombre) return
    setSaving(true)
    const res  = await fetch('/api/admin/usuarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, asesor_nombre: form.rol === 'asesor' ? form.asesor_nombre : null }),
    })
    const data = await res.json()
    if (!data.error) { setUsuarios(prev => [data, ...prev]); setShowForm(false); setForm(emptyForm()) }
    setSaving(false)
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  /* Usuarios con contraseña próxima a vencer o vencida */
  const alertas = usuarios.filter(u => {
    const d = diasRestantes(u.password_expira)
    return d < 0 || d <= 7
  })

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader title="Gestión de Usuarios" subtitle="Accesos, roles y contraseñas del dashboard" />

      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* Banner alertas de contraseña */}
        {alertas.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              {alertas.length} usuario{alertas.length > 1 ? 's' : ''} con contraseña vencida o por vencer
            </p>
            <div className="space-y-1.5">
              {alertas.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <span className="text-xs text-gray-700 flex-1">
                    <span className="font-semibold">{u.nombre}</span> · {u.email}
                  </span>
                  <PassBadge expira={u.password_expira} />
                  <button onClick={() => openPassModal(u)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    <KeyRound size={11} /> Renovar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de acciones */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm text-gray-500">{usuarios.length} usuarios</span>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="cp-btn cp-btn-ghost">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowForm(true)} className="cp-btn cp-btn-primary">
              <Plus size={13} /> Nuevo usuario
            </button>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Usuario', 'Rol', 'Asesor', 'Estado', 'Contraseña', 'Último acceso', ''].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const rc = ROL_CONFIG[u.rol] ?? ROL_CONFIG.viewer
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800 text-xs">{u.nombre}</p>
                        <p className="text-[11px] text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <CustomSelect value={u.rol} onChange={v => changeRol(u, v as Rol)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border-0 outline-none"
                          style={{ background: `${rc.color}15`, color: rc.color }}
                          options={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'asesor', label: 'Asesor' },
                            { value: 'viewer', label: 'Viewer' },
                          ]} />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{u.asesor_nombre ?? '—'}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleActivo(u)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                          style={{ color: u.activo ? '#059669' : '#EF4444' }}>
                          {u.activo ? <><ToggleRight size={16} /> Activo</> : <><ToggleLeft size={16} /> Inactivo</>}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PassBadge expira={u.password_expira} />
                          <button onClick={() => openPassModal(u)}
                            className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                            title="Renovar contraseña">
                            <KeyRound size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(u.ultimo_acceso)}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: nuevo usuario */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-gray-900">Nuevo Usuario</h2>
                <button onClick={() => setShowForm(false)} className="cp-icon-btn"><X size={16} /></button>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@callpicker.com" className="cp-input w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo" className="cp-input w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Rol</label>
                <CustomSelect value={form.rol} onChange={v => setForm(f => ({ ...f, rol: v as Rol }))} className="cp-select w-full"
                  options={[
                    { value: 'admin', label: 'Admin — ve todo' },
                    { value: 'asesor', label: 'Asesor — solo sus cuentas' },
                    { value: 'viewer', label: 'Viewer — solo lectura' },
                  ]} />
              </div>
              {form.rol === 'asesor' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Asesor asignado</label>
                  <CustomSelect value={form.asesor_nombre} onChange={v => setForm(f => ({ ...f, asesor_nombre: v }))} className="cp-select w-full"
                    options={[{ value: '', label: 'Seleccionar…' }, ...ASESORES.map(a => ({ value: a, label: a }))]} />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                <label htmlFor="activo" className="text-sm text-gray-600">Activo desde el inicio</label>
              </div>
              <p className="text-[11px] text-gray-400">
                ⚠️ Después de crear el usuario, usa el botón 🔑 para asignarle una contraseña.
              </p>
              <div className="flex gap-2 pt-2">
                <button onClick={createUser} disabled={saving} className="cp-btn cp-btn-primary flex-1 justify-center">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Crear usuario
                </button>
                <button onClick={() => setShowForm(false)} className="cp-btn cp-btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: asignar / renovar contraseña */}
        {passModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <KeyRound size={16} className="text-blue-600" />
                  {passDone ? 'Contraseña asignada' : 'Asignar contraseña'}
                </h2>
                <button onClick={() => setPassModal(null)} className="cp-icon-btn"><X size={16} /></button>
              </div>

              {!passDone ? (
                <>
                  <p className="text-xs text-gray-500 mb-4">
                    Usuario: <strong className="text-gray-800">{passModal.nombre}</strong> · {passModal.email}
                  </p>

                  {/* Contraseña generada */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Contraseña generada</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-black tracking-widest text-blue-700 flex-1">{passGen}</span>
                      <button onClick={() => copyText(passGen, 'pass')}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-colors"
                        style={{ background: copied === 'pass' ? '#D1FAE5' : '#EFF6FF', color: copied === 'pass' ? '#059669' : '#1B3FCC' }}>
                        {copied === 'pass' ? <Check size={11} /> : <Copy size={11} />}
                        {copied === 'pass' ? 'Copiada' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setPassGen(genPass())}
                      className="cp-btn cp-btn-ghost flex-1 justify-center text-xs">
                      <RefreshCw size={12} /> Generar otra
                    </button>
                    <button onClick={savePassword} disabled={passSaving}
                      className="cp-btn cp-btn-primary flex-1 justify-center text-xs">
                      {passSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                      {passSaving ? 'Guardando...' : 'Guardar y activar'}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center">
                    Vigencia: <strong>30 días</strong> a partir de hoy. Comparte por WhatsApp.
                  </p>
                </>
              ) : (
                /* Pantalla de confirmación */
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Contraseña guardada para <strong>{passModal.nombre}</strong>.<br />
                    Vigente por 30 días.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Comparte esto por WhatsApp</p>
                    <p className="font-mono text-lg font-black tracking-widest text-green-700">{passGen}</p>
                    <button onClick={() => copyText(passGen, 'done')}
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg mx-auto transition-colors"
                      style={{ background: copied === 'done' ? '#D1FAE5' : '#EFF6FF', color: copied === 'done' ? '#059669' : '#1B3FCC' }}>
                      {copied === 'done' ? <Check size={11} /> : <Copy size={11} />}
                      {copied === 'done' ? 'Copiada' : 'Copiar contraseña'}
                    </button>
                  </div>
                  <button onClick={() => setPassModal(null)} className="cp-btn cp-btn-primary w-full justify-center">
                    Listo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
