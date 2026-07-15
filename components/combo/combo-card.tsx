'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Moon, Users, Star, ArrowRight, Flame, Ticket, Bike, Sparkles, Check } from 'lucide-react'
import type { TripCombo, PerkCategory } from '@/types'
import { pickLocale } from '@/types'
import { Body } from '@/components/luxury/typography'
import { useLocale } from '@/lib/i18n/provider'

export const COMBO_PERK_ICON: Record<PerkCategory, typeof Flame> = {
  bbq: Flame,
  lake_ticket: Ticket,
  vehicle: Bike,
  other: Sparkles,
}

/**
 * ComboCard — thẻ combo dùng chung: dải trang chủ (TripCombosSection) và trang
 * danh sách `/combo`. Ảnh chủ đề + tag + badge tiết kiệm + đã-gồm + rating + giá.
 */
export function ComboCard({ combo, priority }: { combo: TripCombo; priority?: boolean }) {
  const { locale, t, formatCurrency } = useLocale()
  return (
    <Link
      href={`/combo/${combo.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-black/5 shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury-lg"
    >
      {/* Ảnh chủ đề */}
      <div className="relative aspect-[16/11] overflow-hidden">
        <Image
          src={combo.themeImage}
          alt={pickLocale(combo.title, locale)}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" aria-hidden="true" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {combo.tags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-white/20 px-2.5 py-1 font-sans text-[0.6875rem] font-semibold text-white backdrop-blur-md ring-1 ring-white/25"
            >
              {pickLocale(tag, locale)}
            </span>
          ))}
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 font-sans text-[0.75rem] font-bold text-brand-foreground shadow-lg">
          {t('combos.save', { pct: combo.savingsPct })}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-serif text-[1.5rem] font-semibold leading-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
            {pickLocale(combo.title, locale)}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 font-sans text-[0.8125rem] font-medium text-white/90">
            <span className="inline-flex items-center gap-1">
              <Moon className="size-3.5" /> {t('combos.nights', { n: combo.nights })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {t('combos.guestsUpto', { n: combo.guests })}
            </span>
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col p-5">
        <Body className="line-clamp-2 text-[0.9rem] leading-relaxed">
          {pickLocale(combo.subtitle, locale)}
        </Body>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-2 py-1 font-sans text-[0.75rem] font-medium text-brand">
            <Check className="size-3.5" /> {t('combos.stayNight', { n: combo.nights })}
          </span>
          {combo.perks.map(({ perk }) => {
            const Icon = COMBO_PERK_ICON[perk.category]
            return (
              <span
                key={perk.id}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 font-sans text-[0.75rem] font-medium text-muted-foreground"
              >
                <Icon className="size-3.5" /> {pickLocale(perk.name, locale)}
              </span>
            )
          })}
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-sans text-[0.8125rem] font-semibold text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {combo.ratingAvg.toFixed(1)}
              {combo.reviewCount > 0 && (
                <span className="font-normal text-muted-foreground">
                  · {t('combos.reviews', { n: combo.reviewCount })}
                </span>
              )}
            </div>
            <div className="mt-1 font-sans text-[0.75rem] text-muted-foreground line-through">
              {formatCurrency(combo.listPriceVnd)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-sans text-[1.2rem] font-bold leading-none text-foreground">
              {formatCurrency(combo.packagePriceVnd)}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 font-sans text-[0.8125rem] font-semibold text-brand">
              {t('combos.viewCombo')}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
