'use client'

/**
 * components/CuentaGlobo.tsx — lo que hay que saber antes de llamar, en 10 s.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Construye el globo o ventana, y que al abrir cada cuenta le digas su último
 * contacto, su último ticket, si tiene análisis de llamadas menciónalo, si
 * tiene auditoría menciona el estado, si ha tenido o no actividades SAC, etc.»
 *
 * CÓMO SE COMPORTA
 * ----------------
 * Al abrir la cuenta el panel aparece ABIERTO, con el encabezado y las líneas.
 * El asesor lo cierra y queda una burbuja en la esquina con el número de cosas
 * que piden acción; volver a abrirlo es un clic. La decisión de abrirlo solo
 * se recuerda por cuenta y por sesión: cerrar el de una cuenta no debe apagar
 * el de la siguiente, que es justo donde puede haber algo grave.
 *
 * POR QUÉ NO SE RECUERDA ENTRE SESIONES: porque el propósito es que se lea. Un
 * «no volver a mostrar» convertiría esto en el aviso que todos aprenden a
 * ignorar, y ese es exactamente el fracaso que vinimos a corregir.
 *
 * DEFENSIVO A PROPÓSITO
 * ---------------------
 * El 24 de septiembre un rediseño de UNA pantalla tumbó el tablero entero con
 * una excepción en el cliente. Este componente se monta en la ficha de cuenta,
 * que es la pantalla más usada del tablero, así que:
 *   · todo lo que pinta viene tipado como opcional y se normaliza aquí;
 *   · `sessionStorage` va envuelto en try/catch — en una ventana privada lanza;
 *   · el icono se resuelve por tabla con respaldo, nunca por índice a ciegas.
 * Si algo llega vacío, el panel se muestra con lo que haya en vez de romperse.
 */
import { useState, useEffect } from 'react'
import {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Ticket, AlertTriangle,
  ClipboardCheck, ClipboardX, FileSearch, Users, UserX, Gauge,
  X, Info, ChevronDown,
} from 'lucide-react'
import type { EstadoCuenta, TonoLinea } from '@/lib/estado-cuenta'

/* Los cinco tonos. Verificados con la fórmula de contraste WCAG, no a ojo:
   texto ≥ 4.5:1 sobre su fondo y borde ≥ 3:1 sobre blanco. El más bajo de los
   diez es 4.76:1. */
const TONO: Record<TonoLinea, { fondo: string; borde: string; texto: string; etiqueta: string }> = {
  grave:  { fondo: '#FEF2F2', borde: '#DC2626', texto: '#7F1D1D', etiqueta: 'Atender' },
  aviso:  { fondo: '#FFFBEB', borde: '#B45309', texto: '#78350F', etiqueta: 'Revisar' },
  hueco:  { fondo: '#F5F3FF', borde: '#6D28D9', texto: '#4C1D95', etiqueta: 'No medido' },
  bien:   { fondo: '#F0FDF4', borde: '#15803D', texto: '#14532D', etiqueta: 'En orden' },
  neutro: { fondo: '#F8FAFC', borde: '#64748B', texto: '#334155', etiqueta: '' },
}

const ICONOS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Ticket, AlertTriangle,
  ClipboardCheck, ClipboardX, FileSearch, Users, UserX, Gauge,
}

/** El icono por nombre, con respaldo. Un nombre que no exista no puede reventar. */
function Icono({ nombre, color }: { nombre: string; color: string }) {
  const C = ICONOS[nombre] ?? Info
  return <C size={15} color={color} />
}

function leerCerrado(cuentaId: string): boolean {
  try {
    return sessionStorage.getItem(`cp_globo_cerrado_${cuentaId}`) === '1'
  } catch {
    return false
  }
}

function guardarCerrado(cuentaId: string, v: boolean) {
  try {
    if (v) sessionStorage.setItem(`cp_globo_cerrado_${cuentaId}`, '1')
    else sessionStorage.removeItem(`cp_globo_cerrado_${cuentaId}`)
  } catch {
    /* Ventana privada o almacenamiento bloqueado. No es un error que valga
       molestar al asesor: solo significa que el panel se abrirá de nuevo. */
  }
}

export default function CuentaGlobo({
  estado, cuentaId, empresa,
}: {
  estado: EstadoCuenta | null
  cuentaId: string
  empresa: string
}) {
  /* Arranca ABIERTO en el servidor y en el primer render del cliente, para que
     coincidan. La preferencia de sesión se aplica después de montar: leer
     `sessionStorage` durante el render rompería la hidratación. */
  const [abierto, setAbierto] = useState(true)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    if (leerCerrado(cuentaId)) setAbierto(false)
  }, [cuentaId])

  if (!estado || !Array.isArray(estado.lineas) || estado.lineas.length === 0) return null

  const cerrar = () => { setAbierto(false); guardarCerrado(cuentaId, true) }
  const abrir  = () => { setAbierto(true);  guardarCerrado(cuentaId, false) }

  const t = TONO[estado.tonoEncabezado] ?? TONO.neutro

  /* ── Burbuja cerrada ──────────────────────────────────────────────── */
  if (montado && !abierto) {
    return (
      <button
        onClick={abrir}
        aria-label={`Ver el estado de ${empresa}`}
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 999, border: 'none',
          background: '#0E30CC', color: '#FFFFFF', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(15,23,42,0.28)',
        }}
      >
        <Info size={15} color="#FFFFFF" />
        Estado de la cuenta
        {estado.pendientes > 0 && (
          <span style={{
            background: '#FECACA', color: '#7F1D1D', borderRadius: 999,
            padding: '1px 8px', fontSize: 12, fontWeight: 800,
          }}>
            {estado.pendientes}
          </span>
        )}
      </button>
    )
  }

  /* ── Panel abierto ────────────────────────────────────────────────── */
  return (
    <div
      className="cp-light"
      style={{
        position: 'fixed', right: 20, bottom: 20, zIndex: 40,
        width: 'min(420px, calc(100vw - 40px))',
        maxHeight: 'min(70vh, 640px)', overflowY: 'auto',
        background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14,
        boxShadow: '0 10px 32px rgba(15,23,42,0.22)',
      }}
    >
      <div style={{
        position: 'sticky', top: 0, background: t.fondo,
        borderBottom: `1px solid ${t.borde}`, borderRadius: '13px 13px 0 0',
        padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: '0 0 3px', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: t.texto,
          }}>
            Antes de llamar a {empresa}
          </p>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: t.texto }}>
            {estado.encabezado}
          </p>
        </div>
        <button
          onClick={cerrar}
          aria-label="Cerrar el estado de la cuenta"
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: 2, flexShrink: 0, lineHeight: 0,
          }}
        >
          <X size={15} color={t.texto} />
        </button>
      </div>

      <div style={{ padding: '10px 14px 14px' }}>
        {estado.lineas.map((l, i) => {
          const c = TONO[l.tono] ?? TONO.neutro
          return (
            <div
              key={`${l.titulo}-${i}`}
              style={{
                display: 'flex', gap: 9, alignItems: 'flex-start',
                padding: '8px 10px', marginBottom: 6,
                background: c.fondo, borderLeft: `3px solid ${c.borde}`, borderRadius: 0,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
                <Icono nombre={l.icono} color={c.borde} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: '0 0 2px', fontSize: 11, fontWeight: 800,
                  color: '#0F172A', display: 'flex', gap: 6, alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  {l.titulo}
                  {c.etiqueta && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: c.texto,
                      background: '#FFFFFF', border: `1px solid ${c.borde}`,
                      borderRadius: 999, padding: '0 6px',
                    }}>
                      {c.etiqueta}
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
                  {l.texto}
                </p>
              </div>
            </div>
          )
        })}

        <p style={{
          margin: '8px 0 0', fontSize: 10.5, lineHeight: 1.5, color: '#475569',
          display: 'flex', gap: 5, alignItems: 'flex-start',
        }}>
          <ChevronDown size={12} color="#475569" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Todo esto sale de las fuentes vivas de la ficha. Donde dice «no medido» es que el dato
            NO existe — no que esté en cero.
          </span>
        </p>
      </div>
    </div>
  )
}
