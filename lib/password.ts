import crypto from 'crypto'

const ITERS  = 100_000
const KEYLEN = 64
const DIGEST = 'sha512'

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(plain, salt, ITERS, KEYLEN, DIGEST).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const check = crypto.pbkdf2Sync(plain, salt, ITERS, KEYLEN, DIGEST).toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

/* Genera contraseña legible: Palabra + 2 nums + símbolo — fácil de comunicar por WhatsApp */
export function genPassword(): string {
  const words = ['Azul','Rojo','Verde','Luna','Pico','Toro','Bravo','Cielo','Mar','Rio']
  const syms  = ['!','#','@','$','%']
  const word  = words[Math.floor(Math.random() * words.length)]
  const num   = String(Math.floor(10 + Math.random() * 89))
  const sym   = syms[Math.floor(Math.random() * syms.length)]
  return `${word}${num}${sym}`
}

/* 30 días desde ahora */
export function passwordExpira(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}
