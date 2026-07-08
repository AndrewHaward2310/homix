'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'homix.recentlyViewed'
const CAP = 12

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** Lưu id căn vừa xem (local-first, không cần đăng nhập). */
export function recordRecentlyViewed(id: string) {
  try {
    const list = [id, ...read().filter((x) => x !== id)].slice(0, CAP)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

/** Đọc danh sách id đã xem gần đây (bỏ qua id hiện tại nếu truyền). */
export function useRecentlyViewed(exclude?: string): string[] {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    setIds(read().filter((x) => x !== exclude))
  }, [exclude])
  return ids
}

/** Hook ghi nhận 1 lần khi xem chi tiết. */
export function useRecordView(id: string | undefined) {
  const record = useCallback(() => id && recordRecentlyViewed(id), [id])
  useEffect(() => {
    record()
  }, [record])
}
