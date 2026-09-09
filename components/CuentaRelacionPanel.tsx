import type { ReunionCuenta } from '@/lib/supabase'
import type { Relacionamiento } from '@/lib/relacionamiento'

const COLOR = {
  'Sólido':                  { fg: '#047857', bg: 'rgba(4,120,87,0.10)' },
  'En construcción':         { fg: '#B45309', bg: 'rgba(180,83,9,0.10)' },
  'Débil':                   { fg: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  'Sin relación registrada': { fg: '#64748B', bg: 'rgba(100,116,139,0.10)' },
} as const

const ETIQUETAS: { k: keyof Relacionamiento['desglose']; label: string; max: number }[] = [
  { k: 'seguimientos',  label: 'Seguimientos',        max: 30 },
  { k: 'actividades',   label: 'Actividades SAC',     max: 25 },
  { k: 'reuniones',     label: 'Reuniones',           max: 15 },
  { k: 'contactos',     label: 'Stakeholders',        max: 15 },
  { k: 'auditoria',     label: 'Auditoría',           max: 10 },
  { k: 'documentacion', label: 'Ficha documentada',   max: 5  },
]

/**
 * Relacionamiento de la cuenta y las reuniones que lo sustentan.
 *
 * El porcentaje NO es un adorno: alimenta `score_relacional`, que pesa 15% del
 * Health Score. Por eso se muestra el desglose — para que se vea de dónde sale
 * y qué falta capturar para subirlo.
 */
export default function CuentaRelacionPanel({
  relacion, reuniones, migracionPendiente,
}: {
  relacion: Relacionamiento | null
  reuniones: ReunionCuenta[]
  migracionPendiente: boolean
}) {
  const c = relacion ? COLOR[relacion.nivel] : COLOR['Sin relación registrada']

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Relacionamiento y reuniones
        </span>
        {relacion && (
          <span style={{
            fontSize: 12, fontWeight: 800, padding: '3px 12px', borderRadius: 999,
            color: c.fg, background: c.bg, border: `1px solid ${c.fg}30`,
          }}>
            {relacion.pct}% · {relacion.nivel}
          </span>
        )}
      </div>

      {relacion && (
        <>
          <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
            {ETIQUETAS.map(e => {
              const v = relacion.desglose[e.k]
              const pct = Math.round((v / e.max) * 100)
              return (
                <div key={e.k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{e.label}</span>
                    <span style={{ fontSize: 10, color: v ? '#0F172A' : '#CBD5E1', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {v} / {e.max}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: '#EEF2F7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: v ? c.fg : 'transparent' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, margin: '0 0 4px' }}>
            {relacion.evidencia.join(' · ')}
          </p>
          {relacion.factorRecencia < 1 && (
            <p style={{ fontSize: 10.5, color: '#B45309', margin: '0 0 10px' }}>
              Ajuste por antigüedad del último contacto: ×{relacion.factorRecencia.toFixed(2)}
            </p>
          )}
          <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 12px', lineHeight: 1.5 }}>
            Este porcentaje alimenta <strong>score_relacional</strong>, que pesa 15% del Health Score.
            Mide lo que está registrado, no lo que ocurrió: una conversación no capturada no cuenta.
          </p>
        </>
      )}

      {migracionPendiente ? (
        <div style={{ background: 'rgba(253,230,138,0.18)', border: '1px solid #FCD34D', borderRadius: 8, padding: '9px 11px' }}>
          <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            <strong>Vínculo de reuniones pendiente.</strong> Falta ejecutar
            {' '}<code style={{ fontSize: 10 }}>scripts/migracion-reuniones-cuenta.sql</code>:
            la tabla <code style={{ fontSize: 10 }}>reuniones</code> no tiene la columna
            {' '}<code style={{ fontSize: 10 }}>cuenta_id</code>, así que ninguna reunión puede
            atribuirse a esta cuenta todavía.
          </p>
        </div>
      ) : reuniones.length === 0 ? (
        <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>
          Sin reuniones vinculadas a esta cuenta.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {reuniones.length} {reuniones.length === 1 ? 'reunión' : 'reuniones'} con el cliente
          </span>
          {reuniones.slice(0, 6).map(r => (
            <div key={r.id} style={{ borderLeft: '2px solid #059669', paddingLeft: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {r.fecha}
                </span>
                <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>{r.titulo}</span>
              </div>
              {r.acuerdos?.trim() && (
                <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', lineHeight: 1.45 }}>
                  <strong>Acuerdos:</strong> {r.acuerdos.trim().slice(0, 260)}
                </p>
              )}
              {r.proximos_pasos?.trim() && (
                <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0', lineHeight: 1.45 }}>
                  <strong>Próximos pasos:</strong> {r.proximos_pasos.trim().slice(0, 260)}
                </p>
              )}
            </div>
          ))}
          {reuniones.length > 6 && (
            <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
              y {reuniones.length - 6} {reuniones.length - 6 === 1 ? 'reunión' : 'reuniones'} más
            </span>
          )}
        </div>
      )}
    </div>
  )
}
