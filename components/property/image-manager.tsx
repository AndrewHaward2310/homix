'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2, GripVertical, Star } from 'lucide-react'
import {
  uploadPropertyImages,
  reorderPropertyImages,
  deletePropertyImage,
} from '@/services/propertyService'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type Props = {
  propertyId: string
  images: string[]
  /** Gọi mỗi khi danh sách ảnh thay đổi (để cha đồng bộ state). */
  onChange?: (images: string[]) => void
}

/**
 * ImageManager — quản lý ảnh 1 căn: upload, xoá, kéo sắp xếp, đặt ảnh bìa.
 * Ảnh ĐẦU TIÊN là ảnh bìa (hiển thị trên card). Kéo-thả để đổi thứ tự.
 * Quyền được kiểm ở API (admin / host sở hữu).
 */
export function ImageManager({ propertyId, images: initial, onChange }: Props) {
  const toast = useToast()
  const [images, setImages] = useState<string[]>(initial)
  const [busy, setBusy] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sync = (next: string[]) => {
    setImages(next)
    onChange?.(next)
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    setBusy(true)
    try {
      const updated = await uploadPropertyImages(propertyId, files)
      sync(updated.images)
      toast({ message: `Đã tải lên ${files.length} ảnh.`, variant: 'success' })
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'error' })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(url: string) {
    const prev = images
    sync(images.filter((u) => u !== url)) // optimistic
    try {
      const updated = await deletePropertyImage(propertyId, url)
      sync(updated.images)
      toast({ message: 'Đã xoá ảnh.', variant: 'success' })
    } catch (e) {
      sync(prev) // rollback
      toast({ message: (e as Error).message, variant: 'error' })
    }
  }

  async function persistOrder(next: string[]) {
    const prev = images
    sync(next) // optimistic
    try {
      const updated = await reorderPropertyImages(propertyId, next)
      sync(updated.images)
    } catch (e) {
      sync(prev)
      toast({ message: (e as Error).message, variant: 'error' })
    }
  }

  function onDrop(target: number) {
    if (dragIdx === null || dragIdx === target) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const next = [...images]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(target, 0, moved)
    setDragIdx(null)
    setOverIdx(null)
    void persistOrder(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Vùng upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-brand hover:bg-secondary/50 disabled:opacity-60',
        )}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-brand" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <span className="font-sans text-sm font-medium text-foreground">
          {busy ? 'Đang tải lên…' : 'Chọn ảnh để tải lên'}
        </span>
        <span className="font-sans text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF · tối đa 8MB/ảnh
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length === 0 ? (
        <p className="py-4 text-center font-sans text-sm text-muted-foreground">
          Chưa có ảnh nào. Tải lên ảnh đầu tiên — ảnh đầu sẽ là ảnh bìa.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, idx) => (
            <li
              key={url}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragEnter={() => setOverIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(idx)}
              onDragEnd={() => {
                setDragIdx(null)
                setOverIdx(null)
              }}
              className={cn(
                'group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl ring-1 ring-black/5 transition-all active:cursor-grabbing',
                dragIdx === idx && 'opacity-40',
                overIdx === idx && dragIdx !== idx && 'ring-2 ring-brand',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Ảnh ${idx + 1}`} className="size-full object-cover" />

              {/* Badge ảnh bìa */}
              {idx === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1 font-sans text-[0.6875rem] font-semibold text-brand-foreground shadow">
                  <Star className="size-3 fill-current" /> Ảnh bìa
                </span>
              )}

              {/* Tay cầm kéo */}
              <span className="absolute right-2 top-2 rounded-md bg-black/45 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-4" />
              </span>

              {/* Nút xoá */}
              <button
                type="button"
                onClick={() => handleDelete(url)}
                aria-label="Xoá ảnh"
                className="absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>

              {/* Nút đặt làm ảnh bìa (khi không phải ảnh đầu) */}
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => persistOrder([url, ...images.filter((u) => u !== url)])}
                  className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 font-sans text-[0.6875rem] font-semibold text-white opacity-0 transition-all hover:bg-black/75 group-hover:opacity-100"
                >
                  Đặt làm bìa
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-xs text-muted-foreground">
        Kéo-thả để đổi thứ tự. Ảnh đầu tiên là ảnh hiển thị trên thẻ căn hộ.
      </p>
    </div>
  )
}
