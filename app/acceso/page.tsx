'use client'
import { useState } from 'react'
import { Phone, Lock, Send, CheckCircle } from 'lucide-react'

export default function AccesoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '' })
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) return
    setEstado('enviando')

    try {
      const res = await fetch('/api/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setEstado('ok')
      } else {
        setEstado('error')
        setMensaje(data.error || 'Ocurrió un error, intenta de nuevo.')
      }
    } catch {
      setEstado('error')
      setMensaje('Error de red. Intenta de nuevo.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2B8A 0%, #1B3FCC 50%, #2979FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#1B3FCC', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Phone size={20} color="#ffffff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#0F172A', lineHeight: 1.2 }}>Callpicker</p>
            <p style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Success
            </p>
          </div>
        </div>

        {estado === 'ok' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              ¡Solicitud enviada!
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
              Hemos notificado al administrador. Recibirás un correo en <strong>{form.email}</strong> cuando tu acceso sea aprobado.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Lock size={16} color="#1B3FCC" />
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Acceso restringido</h1>
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
                Completa el formulario para solicitar acceso. El administrador revisará tu solicitud y recibirás un correo con el enlace de acceso.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid #BFDBFE', fontSize: '14px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@correo.com"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid #BFDBFE', fontSize: '14px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={form.empresa}
                  onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                  placeholder="Nombre de tu empresa"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid #BFDBFE', fontSize: '14px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {estado === 'error' && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px',
                  padding: '12px', fontSize: '13px', color: '#DC2626',
                }}>
                  {mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={estado === 'enviando'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: estado === 'enviando' ? '#93C5FD' : '#1B3FCC',
                  color: '#ffffff', border: 'none', borderRadius: '10px',
                  padding: '12px', fontSize: '14px', fontWeight: 600,
                  cursor: estado === 'enviando' ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  marginTop: '4px',
                }}
              >
                <Send size={16} />
                {estado === 'enviando' ? 'Enviando solicitud...' : 'Solicitar acceso'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
