'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Images, Play } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

// Blur placeholder trung tính (LQIP blur-up cho ảnh remote).
const BLUR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjYiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjYiIGZpbGw9IiNlOGU4ZWQiLz48L3N2Zz4='

/**
 * Gallery tràn viền + lightbox: vuốt, zoom, thumbnail, preload ảnh kế, focus-trap,
 * điều hướng phím. Ảnh có blur-up LQIP.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useT()
  const imgs = images.length ? images : ['/placeholder.svg']
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [zoom, setZoom] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const swipeX = useRef<number | null>(null)

  const show = useCallback((i: number) => {
    setIdx(i)
    setZoom(false)
    setOpen(true)
  }, [])
  const next = useCallback(() => {
    setZoom(false)
    setIdx((i) => (i + 1) % imgs.length)
  }, [imgs.length])
  const prev = useCallback(() => {
    setZoom(false)
    setIdx((i) => (i - 1 + imgs.length) % imgs.length)
  }, [imgs.length])

  // Preload ảnh kế/trước.
  useEffect(() => {
    if (!open) return
    ;[(idx + 1) % imgs.length, (idx - 1 + imgs.length) % imgs.length].forEach((i) => {
      const im = new window.Image()
      im.src = imgs[i]
    })
  }, [open, idx, imgs])

  // Phím + khoá scroll + focus-trap.
  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Tab') {
        // Giữ focus trong dialog.
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button')
        if (!nodes || !nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, next, prev])

  return (
    <>
      {/* Lưới ảnh */}
      <div className="relative grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => show(0)}
          className="group relative col-span-1 aspect-[4/3] w-full overflow-hidden sm:col-span-2 sm:row-span-2 sm:aspect-auto"
        >
          <Image
            src={imgs[0]}
            alt={alt}
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR}
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
        {imgs.slice(1, 5).map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => show(i + 1)}
            className="group relative hidden aspect-[4/3] w-full overflow-hidden sm:block"
          >
            <Image
              src={src}
              alt={`${alt} ${i + 2}`}
              fill
              placeholder="blur"
              blurDataURL={BLUR}
              sizes="25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}

        <div className="pointer-events-none absolute bottom-3 right-3 flex gap-2">
          <span className="pointer-events-auto">
            <button
              type="button"
              onClick={() => show(0)}
              className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3.5 py-2 font-sans text-[0.8125rem] font-medium text-foreground shadow-luxury ring-1 ring-black/5 backdrop-blur-md transition hover:bg-background"
            >
              <Images className="size-4" aria-hidden="true" />
              {t('property.gallery')} · {imgs.length}
            </button>
          </span>
          <span className="pointer-events-auto">
            <button
              type="button"
              onClick={() => show(0)}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground/85 px-3.5 py-2 font-sans text-[0.8125rem] font-medium text-background shadow-luxury backdrop-blur-md transition hover:bg-foreground"
            >
              <Play className="size-3.5" aria-hidden="true" />
              {t('property.virtualTour')}
            </button>
          </span>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex flex-col bg-black/93 outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-sans text-sm text-white/70">
              {idx + 1} / {imgs.length}
            </span>
            <button
              type="button"
              aria-label={t('locator.close')}
              onClick={() => setOpen(false)}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-6">
            <button
              type="button"
              aria-label="Previous"
              onClick={prev}
              className="absolute left-2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-6"
            >
              <ChevronLeft className="size-6" />
            </button>
            <div
              className={cn('relative h-full w-full max-w-5xl transition-transform duration-300', zoom && 'scale-150')}
              onPointerDown={(e) => (swipeX.current = e.clientX)}
              onPointerUp={(e) => {
                if (swipeX.current == null) return
                const dx = e.clientX - swipeX.current
                swipeX.current = null
                if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
              }}
            >
              <button
                type="button"
                aria-label={zoom ? 'Zoom out' : 'Zoom in'}
                onClick={() => setZoom((z) => !z)}
                className={cn('absolute inset-0 h-full w-full', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}
              >
                <Image
                  src={imgs[idx]}
                  alt={`${alt} ${idx + 1}`}
                  fill
                  className={cn('transition-all duration-300', zoom ? 'object-cover' : 'object-contain')}
                  sizes="90vw"
                />
              </button>
            </div>
            <button
              type="button"
              aria-label="Next"
              onClick={next}
              className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-6"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
            {imgs.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => {
                  setZoom(false)
                  setIdx(i)
                }}
                className={cn(
                  'relative size-14 shrink-0 overflow-hidden rounded-lg ring-2 transition',
                  i === idx ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100',
                )}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
