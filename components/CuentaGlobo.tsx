'use client'

/**
 * components/CuentaGlobo.tsx — UNA cosa a la vez sobre la cuenta abierta.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (26 sep 2026)
 * --------------------------------------
 * «Quiero que sea una información a la vez y se desvanezca a los 10 segundos, y
 * vuelva a aparecer de la misma cuenta, si tienes notas, con otra nota a los 5
 * minutos, y que dure 10 segundos y se desvanezca. Todo de un jalón se ve
 * encimado; trata de colocarlo donde no afecte a la vista de la información de
 * la cuenta.»
 *
 * POR QUÉ ASÍ Y NO EL PANEL DE ANTES
 * ----------------------------------
 * La primera versión mostraba las siete líneas juntas en un panel. Tenía toda la
 * información y por eso mismo no se leía: siete avisos a la vez no son siete
 * avisos, son una pared. Y tapaba la ficha, que es lo que el asesor vino a ver.
 *
 * Ahora aparece una sola nota, abajo a la izquierda, diez segundos, y se va. La
 * siguiente llega cinco minutos después. En una sesión de media hora alcanzan a
 * pasar unas seis: las suficientes para enterarse, sin convertirse en ruido.
 *
 * EL ORDEN NO ES EL DEL PANEL
 * ---------------------------
 * Se ordenan por gravedad, no por tema. Si el asesor solo ve una nota en toda la
 * sesión, tiene que ser la que importa — y la que importa nunca es «no tiene
 * auditoría entregada».
 *
 * DEFENSIVO A PROPÓSITO
 * ---------------------
 * Se monta en la pantalla más usada del tablero, y el 24 de septiembre un
 * rediseño de una sola pantalla lo tumbó entero con una excepción en el cliente.
 * Así que: todos los temporizadores se limpian al desmontar, el icono se
 * resuelve por tabla con respaldo, y si no hay nada que decir no se pinta nada.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Ticket, AlertTriangle,
  ClipboardCheck, ClipboardX, FileSearch, Users, UserX, Gauge, Info, X,
} from 'lucide-react'
import type { EstadoCuenta, LineaEstado, TonoLinea } from '@/lib/estado-cuenta'

/** Cuánto se queda en pantalla. Instrucción: diez segundos. */
const VISIBLE_MS = 10_000
/** Cuánto espera antes de la siguiente. Instrucción: cinco minutos. */
const PAUSA_MS = 5 * 60_000
/** Lo que tarda en desvanecerse. Tiene que coincidir con la transición CSS. */
const FUNDIDO_MS = 600
/** Un respiro al abrir la ficha: que se vea la cuenta antes que el aviso. */
const ARRANQUE_MS = 1_500

/* Los mismos cinco tonos del panel anterior, con su contraste ya verificado
   contra la fórmula WCAG: texto ≥ 4.5:1 sobre su fondo, borde ≥ 3:1. */
const TONO: Record<TonoLinea, { fondo: string; borde: string; texto: string; etiqueta: string }> = {
  grave:  { fondo: '#FEF2F2', borde: '#DC2626', texto: '#7F1D1D', etiqueta: 'Atender' },
  aviso:  { fondo: '#FFFBEB', borde: '#B45309', texto: '#78350F', etiqueta: 'Revisar' },
  hueco:  { fondo: '#F5F3FF', borde: '#6D28D9', texto: '#4C1D95', etiqueta: 'No medido' },
  bien:   { fondo: '#F0FDF4', borde: '#15803D', texto: '#14532D', etiqueta: 'En orden' },
  neutro: { fondo: '#F8FAFC', borde: '#64748B', texto: '#334155', etiqueta: '' },
}

/** Primero lo que pide acción. Si solo ve una nota, que sea la que importa. */
const PRIORIDAD: Record<TonoLinea, number> = {
  grave: 0, hueco: 1, aviso: 2, neutro: 3, bien: 4,
}

const ICONOS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Ticket, AlertTriangle,
  ClipboardCheck, ClipboardX, FileSearch, Users, UserX, Gauge,
}

function Icono({ nombre, color }: { nombre: string; color: string }) {
  const C = ICONOS[nombre] ?? Info
  return <C size={15} color={color} />
}

export default function CuentaGlobo({
  estado, cuentaId, empresa,
}: {
  estado: EstadoCuenta | null
  cuentaId: string
  empresa: string
}) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [cerrado, setCerrado] = useState(false)
  /* Un solo cajón de temporizadores. Guardarlos sueltos en variables es como se
     escapa uno y sigue disparando sobre un componente ya desmontado. */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const limpiar = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  /* Ordenadas por gravedad. `slice()` antes de `sort` porque `sort` muta, y
     mutar una prop le cambiaría el orden al panel que la pasó. */
  const lineas: LineaEstado[] = (estado?.lineas ?? [])
    .slice()
    .sort((a, b) => (PRIORIDAD[a.tono] ?? 9) - (PRIORIDAD[b.tono] ?? 9))

  const total = lineas.length

  /** Muestra la nota `i`: diez segundos, se desvanece, y a los cinco minutos la siguiente. */
  const mostrar = useCallback((i: number) => {
    if (total === 0) return
    setIdx(i % total)
    setVisible(true)
    timers.current.push(setTimeout(() => {
      setVisible(false)
      timers.current.push(setTimeout(() => mostrar(i + 1), PAUSA_MS + FUNDIDO_MS))
    }, VISIBLE_MS))
  }, [total])

  useEffect(() => {
    if (total === 0 || cerrado) return
    limpiar()
    timers.current.push(setTimeout(() => mostrar(0), ARRANQUE_MS))
    return limpiar
  }, [cuentaId, total, cerrado, mostrar, limpiar])

  if (total === 0 || cerrado) return null

  const l = lineas[idx] ?? lineas[0]
  const t = TONO[l.tono] ?? TONO.neutro

  /** Clic en la nota: pasa a la siguiente sin esperar los cinco minutos. */
  const siguiente = () => {
    limpiar()
    setVisible(false)
    timers.current.push(setTimeout(() => mostrar(idx + 1), FUNDIDO_MS))
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        /* Abajo a la IZQUIERDA y angosto, para no taparle la ficha: el contenido
           de la cuenta vive arriba y al centro, y la columna derecha la usan los
           paneles. `pointer-events: none` mientras está oculto, para que no
           atrape clics de algo que no se ve. */
        position: 'fixed', left: 20, bottom: 20, zIndex: 40,
        width: 'min(380px, calc(100vw - 40px))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity ${FUNDIDO_MS}ms ease, transform ${FUNDIDO_MS}ms ease`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{
        background: t.fondo, border: `1px solid ${t.borde}`, borderRadius: 12,
        boxShadow: '0 8px 24px rgba(15,23,42,0.18)', padding: '10px 12px',
        display: 'flex', gap: 9, alignItems: 'flex-start',
      }}>
        <span style={{ flexShrink: 0, marginTop: 2, lineHeight: 0 }}>
          <Icono nombre={l.icono} color={t.borde} />
        </span>

        <div
          onClick={siguiente}
          style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
          title="Ver la siguiente nota de esta cuenta"
        >
          <p style={{
            margin: '0 0 2px', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
            textTransform: 'uppercase', color: t.texto,
            display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          }}>
            {l.titulo}
            {t.etiqueta && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: t.texto,
                background: '#FFFFFF', border: `1px solid ${t.borde}`,
                borderRadius: 999, padding: '0 6px', letterSpacing: '0.03em',
              }}>
                {t.etiqueta}
              </span>
            )}
          </p>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: t.texto }}>
            {l.texto}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: t.texto, opacity: 0.75 }}>
            {empresa} · nota {idx + 1} de {total} · toca para ver la siguiente
          </p>
        </div>

        <button
          onClick={() => { limpiar(); setCerrado(true) }}
          aria-label="No mostrar más notas de esta cuenta"
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: 2, flexShrink: 0, lineHeight: 0,
          }}
        >
          <X size={14} color={t.texto} />
        </button>
      </div>
    </div>
  )
}
