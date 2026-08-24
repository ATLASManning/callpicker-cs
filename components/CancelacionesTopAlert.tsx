'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface CancelacionTop {
  cid: string
  empresa: string
  ltv: number
  status: 'actualizado' | 'error'
  error?: string
}

export default function CancelacionesTopAlert() {
  const [cancelaciones, setCancelaciones] = useState<CancelacionTop[]>([])
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  async function syncCancelaciones() {
    setLoading(true)
    try {
      const res = await fetch('/api/slack/sync-cancelaciones', { method: 'POST' })
      const data = await res.json()

      if (data.actualizaciones) {
        setCancelaciones(data.actualizaciones)
        setLastSync(new Date().toLocaleTimeString('es-MX'))
      }
    } catch (err) {
      console.error('Error syncing cancelaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Sincronizar al cargar
    syncCancelaciones()
    // Luego cada hora
    const interval = setInterval(syncCancelaciones, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (cancelaciones.length === 0) return null

  const actualizadas = cancelaciones.filter(c => c.status === 'actualizado')
  const errores = cancelaciones.filter(c => c.status === 'error')

  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: 20, borderLeft: '4px solid #dc2626' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <AlertTriangle size={18} style={{ color: '#dc2626' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
            Cancelaciones TOP Detectadas
          </h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
            Desde #alertas-cuentas-canceladas {lastSync && `• Última sincronización: ${lastSync}`}
          </p>
        </div>
        <button
          onClick={syncCancelaciones}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: 11,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Sincronizar
        </button>
      </div>

      {actualizadas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', margin: '0 0 8px' }}>
            ✓ Actualizadas ({actualizadas.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actualizadas.map(c => (
              <div
                key={c.cid}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(220,38,38,0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(220,38,38,0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>
                    {c.empresa}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
                    CID {c.cid}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', margin: 0 }}>
                    ${c.ltv.toLocaleString('es-MX')}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: '1px 0 0' }}>
                    LTV
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errores.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', margin: '0 0 8px' }}>
            ⚠ Errores ({errores.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {errores.map(c => (
              <p
                key={c.cid}
                style={{ fontSize: 10, color: '#fb923c', margin: 0, padding: '4px 8px' }}
              >
                {c.empresa} (CID {c.cid}): {c.error}
              </p>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
