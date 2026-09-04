'use client'
import { useState, useMemo } from 'react'
import { Search, CheckCircle2, XCircle, HelpCircle, Phone } from 'lucide-react'
import {
  TELEFONOS_COMPATIBLES, TELEFONOS_NO_COMPATIBLES, MARCAS_MIXTAS,
  compatibilidadTelefono, porMarca, type TelefonoIP,
} from '@/lib/telefonos-ip'

/**
 * Teléfonos IP verificados con Callpicker.
 *
 * Lo primero es el verificador, no la tabla: la pregunta real que llega es
 * "¿me sirve este equipo?", con el modelo en la mano y el cliente esperando.
 * Las listas completas van debajo, para cuando alguien quiere ver el panorama.
 */

const BORDER = '#BFDBFE'
const PANEL  = '#FFFFFF'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#94A3B8'
const VERDE  = '#15803D'
const ROJO   = '#B91C1C'
const AMBAR  = '#B45309'

const CFG = {
  compatible:    { color: VERDE, bg: '#F0FDF4', borde: '#BBF7D0', Icono: CheckCircle2, titulo: 'Compatible' },
  no_compatible: { color: ROJO,  bg: '#FEF2F2', borde: '#FECACA', Icono: XCircle,      titulo: 'No compatible' },
  sin_verificar: { color: AMBAR, bg: '#FFFBEB', borde: '#FDE68A', Icono: HelpCircle,   titulo: 'Sin verificar' },
} as const

function Listado({ titulo, lista, color, nota }: {
  titulo: string; lista: TelefonoIP[]; color: string; nota: string
}) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '16px 18px' }}>
      <p style={{ fontSize: 14, fontWeight: 800, color, marginBottom: 3 }}>
        {titulo} <span style={{ fontWeight: 600, opacity: 0.7 }}>· {lista.length}</span>
      </p>
      <p style={{ fontSize: 11.5, color: TX_LOW, marginBottom: 12, lineHeight: 1.5 }}>{nota}</p>
      <div className="columns-1 sm:columns-2" style={{ columnGap: 18 }}>
        {porMarca(lista).map(g => (
          <div key={g.marca} className="break-inside-avoid" style={{ marginBottom: 11 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: TX, marginBottom: 3 }}>{g.marca}</p>
            {g.modelos.map(m => (
              <p key={m.modelo} style={{ fontSize: 12, color: TX_MID, lineHeight: 1.5 }}>
                · {m.modelo}
                {m.nota && <span style={{ color: TX_LOW, fontSize: 11 }}> — {m.nota}</span>}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TelefonosIP() {
  const [q, setQ] = useState('')
  const consulta = q.trim()
  const res = useMemo(() => consulta.length >= 2 ? compatibilidadTelefono(consulta) : null, [consulta])
  const cfg = res ? CFG[res.estado] : null

  return (
    <div>
      {/* Verificador */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Phone size={15} style={{ color: '#0057FF' }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: TX }}>¿Este equipo sirve con Callpicker?</p>
        </div>
        <p style={{ fontSize: 12, color: TX_LOW, marginBottom: 12, lineHeight: 1.5 }}>
          Escribe marca y modelo. Responde por modelo, no por marca:
          de <strong>{MARCAS_MIXTAS.join(' y ')}</strong> hay equipos que sí y equipos que no.
        </p>

        <div style={{ position: 'relative', maxWidth: 420 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: TX_LOW }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Yealink T48G · Cisco 7841 · Grandstream HT802…"
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
              borderRadius: 9, fontSize: 13.5, background: PANEL,
              border: `1px solid ${BORDER}`, color: TX, outline: 'none',
            }}
          />
        </div>

        {res && cfg && (
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.borde}`, borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <cfg.Icono size={17} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: cfg.color, marginBottom: 2 }}>{cfg.titulo}</p>
                <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.5 }}>{res.mensaje}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advertencia de fondo */}
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.55 }}>
          <strong>Lo que no aparece en ninguna lista no es incompatible: es sin verificar.</strong> Son
          cosas distintas. Ante un equipo no listado no lo descartes ni lo prometas — se canaliza a
          Soporte para validarlo antes de comprometer nada con el cliente.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 items-start">
        <Listado
          titulo="Compatibles" lista={TELEFONOS_COMPATIBLES} color={VERDE}
          nota="Verificados y funcionando con Callpicker."
        />
        <Listado
          titulo="No compatibles" lista={TELEFONOS_NO_COMPATIBLES} color={ROJO}
          nota="Probados y descartados. De Avaya no hay ningún modelo soportado."
        />
      </div>
    </div>
  )
}
