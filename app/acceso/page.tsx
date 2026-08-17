'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Lock, ArrowRight, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react'

type Estado = 'login' | 'expirado' | 'inactivo' | 'sin_password'

const BTN: React.CSSProperties = {
  background: '#1B3FCC', color: '#fff', border: 'none', borderRadius: 10,
  padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', transition: 'opacity .15s',
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #BFDBFE', fontSize: 14, color: '#0F172A',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
}

export default function AccesoPage() {
  const router = useRouter()
  const [estado,       setEstado]       = useState<Estado>('login')

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [data-acceso-input]::placeholder {
        color: #64748b !important;
        opacity: 1 !important;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true); setError('')

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()

      if (res.ok) { router.push('/'); return }

      if (data.error === 'password_expirado') { setEstado('expirado'); return }
      if (data.error === 'usuario_invalido')  { setEstado('inactivo'); return }
      if (data.error === 'sin_password')      { setEstado('sin_password'); return }

      setError(
        data.error === 'password_invalido' ? 'Contraseña incorrecta. Verifica e intenta de nuevo.' :
        data.error === 'config_error'       ? 'Error de configuración. Contacta al administrador.' :
        'Error al iniciar sesión. Intenta de nuevo.'
      )
    } catch {
      setError('Error de red. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0F2B8A 0%,#1B3FCC 50%,#2979FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#1B3FCC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Phone size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: 0 }}>Callpicker</p>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Customer Success
            </p>
          </div>
        </div>

        {/* ── LOGIN ───────────────────────────────────────────────────── */}
        {estado === 'login' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={15} color="#1B3FCC" />
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Acceso al dashboard
                </h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Ingresa con tu correo y la contraseña que te asignó el administrador.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@callpicker.com"
                    data-acceso-input
                    style={{ ...INPUT, paddingLeft: 36 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPass ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña asignada por el admin"
                    data-acceso-input
                    style={{ ...INPUT, paddingLeft: 36, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} color="#DC2626" />
                  <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...BTN, opacity: loading ? 0.7 : 1 }}>
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
          </>
        )}

        {/* ── CONTRASEÑA EXPIRADA ──────────────────────────────────────── */}
        {estado === 'expirado' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} color="#CA8A04" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Contraseña expirada
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Tu contraseña de acceso venció.<br />
              Contacta al administrador para que te asigne una nueva.
            </p>
            <div style={{ marginTop: 20, background: '#FEF9C3', borderRadius: 10, padding: '12px 16px', border: '1px solid #FDE68A' }}>
              <p style={{ color: '#92400E', fontSize: 13, fontWeight: 600, margin: 0 }}>
                📱 josel@callpicker.com
              </p>
            </div>
            <button onClick={() => { setEstado('login'); setPassword('') }}
              style={{ ...BTN, marginTop: 20, background: '#EFF6FF', color: '#1B3FCC' }}>
              Volver
            </button>
          </div>
        )}

        {/* ── SIN CONTRASEÑA CONFIGURADA ──────────────────────────────── */}
        {estado === 'sin_password' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} color="#1B3FCC" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Acceso pendiente
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Tu cuenta aún no tiene contraseña asignada.<br />
              Contacta al administrador para activar tu acceso.
            </p>
            <div style={{ marginTop: 20, background: '#EFF6FF', borderRadius: 10, padding: '12px 16px', border: '1px solid #BFDBFE' }}>
              <p style={{ color: '#1E40AF', fontSize: 13, fontWeight: 600, margin: 0 }}>
                📱 josel@callpicker.com
              </p>
            </div>
            <button onClick={() => { setEstado('login'); setPassword('') }}
              style={{ ...BTN, marginTop: 20, background: '#EFF6FF', color: '#1B3FCC' }}>
              Volver
            </button>
          </div>
        )}

        {/* ── INACTIVO ────────────────────────────────────────────────── */}
        {estado === 'inactivo' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Acceso suspendido
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Tu cuenta está inactiva o el correo no está registrado.<br />
              Contacta al administrador.
            </p>
            <button onClick={() => { setEstado('login'); setEmail(''); setPassword('') }}
              style={{ ...BTN, marginTop: 24, background: '#FEF2F2', color: '#EF4444' }}>
              Volver
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
