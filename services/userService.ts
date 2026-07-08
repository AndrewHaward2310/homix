// Ocean Park — User service (client → API). getMe() phản chiếu /api/auth/me.
import type { User } from '@/types'

export async function getMe(): Promise<User | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  const data = (await res.json()) as { user: User | null }
  return data.user
}

export const userService = { getMe }
