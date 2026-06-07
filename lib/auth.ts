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

const SESSION_DURATION = 60 * 60 * 12   // 12 horas en segundos
export const COOKIE_NAME = 'cp_session'

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
  return {
    email,
    nombre:        req.headers.get('x-user-nombre') ?? '',
    rol,
    asesor_nombre: req.headers.get('x-user-asesor') || null,
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
