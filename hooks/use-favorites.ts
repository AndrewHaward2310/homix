'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { favoriteService } from '@/services/favoriteService'
import { useAuth } from '@/components/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/lib/i18n/provider'

/**
 * Quản lý tập id căn đã lưu + toggle OPTIMISTIC (rollback khi lỗi).
 * Dùng ref để quyết định wasFav → không bị race khi bấm nhanh.
 */
export function useFavorites() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const t = useT()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const idsRef = useRef(ids)
  idsRef.current = ids

  useEffect(() => {
    let active = true
    if (!user) {
      setIds(new Set())
      return
    }
    favoriteService.getFavorites().then((d) => {
      if (active) setIds(new Set(d.ids))
    })
    return () => {
      active = false
    }
  }, [user])

  const isFavorite = useCallback((id: string) => ids.has(id), [ids])

  const toggle = useCallback(
    async (id: string) => {
      if (!user) {
        router.push('/login?next=' + encodeURIComponent(window.location.pathname))
        return
      }
      const wasFav = idsRef.current.has(id)
      const flip = (add: boolean) =>
        setIds((prev) => {
          const next = new Set(prev)
          if (add) next.add(id)
          else next.delete(id)
          return next
        })

      flip(!wasFav) // optimistic
      const ok = wasFav
        ? await favoriteService.removeFavorite(id)
        : await favoriteService.addFavorite(id)

      if (!ok) {
        flip(wasFav) // rollback
        toast({ message: t('toast.error'), variant: 'error' })
        return
      }
      toast({
        message: wasFav ? t('toast.unsaved') : t('toast.saved'),
        action: { label: t('toast.undo'), onClick: () => toggle(id) },
      })
    },
    [user, router, toast, t],
  )

  return { ids, isFavorite, toggle }
}
