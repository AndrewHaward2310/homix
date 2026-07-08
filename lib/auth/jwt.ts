// Ký & xác thực JWT bằng jose (edge-safe, dùng được cả trong middleware).
import { jwtVerify, SignJWT } from 'jose'
import type { Role } from './types'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-doi-truoc-khi-len-that',
)

const ISSUER = 'oceanpark'
const EXPIRES = '7d'

export type TokenPayload = { sub: string; role: Role }

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER })
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') return null
    return { sub: payload.sub, role: payload.role as Role }
  } catch {
    return null
  }
}
