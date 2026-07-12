'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'
import { ImageManager } from './image-manager'

type Props = {
  property: Property
  /** Nhận danh sách ảnh mới khi có thay đổi (để cha cập nhật card). */
  onUpdated?: (images: string[]) => void
  className?: string
}

/**
 * ManageImagesButton — nút "Quản lý ảnh" mở modal chứa ImageManager.
 * Dùng ở portal host (căn của mình) và admin (mọi căn). Quyền kiểm ở API.
 */
export function ManageImagesButton({ property, onUpdated, className }: Props) {
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState(property.images)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const handleChange = (next: string[]) => {
    setImages(next)
    onUpdated?.(next)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold text-foreground shadow-sm transition hover:bg-secondary',
          className,
        )}
      >
        <ImageIcon className="size-4" /> Quản lý ảnh
        <span className="text-muted-foreground">· {images.length}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quản lý ảnh"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-background shadow-luxury-lg ring-1 ring-black/5 sm:rounded-3xl">
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-sans text-base font-bold text-foreground">
                  {pickLocale(property.title, locale)}
                </h2>
                <p className="font-sans text-xs text-muted-foreground">{property.code} · Quản lý ảnh</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="overflow-y-auto p-5">
              <ImageManager propertyId={property.id} images={images} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
