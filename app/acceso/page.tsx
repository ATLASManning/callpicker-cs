'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, ArrowRight, RefreshCw, CheckCircle, AlertCircle, Lock } from 'lucide-react'

type Step = 'email' | 'code' | 'pending' | 'inactive'

const BTN = {
  background: '#1B3FCC', color: '#fff', border: 'none', borderRadius: 10,
  padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', transition: 'opacity .15s',
}

export default function AccesoPage() {
  const router = useRouter()
  const [step,    setStep]    = useState<Step>('email')
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resend,  setResend]  = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  /* Focus primer input al entrar en paso code */
  useEffect(() => {
    if (step === 'code') setTimeout(() => inputs.current[0]?.focus(), 80)
  }, [step])

  /* ── Paso 1: solicitar código ─────────────────────────────────── */
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (data.status === 'sent')     { setStep('code'); setResend(false) }
      else if (data.status === 'pending')  setStep('pending')
      else if (data.status === 'inactive') setStep('inactive')
      else setError('Error al procesar solicitud. Intenta de nuevo.')
    } catch { setError('Error de red. Intenta de nuevo.') }
    finally   { setLoading(false) }
  }

  /* ── Paso 2: verificar código ─────────────────────────────────── */
  async function handleVerify() {
    const codeStr = code.join('')
    if (codeStr.length < 6) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeStr }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/')
      } else {
        const msg =
          data.error === 'codigo_invalido'  ? 'Código incorrecto. Verifica e intenta de nuevo.' :
          data.error === 'codigo_expirado'  ? 'El código expiró. Solicita uno nuevo.' :
          'Error de verificación.'
        setError(msg)
        setCode(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      }
    } catch { setError('Error de red. Intenta de nuevo.') }
    finally   { setLoading(false) }
  }

  /* ── Inputs de código ─────────────────────────────────────────── */
  function handleCodeInput(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = v
    setCode(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) {
      setTimeout(() => handleVerify(), 80)
    }
  }
  function handleCodeKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }
  async function handleResend() {
    setCode(['', '', '', '', '', '']); setError(''); setResend(true)
    await handleEmail({ preventDefault: () => {} } as React.FormEvent)
    setResend(false)
  }

  /* ── Estilos compartidos ──────────────────────────────────────── */
  const INPUT_STYLE: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #BFDBFE', fontSize: 14, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
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
            <p style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Customer Success
            </p>
          </div>
        </div>

        {/* ── PASO: email ─────────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={15} color="#1B3FCC" />
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Acceso al dashboard</h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                Ingresa tu correo. Si está autorizado recibirás un código de 6 dígitos.
              </p>
            </div>

            <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    style={{ ...INPUT_STYLE, paddingLeft: 36 }}
                  />
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
                {loading ? 'Enviando...' : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {/* ── PASO: código ────────────────────────────────────────── */}
        {step === 'code' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                Ingresa tu código
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                Enviamos un código de 6 dígitos a <strong>{email}</strong>.<br />
                Revisa tu bandeja de entrada (y spam).
              </p>
            </div>

            {/* Inputs de código */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKey(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
                    border: `2px solid ${d ? '#1B3FCC' : '#BFDBFE'}`,
                    borderRadius: 10, outline: 'none', color: '#0F172A',
                    background: d ? '#EFF6FF' : '#fff', transition: 'all .15s',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={14} color="#DC2626" />
                <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
              </div>
            )}

            <button onClick={handleVerify} disabled={loading || code.join('').length < 6}
              style={{ ...BTN, opacity: (loading || code.join('').length < 6) ? 0.6 : 1, marginBottom: 12 }}>
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {loading ? 'Verificando...' : 'Acceder'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button onClick={handleResend} disabled={resend}
                style={{ background: 'none', border: 'none', color: '#1B3FCC', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {resend ? 'Reenviando...' : '¿No llegó? Reenviar código'}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button onClick={() => { setStep('email'); setCode(['','','','','','']); setError('') }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Cambiar correo
              </button>
            </div>
          </>
        )}

        {/* ── PASO: pendiente ─────────────────────────────────────── */}
        {step === 'pending' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Mail size={24} color="#1B3FCC" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Solicitud enviada
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Tu correo <strong>{email}</strong> no tiene acceso aún.<br />
              El administrador recibirá una notificación y te avisará cuando tu acceso sea aprobado.
            </p>
            <button onClick={() => { setStep('email'); setEmail('') }}
              style={{ ...BTN, marginTop: 24, background: '#EFF6FF', color: '#1B3FCC' }}>
              Intentar con otro correo
            </button>
          </div>
        )}

        {/* ── PASO: inactivo ──────────────────────────────────────── */}
        {step === 'inactive' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Acceso suspendido
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Tu cuenta está inactiva. Contacta al administrador para reactivarla.
            </p>
            <button onClick={() => { setStep('email'); setEmail('') }}
              style={{ ...BTN, marginTop: 24, background: '#FEF2F2', color: '#EF4444' }}>
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
