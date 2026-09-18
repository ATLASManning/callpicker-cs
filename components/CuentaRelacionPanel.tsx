import type { ReunionCuenta } from '@/lib/supabase'
import type { Relacionamiento } from '@/lib/relacionamiento'

/**
 * Relacionamiento de la cuenta y las reuniones que lo sustentan.
 *
 * El porcentaje NO es un adorno: alimenta `score_relacional`, que pesa 15% del
 * Health Score. Por eso se muestra el desglose — para que se vea de dónde sale
 * y qué falta capturar para subirlo.
 *
 * ── POR QUÉ LOS COLORES VAN EN <C> Y NO EN EL ELEMENTO ─────────────────────
 * El panel vive en una `.cp-card` (fondo #0D1829), y globals.css fuerza a
 * blanco con `!important` todo `p`, `strong` y todo `span` que NO declare
 * `background` en su style. Sin el envoltorio, cada cifra en ámbar o en verde
 * de este panel se pintaría blanca y el color dejaría de decir nada — sin
 * error y con el panel viéndose «bien». Declarar el background, aunque sea
 * transparente, es la salida que el propio sistema dejó.
 */

const TXT_HI = 'rgba(255,255,255,0.92)'
const TXT_MID = 'rgba(255,255,255,0.72)'
const TENUE = 'rgba(255,255,255,0.45)'

/* Tonos CLAROS de cada color: sobre #0D1829 un verde oscuro no se lee. */
const COLOR = {
  'Sólido':                  { fg: '#4ADE80', bg: 'rgba(74,222,128,0.16)' },
  'En construcción':         { fg: '#FBBF24', bg: 'rgba(251,191,36,0.16)' },
  'Débil':                   { fg: '#F87171', bg: 'rgba(248,113,113,0.16)' },
  'Sin relación registrada': { fg: '#94A3B8', bg: 'rgba(148,163,184,0.16)' },
} as const

const VERDE = '#4ADE80'
const AMBAR = '#FBBF24'

function C({ c, b, children }: { c: string; b?: boolean; children: React.ReactNode }) {
  return (
    <span style={{ background: 'transparent', color: c, fontWeight: b ? 700 : undefined }}>
      {children}
    </span>
  )
}

const ETIQUETAS: { k: keyof Relacionamiento['desglose']; label: string; max: number }[] = [
  { k: 'seguimientos',  label: 'Seguimientos',        max: 30 },
  { k: 'actividades',   label: 'Actividades SAC',     max: 25 },
  { k: 'reuniones',     label: 'Reuniones',           max: 15 },
  { k: 'contactos',     label: 'Stakeholders',        max: 15 },
  { k: 'auditoria',     label: 'Auditoría',           max: 10 },
  { k: 'documentacion', label: 'Ficha documentada',   max: 5  },
]

export default function CuentaRelacionPanel({
  relacion, reuniones, migracionPendiente,
}: {
  relacion: Relacionamiento | null
  reuniones: ReunionCuenta[]
  migracionPendiente: boolean
}) {
  const c = relacion ? COLOR[relacion.nivel] : COLOR['Sin relación registrada']

  return (
    <div className="cp-card" style={{ borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <span style={{
          background: 'transparent', fontSize: 11, fontWeight: 700, color: TXT_HI,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Relacionamiento y reuniones
        </span>
        {relacion && (
          <span style={{
            fontSize: 12, fontWeight: 800, padding: '3px 12px', borderRadius: 999,
            color: c.fg, background: c.bg, border: `1px solid ${c.fg}40`,
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
                    <span style={{ background: 'transparent', fontSize: 11, color: TXT_MID, fontWeight: 600 }}>
                      {e.label}
                    </span>
                    <span style={{
                      background: 'transparent', fontSize: 10, color: v ? TXT_HI : TENUE,
                      fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    }}>
                      {v} / {e.max}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: v ? c.fg : 'transparent' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, lineHeight: 1.5, margin: '0 0 4px' }}>
            <C c={TXT_MID}>{relacion.evidencia.join(' · ')}</C>
          </p>
          {relacion.factorRecencia < 1 && (
            <p style={{ fontSize: 10.5, margin: '0 0 10px' }}>
              <C c={AMBAR}>
                Ajuste por antigüedad del último contacto: ×{relacion.factorRecencia.toFixed(2)}
              </C>
            </p>
          )}
          <p style={{ fontSize: 10, margin: '0 0 12px', lineHeight: 1.5 }}>
            <C c={TENUE}>
              Este porcentaje alimenta <C c={TXT_MID} b>score_relacional</C>, que pesa 15% del
              Health Score. Mide lo que está registrado, no lo que ocurrió: una conversación no
              capturada no cuenta.
            </C>
          </p>
        </>
      )}

      {migracionPendiente ? (
        <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.32)', borderRadius: 8, padding: '9px 11px' }}>
          <p style={{ fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            <C c="#FDE68A">
              <C c={AMBAR} b>Vínculo de reuniones pendiente.</C> Falta ejecutar
              {' '}<code style={{ fontSize: 10 }}>scripts/migracion-reuniones-cuenta.sql</code>:
              la tabla <code style={{ fontSize: 10 }}>reuniones</code> no tiene la columna
              {' '}<code style={{ fontSize: 10 }}>cuenta_id</code>, así que ninguna reunión puede
              atribuirse a esta cuenta todavía.
            </C>
          </p>
        </div>
      ) : reuniones.length === 0 ? (
        <p style={{ fontSize: 11.5, margin: 0 }}>
          <C c={TENUE}>Sin reuniones vinculadas a esta cuenta.</C>
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{
            background: 'transparent', fontSize: 10.5, fontWeight: 700, color: TXT_MID,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {reuniones.length} {reuniones.length === 1 ? 'reunión' : 'reuniones'} con el cliente
          </span>
          {reuniones.slice(0, 6).map(r => (
            <div key={r.id} style={{ borderLeft: `2px solid ${VERDE}`, paddingLeft: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'transparent', fontSize: 10.5, color: VERDE,
                  fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                }}>
                  {r.fecha}
                </span>
                <span style={{ background: 'transparent', fontSize: 12, color: TXT_HI, fontWeight: 600 }}>
                  {r.titulo}
                </span>
              </div>
              {r.acuerdos?.trim() && (
                <p style={{ fontSize: 11, margin: '3px 0 0', lineHeight: 1.45 }}>
                  <C c={TXT_MID}><C c={TXT_HI} b>Acuerdos:</C> {r.acuerdos.trim().slice(0, 260)}</C>
                </p>
              )}
              {r.proximos_pasos?.trim() && (
                <p style={{ fontSize: 11, margin: '2px 0 0', lineHeight: 1.45 }}>
                  <C c={AMBAR}><C c={AMBAR} b>Próximos pasos:</C> {r.proximos_pasos.trim().slice(0, 260)}</C>
                </p>
              )}
            </div>
          ))}
          {reuniones.length > 6 && (
            <span style={{ background: 'transparent', fontSize: 10.5, color: TENUE }}>
              y {reuniones.length - 6} {reuniones.length - 6 === 1 ? 'reunión' : 'reuniones'} más
            </span>
          )}
        </div>
      )}
    </div>
  )
}
