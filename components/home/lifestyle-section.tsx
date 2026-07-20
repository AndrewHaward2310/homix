'use client'

import Image from 'next/image'
import { Section } from '@/components/luxury/section'
import { Container } from '@/components/luxury/container'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

// Chương → ảnh + key i18n (tag/title/desc dùng lifestyle.<key>.*)
const CHAPTERS = [
  { key: 'item1', image: '/images/apt-living-1.png' },
  { key: 'item2', image: '/images/life-dining.png' },
  { key: 'item3', image: '/images/life-beach.png' },
] as const

/**
 * LifestyleSection — "Một ngày tại HOMIX" theo lối TẠP CHÍ (Concept C):
 * mỗi chương là một panel FULL-BLEED, ảnh tràn tới mép màn hình, chữ cỡ lớn, so le.
 * Ba chương là một chuỗi trong ngày (nhận phòng → ẩm thực → biển hồ) nên đánh số 01–03 có nghĩa.
 */
export function LifestyleSection() {
  const t = useT()

  return (
    <Section id="tien-ich" className="scroll-mt-20" bleed spacing="none">
      <Container className="py-16 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>{t('lifestyle.eyebrow')}</Eyebrow>
          <H2 className="mt-4 text-balance md:text-[2.75rem]">{t('lifestyle.title')}</H2>
          <Body className="mx-auto mt-5">{t('lifestyle.subtitle')}</Body>
        </Reveal>
      </Container>

      {/* Ba chương là một CHUỖI trong ngày → dùng <ol> để truyền tải thứ tự */}
      <ol className="flex list-none flex-col pb-16 md:pb-24">
        {CHAPTERS.map(({ key, image: img }, i) => {
          const imageRight = i % 2 === 1
          return (
            <li
              key={key}
              className="grid grid-cols-1 items-stretch md:min-h-[78vh] md:grid-cols-2"
            >
              {/* Ảnh tràn mép */}
              <div
                className={cn(
                  'relative min-h-[56vw] bg-secondary md:min-h-0',
                  imageRight && 'md:order-2',
                )}
              >
                {/* Ảnh minh hoạ tâm trạng — nội dung đã nằm ở tiêu đề, để alt rỗng
                    tránh trình đọc màn hình đọc trùng tiêu đề hai lần. */}
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Chữ — cỡ lớn, canh về phía trong */}
              <div className={cn('flex items-center', imageRight && 'md:order-1')}>
                <Reveal
                  delay={80}
                  className={cn(
                    'w-full px-5 py-12 sm:px-8 md:py-16 lg:px-12 xl:px-16',
                    // Dồn khối chữ về phía ĐƯỜNG RÁP với ảnh (nhịp tạp chí), chừa
                    // khoảng thở với ảnh; cạnh ngoài dùng padding mặc định.
                    // max-w-xl (hẹp hơn cột) để margin-auto thật sự dồn được khối chữ
                    imageRight
                      ? 'md:ml-auto md:max-w-xl md:pr-10 lg:pr-16' // chữ ở cột trái → dồn phải
                      : 'md:mr-auto md:max-w-xl md:pl-10 lg:pl-16', // chữ ở cột phải → dồn trái
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Số chương là trang trí: thứ tự đã được truyền tải bằng <ol> + thứ tự đọc */}
                    <span
                      aria-hidden="true"
                      className="font-display text-[2.5rem] font-bold leading-none text-brand/30 tabular-nums"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-sans text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-brand">
                      {t(`lifestyle.${key}.tag`)}
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-[16ch] text-balance font-display text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-[2.5rem]">
                    {t(`lifestyle.${key}.title`)}
                  </h3>
                  <Body className="mt-5 max-w-md">{t(`lifestyle.${key}.desc`)}</Body>
                </Reveal>
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
