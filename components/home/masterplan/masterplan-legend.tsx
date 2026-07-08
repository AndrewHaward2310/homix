'use client'

import { useLocale } from '@/lib/i18n/provider'
import { AMENITY_CATEGORY_META, AMENITY_CATEGORY_ORDER } from '@/services/propertyService'
import { cn } from '@/lib/utils'

/** Màu chấm theo trạng thái, khớp với hotspot. */
const DOT: Record<string, string> = {
  selling: 'bg-primary',
  coming_soon: 'bg-muted-foreground/60',
  sold_out: 'bg-muted-foreground/40',
}

const STATUSES = ['selling', 'coming_soon', 'sold_out'] as const

/** Chú thích trạng thái phân khu + (tùy chọn) nhóm tiện ích, dạng thẻ glass. */
export function MasterplanLegend({
  className,
  showAmenities,
}: {
  className?: string
  showAmenities?: boolean
}) {
  const { t, locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'vi'

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'size-2 rounded-full',
                DOT[s],
                s === 'sold_out' && 'ring-1 ring-inset ring-muted-foreground/40',
              )}
              aria-hidden="true"
            />
            <span className="font-sans text-[0.75rem] font-medium text-foreground">
              {t(`tower.${s}`)}
            </span>
          </span>
        ))}
      </div>

      {showAmenities && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-border/50 pt-2">
          {AMENITY_CATEGORY_ORDER.map((cat) => {
            const meta = AMENITY_CATEGORY_META[cat]
            return (
              <span key={cat} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
                <span className="font-sans text-[0.6875rem] text-muted-foreground">
                  {meta.label[lang]}
                </span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
