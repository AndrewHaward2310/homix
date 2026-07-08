'use client'

import { useLocale } from '@/lib/i18n/provider'
import {
  amenityGroup,
  amenityIcon,
  AMENITY_GROUP_LABEL,
  AMENITY_GROUP_ORDER,
  type AmenityGroup,
} from '@/lib/amenities'

/** Tiện ích gom nhóm + icon — dễ đọc, chuyên nghiệp hơn chip phẳng. */
export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  const { t, locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'vi'

  const grouped = new Map<AmenityGroup, string[]>()
  for (const a of amenities) {
    const g = amenityGroup(a)
    grouped.set(g, [...(grouped.get(g) ?? []), a])
  }
  const groups = AMENITY_GROUP_ORDER.filter((g) => grouped.has(g))

  const label = (a: string) => {
    const key = `amenity.${a}`
    const v = t(key)
    return v === key ? a.replace(/_/g, ' ') : v
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g}>
          <h3 className="font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {AMENITY_GROUP_LABEL[g][lang]}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {grouped.get(g)!.map((a) => {
              const Icon = amenityIcon(a)
              return (
                <li key={a} className="flex items-center gap-3 font-sans text-[0.9375rem] text-foreground">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
                    <Icon className="size-[1.05rem]" aria-hidden="true" />
                  </span>
                  {label(a)}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
