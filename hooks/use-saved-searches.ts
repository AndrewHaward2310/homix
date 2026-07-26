'use client'

import { useCallback, useEffect, useState } from 'react'

export type SavedSearch = { id: string; label: string; query: string; at: number }

const KEY = 'domix.savedSearches'
const MAX = 10

/**
 * Lưu bộ tìm kiếm (query string) vào localStorage để dùng lại. Không đụng server.
 * `ready` chặn ghi đè localStorage bằng [] trước khi đọc xong.
 */
export function useSavedSearches() {
  const [items, setItems] = useState<SavedSearch[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      /* localStorage không dùng được → bỏ qua */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* hết quota / chặn → bỏ qua */
    }
  }, [items, ready])

  const add = useCallback((label: string, query: string) => {
    setItems((prev) =>
      [{ id: crypto.randomUUID(), label, query, at: Date.now() }, ...prev.filter((i) => i.query !== query)].slice(0, MAX),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const has = useCallback((query: string) => items.some((i) => i.query === query), [items])

  return { items, add, remove, has, ready }
}
