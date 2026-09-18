'use client'
/**
 * Aviso de que la contraseña está por vencer.
 *
 * ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 * La contraseña dura 30 días. Cuando vence, `/api/auth/login` responde
 * `password_expirado` y ya no se puede entrar — y el módulo para renovarla vive
 * DETRÁS del login, así que se cierra el círculo: para renovarla hay que poder
 * entrar, y para entrar hay que haberla renovado.
 *
 * El 15 de septiembre de 2026 vencieron tres cuentas el mismo día, dos de ellas
 * administradoras, y nadie se enteró hasta que intentaron entrar. El panel de
 * admin sí pintaba los días restantes, pero ese panel también está detrás del
 * login: el aviso llegaba justo a quien ya no podía verlo.
 *
 * Por eso este aviso va en TODAS las pantallas, mientras todavía se puede
 * actuar.
 *
 * ── CUÁNDO APARECE ─────────────────────────────────────────────────────────
 * A falta de 7 días o menos. De 3 días para abajo se pone rojo y ya no se puede
 * cerrar: a esa altura esconderlo no es una preferencia, es perder el acceso.
 * Arriba de 3 se puede posponer, pero solo por hoy — mañana vuelve.
 */
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'

const AVISA_DESDE = 7      // días
const NO_SE_CIERRA = 3     // días
const LS = 'cp.avisoPassword.pospuesto'

/* Sobre fondo claro, letra oscura. */
const MARINO = '#122E5E'

export default function AvisoPassword() {
  const [dias, setDias] = useState<number | null>(null)
  const [rol, setRol] = useState<string | null>(null)
  const [oculto, setOculto] = useState(true)

  /* El layout raiz envuelve TAMBIEN /acceso, que es publica y no trae cookie:
     ahi la consulta seria un 401 garantizado en cada carga del login. */
  const ruta = usePathname()

  useEffect(() => {
    if (ruta?.startsWith('/acceso')) return
    let vivo = true
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!vivo || !d || typeof d.diasParaExpirar !== 'number') return
        setDias(d.diasParaExpirar)
        setRol(d.rol ?? null)
        let pospuestoHoy = false
        try {
          pospuestoHoy = window.localStorage.getItem(LS) === new Date().toDateString()
        } catch { /* modo privado o almacenamiento bloqueado: se muestra */ }
        setOculto(pospuestoHoy && d.diasParaExpirar > NO_SE_CIERRA)
      })
      .catch(() => { /* el aviso es un extra: si falla, no estorba */ })
    return () => { vivo = false }
  }, [ruta])

  if (dias === null || dias > AVISA_DESDE || oculto) return null

  const urgente = dias <= NO_SE_CIERRA
  const fondo = urgente ? '#FEE2E2' : '#FEF3C7'
  const borde = urgente ? '#FCA5A5' : '#FCD34D'
  const acento = urgente ? '#B91C1C' : '#B45309'

  const cuanto =
    dias < 0 ? 'ya venció'
      : dias === 0 ? 'vence hoy'
        : dias === 1 ? 'vence mañana'
          : `vence en ${dias} días`

  const posponer = () => {
    try { window.localStorage.setItem(LS, new Date().toDateString()) } catch { /* idem */ }
    setOculto(true)
  }

  return (
    <div className="mx-6 mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
      style={{ background: fondo, border: `1px solid ${borde}` }}>
      <AlertTriangle size={16} style={{ color: acento, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: acento }}>
          Tu contraseña {cuanto}
        </p>
        <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: MARINO }}>
          {dias < 0
            ? 'El acceso ya está cerrado y el módulo para cambiarla queda del otro lado del inicio de sesión.'
            : 'Cuando vence, el acceso se cierra por completo y el módulo para cambiarla queda del otro lado del inicio de sesión. Renuévala antes.'}
          {rol === 'admin'
            ? <> Puedes hacerlo en <a href="/admin/usuarios" style={{ color: acento, fontWeight: 700 }}>Admin → Usuarios</a>.</>
            : <> Pídele a un administrador que la renueve desde Admin → Usuarios.</>}
          {' '}Si ya te quedaste fuera, se recupera con
          {' '}<code style={{ fontSize: 11 }}>scripts/restablece-password.py</code>.
        </p>
      </div>
      {!urgente && (
        <button onClick={posponer} title="Recordarme mañana"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: acento, lineHeight: 0, padding: 2 }}>
          <X size={15} />
        </button>
      )}
    </div>
  )
}
