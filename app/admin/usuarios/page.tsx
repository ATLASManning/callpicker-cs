'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, RefreshCw, ShieldCheck, Eye, UserCheck, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type Rol = 'admin' | 'asesor' | 'viewer'
type Usuario = {
  id: string; email: string; nombre: string; rol: Rol
  asesor_nombre: string | null; activo: boolean
  ultimo_acceso: string | null; creado_en: string
}

const ROL_CONFIG: Record<Rol, { label: string; color: string; icon: React.ElementType }> = {
  admin:  { label: 'Admin',  color: '#1B3FCC', icon: ShieldCheck },
  asesor: { label: 'Asesor', color: '#059669', icon: UserCheck  },
  viewer: { label: 'Viewer', color: '#D97706', icon: Eye        },
}
const ASESORES = ['Fátima', 'Dan', 'Claudia', 'Monse', 'José']

const emptyForm = () => ({
  email: '', nombre: '', rol: 'viewer' as Rol, asesor_nombre: '', activo: true,
})

export default function AdminUsuariosPage() {
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(emptyForm())
  const [saving,    setSaving]    = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/usuarios')
    setUsuarios(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleActivo(u: Usuario) {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    })
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x))
  }

  async function changeRol(u: Usuario, rol: Rol) {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, rol, asesor_nombre: rol === 'asesor' ? u.asesor_nombre : null }),
    })
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, rol } : x))
  }

  async function deleteUser(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return
    await fetch('/api/admin/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setUsuarios(prev => prev.filter(x => x.id !== id))
  }

  async function createUser() {
    if (!form.email || !form.nombre) return
    setSaving(true)
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        asesor_nombre: form.rol === 'asesor' ? form.asesor_nombre : null,
      }),
    })
    const data = await res.json()
    if (!data.error) {
      setUsuarios(prev => [data, ...prev])
      setShowForm(false); setForm(emptyForm())
    }
    setSaving(false)
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Accesos, roles y permisos del dashboard"
      />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Barra de acciones */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm text-gray-500">{usuarios.length} usuarios registrados</span>
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

        {/* Modal nuevo usuario */}
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
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value as Rol }))}
                  className="cp-select w-full">
                  <option value="admin">Admin — ve todo</option>
                  <option value="asesor">Asesor — solo sus cuentas</option>
                  <option value="viewer">Viewer — solo lectura</option>
                </select>
              </div>
              {form.rol === 'asesor' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Asesor asignado</label>
                  <select value={form.asesor_nombre} onChange={e => setForm(f => ({ ...f, asesor_nombre: e.target.value }))}
                    className="cp-select w-full">
                    <option value="">Seleccionar…</option>
                    {ASESORES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo" checked={form.activo}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                <label htmlFor="activo" className="text-sm text-gray-600">Activo desde el inicio</label>
              </div>
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
                  {['Usuario', 'Rol', 'Asesor', 'Estado', 'Último acceso', ''].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const rc = ROL_CONFIG[u.rol] ?? ROL_CONFIG.viewer
                  const RolIcon = rc.icon
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800 text-xs">{u.nombre}</p>
                        <p className="text-[11px] text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.rol}
                          onChange={e => changeRol(u, e.target.value as Rol)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer"
                          style={{ background: `${rc.color}15`, color: rc.color }}>
                          <option value="admin">Admin</option>
                          <option value="asesor">Asesor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {u.asesor_nombre ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleActivo(u)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                          style={{ color: u.activo ? '#059669' : '#EF4444' }}>
                          {u.activo
                            ? <><ToggleRight size={16} /> Activo</>
                            : <><ToggleLeft  size={16} /> Inactivo</>}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-400 whitespace-nowrap">
                        {fmtDate(u.ultimo_acceso)}
                      </td>
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
      </div>
    </div>
  )
}
