'use client'

export default function KamCard({ initial }: { initial: string | null }) {
  const texto = initial && initial.trim() !== '' && initial.trim() !== '0' ? initial.trim() : null

  function abrirEditor() {
    document.dispatchEvent(new CustomEvent('abrir-kam-editor'))
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Observaciones KAM
        </span>
        <button
          onClick={abrirEditor}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: '#1B3FCC',
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 6, padding: '3px 10px',
            cursor: 'pointer',
          }}
        >
          {texto ? '✏ Editar' : '+ Agregar'}
        </button>
      </div>

      {/* Contenido */}
      {texto ? (
        <p style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
          {texto}
        </p>
      ) : (
        <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
          Sin observaciones — haz clic en <strong style={{ color: '#64748B' }}>+ Agregar</strong> para registrar notas KAM.
        </p>
      )}
    </div>
  )
}
