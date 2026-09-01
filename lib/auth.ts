/**
 * lib/auth.ts
 * Helpers JWT para sesión de usuario.
 * Usa la librería `jose` (ya instalada) — compatible con Edge Runtime.
 */
import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

export type Rol = 'admin' | 'asesor' | 'viewer'

export interface SessionPayload {
  email:        string
  nombre:       string
  rol:          Rol
  asesor_nombre: string | null   // 'Fátima' | 'Dan' | 'Claudia' | null
}

const SESSION_DURATION = 60 * 60 * 24 * 30   // 30 días en segundos
export const COOKIE_NAME = 'cp_session'

/* ── Lista blanca de acceso al dashboard ───────────────────────────────
 * Fuente única de quién puede entrar (instrucción de dirección, 1 Sep 2026).
 *
 * Se evalúa en CADA request desde el middleware — no solo al iniciar sesión.
 * Motivo: la marca `usuarios.activo` solo se revisa en login/verify, y la
 * cookie dura 30 días; el 1 Sep 2026 había 4 usuarios marcados inactivos
 * usando el dashboard con sesiones emitidas antes de la baja.
 *
 * Para cambiar la lista sin desplegar: variable de entorno
 * EMAILS_AUTORIZADOS en Vercel, con los correos separados por coma.
 */
const EMAILS_AUTORIZADOS_DEFAULT = [
  'daniel@callpicker.com',
  'josel@callpicker.com',
  'lopezdjosemanuel@gmail.com',
]

export function emailsAutorizados(): Set<string> {
  const raw  = process.env.EMAILS_AUTORIZADOS
  const list = raw ? raw.split(',') : EMAILS_AUTORIZADOS_DEFAULT
  return new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean))
}

export function esEmailAutorizado(email: string | null | undefined): boolean {
  if (!email) return false
  return emailsAutorizados().has(email.trim().toLowerCase())
}

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(s)
}

/* ── Firmar token ──────────────────────────────────────────────────── */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret())
}

/* ── Verificar token ───────────────────────────────────────────────── */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/* ── Leer sesión desde headers (puestos por middleware) ──────────────
   Usar en Server Components y API Routes                             */
export function getSessionFromHeaders(req: NextRequest): SessionPayload | null {
  const email = req.headers.get('x-user-email')
  const rol   = req.headers.get('x-user-rol') as Rol | null
  if (!email || !rol) return null
  const rawNombre  = req.headers.get('x-user-nombre') ?? ''
  const rawAsesor  = req.headers.get('x-user-asesor') ?? ''
  return {
    email,
    nombre:        decodeURIComponent(rawNombre),
    rol,
    asesor_nombre: rawAsesor ? decodeURIComponent(rawAsesor) : null,
  }
}

/* ── Opciones de cookie segura ────────────────────────────────────── */
export function cookieOptions(maxAge = SESSION_DURATION) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge,
  }
}
