// Ocean Park → HOMIX — Favorite service (client → API). Cần đăng nhập.
import type { Property } from '@/types'

/** Danh sách căn đã lưu + mảng id (cho UI ♥). Chưa đăng nhập → rỗng. */
export async function getFavorites(): Promise<{ favorites: Property[]; ids: string[] }> {
  const res = await fetch('/api/favorites')
  if (!res.ok) return { favorites: [], ids: [] }
  return res.json()
}

export async function addFavorite(propertyId: string): Promise<boolean> {
  const res = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId }),
  })
  return res.ok
}

export async function removeFavorite(propertyId: string): Promise<boolean> {
  const res = await fetch(`/api/favorites?propertyId=${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
  })
  return res.ok
}

export const favoriteService = { getFavorites, addFavorite, removeFavorite }
