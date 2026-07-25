'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Star, ImagePlus, X, Loader2, PencilLine } from 'lucide-react'
import type { Property, Review } from '@/types'
import { submitReview } from '@/services/propertyService'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 6
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

/**
 * ReviewForm — khách ĐÃ ĐĂNG NHẬP viết đánh giá: chọn sao, bình luận, đính kèm ảnh
 * tự chụp (tối đa 6). Gửi xong gọi onSubmitted với danh sách review mới.
 * Khách chưa đăng nhập / không phải customer → nút mời đăng nhập.
 */
export function ReviewForm({
  propertyId,
  onSubmitted,
}: {
  propertyId: string
  onSubmitted: (reviews: Review[], property: Property) => void
}) {
  const t = useT()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lock = useRef(false)

  // Preview object-URL tạo 1 lần theo danh sách file, revoke khi đổi/unmount (chống leak).
  const [previews, setPreviews] = useState<string[]>([])
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  if (!user || user.role !== 'customer') {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border bg-secondary/30 p-4 font-sans text-[0.8125rem] text-muted-foreground">
        {t('review.loginToReview')}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-sans text-[0.875rem] font-semibold text-foreground transition hover:bg-secondary"
      >
        <PencilLine className="size-4" /> {t('review.write')}
      </button>
    )
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const incoming = Array.from(list)
    // Lọc sai loại / quá 8MB ngay ở client — báo lỗi cục bộ, không đợi server.
    const bad = incoming.find((f) => !ALLOWED.has(f.type) || f.size > MAX_BYTES)
    if (bad) setErr(t('review.badFile'))
    const valid = incoming.filter((f) => ALLOWED.has(f.type) && f.size <= MAX_BYTES)
    setFiles((xs) => [...xs, ...valid].slice(0, MAX_IMAGES))
    if (inputRef.current) inputRef.current.value = ''
  }

  const canSend = rating >= 1 && comment.trim() !== ''

  const submit = async () => {
    if (lock.current || !canSend) return
    lock.current = true
    setSending(true)
    setErr('')
    try {
      const res = await submitReview(propertyId, { rating, comment: comment.trim(), files })
      if (res.ok) {
        onSubmitted(res.reviews, res.property)
        setOpen(false)
        setRating(0)
        setComment('')
        setFiles([])
      } else {
        setErr(res.error)
      }
    } finally {
      setSending(false)
      lock.current = false
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[0.9rem] font-bold text-foreground">{t('review.write')}</p>
        <button
          type="button"
          aria-label={t('locator.close')}
          onClick={() => setOpen(false)}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Chọn sao */}
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label={t('review.rating')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={cn(
                'size-7 transition',
                (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-border',
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('review.commentPlaceholder')}
        maxLength={2000}
        className="mt-3 min-h-[88px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
      />

      {/* Ảnh đã chọn */}
      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative size-16 overflow-hidden rounded-lg ring-1 ring-border">
              {previews[i] && <Image src={previews[i]} alt="" fill sizes="64px" className="object-cover" />}
              <button
                type="button"
                aria-label={t('review.removePhoto')}
                onClick={() => setFiles((xs) => xs.filter((_, idx) => idx !== i))}
                className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          disabled={files.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-[0.8125rem] font-medium text-foreground transition hover:bg-secondary disabled:opacity-40"
        >
          <ImagePlus className="size-4" /> {t('review.addPhoto')} ({files.length}/{MAX_IMAGES})
        </button>
      </div>

      {err && <p className="mt-2 font-sans text-[0.8125rem] text-red-600">{err}</p>}

      <button
        type="button"
        disabled={!canSend || sending}
        onClick={submit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending && <Loader2 className="size-4 animate-spin" />}
        {t('review.submit')}
      </button>
    </div>
  )
}
