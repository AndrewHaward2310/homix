import Image from 'next/image'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { Section } from '@/components/luxury/section'
import { Container } from '@/components/luxury/container'
import { Reveal } from '@/components/luxury/reveal'
import { LuxuryButton } from '@/components/luxury/luxury-button'
import { PropertyCard, type Property } from '@/components/luxury/property-card'
import {
  Display,
  H1,
  H2,
  H3,
  Body,
  Caption,
  Eyebrow,
} from '@/components/luxury/typography'

const COLOR_TOKENS = [
  { name: 'Nền chính', value: '#FFFFFF', className: 'bg-background border border-border' },
  { name: 'Nền tối', value: '#0A0A0A', className: 'bg-[#0A0A0A]' },
  { name: 'Xám nền phụ', value: '#F5F5F7', className: 'bg-[#F5F5F7]' },
  { name: 'Chữ chính', value: '#1D1D1F', className: 'bg-[#1D1D1F]' },
  { name: 'Chữ phụ', value: '#86868B', className: 'bg-[#86868B]' },
  { name: 'Viền cực nhạt', value: '#E8E8ED', className: 'bg-[#E8E8ED]' },
  { name: 'Accent — Ocean', value: '#0B5C63', className: 'bg-[#0B5C63]' },
]

const TYPE_SPECS = [
  { label: 'Display / 88px', node: <Display as="p">Sống trọn ven hồ</Display> },
  { label: 'Heading 1 / 48px', node: <H1 as="p">Đô thị biển hồ giữa lòng thành phố</H1> },
  { label: 'Heading 2 / 32px', node: <H2 as="p">Không gian sống tối giản, tinh tế</H2> },
  { label: 'Heading 3 / 24px', node: <H3 as="p">Căn hộ hướng hồ Ngọc Trai</H3> },
  {
    label: 'Body / 17px',
    node: (
      <Body className="max-w-2xl">
        Mỗi căn hộ tại HOMIX được thiết kế để đón trọn ánh sáng tự nhiên và tầm nhìn
        panorama ra mặt hồ, nơi khoảng trắng và vật liệu mộc kể câu chuyện về sự sang trọng
        đích thực.
      </Body>
    ),
  },
  {
    label: 'Caption / 14px',
    node: <Caption>Cập nhật giỏ hàng — Quý III, phân khu The Zenpark</Caption>,
  },
]

const PROPERTIES: Property[] = [
  {
    id: 'zen-01',
    name: 'The Zenpark',
    location: 'Phân khu ven hồ Ngọc Trai',
    price: '4,2 tỷ',
    area: '68 m²',
    bedrooms: 2,
    image: '/images/apt-living-1.png',
    tag: 'Hướng hồ',
  },
  {
    id: 'san-02',
    name: 'The Sancerre',
    location: 'Đại lộ trung tâm HOMIX',
    price: '6,8 tỷ',
    area: '95 m²',
    bedrooms: 3,
    image: '/images/apt-bedroom-1.png',
    tag: 'Mới ra mắt',
  },
  {
    id: 'sky-03',
    name: 'Sky Oasis',
    location: 'Tháp căn hộ view biển hồ',
    price: '5,5 tỷ',
    area: '82 m²',
    bedrooms: 2,
    image: '/images/apt-tower-1.png',
    tag: 'Tầng cao',
  },
]

const RADIUS_TOKENS = [
  { label: 'sm · 8px', className: 'rounded-[8px]' },
  { label: 'md · 10px', className: 'rounded-[10px]' },
  { label: 'card · 12px', className: 'rounded-xl' },
  { label: 'pill · full', className: 'rounded-full' },
]

export default function StyleguidePage() {
  return (
    <main className="min-h-screen bg-background">
      <GlassNavbar />

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <Image
          src="/images/hero-lakeside.png"
          alt="Toàn cảnh khu đô thị biển hồ HOMIX lúc hoàng hôn"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <Container className="relative z-10 pb-20 md:pb-28">
          <div className="max-w-3xl">
            <Eyebrow className="text-white/80">HOMIX · Design System</Eyebrow>
            <Display className="mt-5 text-white">Sống trọn nhịp sống ven hồ</Display>
            <p className="mt-6 max-w-xl text-pretty font-sans text-[1.0625rem] leading-[1.6] text-white/85">
              Bộ nhận diện “Apple Luxury Minimal” cho nền tảng bất động sản cao cấp — nơi ảnh
              tràn viền, khoảng trắng lớn và một sắc xanh biển sâu duy nhất dẫn dắt trải nghiệm.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LuxuryButton variant="glass" size="lg">
                Khám phá phân khu
              </LuxuryButton>
              <LuxuryButton variant="primary" size="lg">
                Đặt lịch tham quan
              </LuxuryButton>
            </div>
          </div>
        </Container>
      </section>

      {/* ================= BẢNG MÀU ================= */}
      <Section id="tong-quan">
        <Reveal>
          <Eyebrow>01 — Bảng màu</Eyebrow>
          <H2 className="mt-4">Để hình ảnh làm màu cho trang</H2>
          <Body className="mt-4 max-w-2xl">
            Nền trung tính, chữ đậm chắc, và một accent xanh biển sâu duy nhất dùng rất tiết chế
            cho các điểm nhấn quan trọng. Không phủ màu lòe loẹt.
          </Body>
        </Reveal>

        <Reveal className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_TOKENS.map((token) => (
            <div key={token.value}>
              <div className={`h-28 w-full rounded-xl ${token.className}`} />
              <p className="mt-3 font-sans text-[0.95rem] font-medium text-foreground">
                {token.name}
              </p>
              <p className="font-mono text-[0.8125rem] text-muted-foreground">{token.value}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* ================= TYPOGRAPHY ================= */}
      <Section spacing="compact" className="bg-secondary">
        <Reveal>
          <Eyebrow>02 — Typography</Eyebrow>
          <H2 className="mt-4">Geist · letter-spacing âm, leading chặt</H2>
        </Reveal>

        <div className="mt-12 divide-y divide-border">
          {TYPE_SPECS.map((spec, i) => (
            <Reveal
              key={spec.label}
              delay={i * 60}
              className="grid gap-3 py-8 md:grid-cols-[180px_1fr] md:items-baseline md:gap-10"
            >
              <Caption className="font-mono">{spec.label}</Caption>
              <div>{spec.node}</div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ================= BUTTONS ================= */}
      <Section>
        <Reveal>
          <Eyebrow>03 — Nút bấm</Eyebrow>
          <H2 className="mt-4">Pill · Ghost · Glass</H2>
          <Body className="mt-4 max-w-2xl">
            Nút chính dạng pill với accent ocean; nút ghost tối giản; nút glass dùng nổi trên
            ảnh. Mọi tương tác đều mượt với transition ease-out 400ms.
          </Body>
        </Reveal>

        <Reveal className="mt-12 flex flex-wrap items-center gap-4">
          <LuxuryButton variant="primary">Đặt lịch tham quan</LuxuryButton>
          <LuxuryButton variant="ghost">Xem mặt bằng</LuxuryButton>
          <LuxuryButton variant="outline">Tải brochure</LuxuryButton>
        </Reveal>

        {/* Glass buttons cần nền ảnh để thấy rõ */}
        <Reveal className="relative mt-8 overflow-hidden rounded-xl">
          <div className="relative h-56 w-full">
            <Image
              src="/images/lifestyle-1.png"
              alt="Bể bơi vô cực nhìn ra hồ lúc hoàng hôn"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center gap-4 px-8">
              <LuxuryButton variant="glass">Nút Glass</LuxuryButton>
              <LuxuryButton variant="glass" size="lg">
                Trên nền ảnh
              </LuxuryButton>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap items-center gap-4">
          <LuxuryButton size="sm">Small</LuxuryButton>
          <LuxuryButton size="md">Medium</LuxuryButton>
          <LuxuryButton size="lg">Large</LuxuryButton>
          <LuxuryButton disabled>Vô hiệu hoá</LuxuryButton>
        </Reveal>
      </Section>

      {/* ================= PROPERTY CARDS ================= */}
      <Section id="can-ho" className="bg-secondary">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>04 — Property Card</Eyebrow>
            <H2 className="mt-4">Căn hộ tiêu biểu</H2>
            <Body className="mt-4 max-w-xl">
              Ảnh tràn tỉ lệ 4:5 làm chủ đạo, thông tin tối giản bên dưới, không viền cứng.
              Di chuột để thấy ảnh phóng nhẹ 1.03.
            </Body>
          </div>
          <LuxuryButton variant="ghost">Xem tất cả căn hộ</LuxuryButton>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PROPERTIES.map((property, i) => (
            <Reveal key={property.id} delay={i * 90}>
              <PropertyCard property={property} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ================= TIỆN ÍCH / GLASS PANEL ================= */}
      <Section id="tien-ich">
        <Reveal>
          <Eyebrow>05 — Bề mặt & Glass</Eyebrow>
          <H2 className="mt-4">Kính mờ cho thanh nổi & toolbar</H2>
        </Reveal>

        <Reveal className="relative mt-12 overflow-hidden rounded-2xl">
          <div className="relative h-[420px] w-full">
            <Image
              src="/images/amenity-park.png"
              alt="Công viên ven hồ với người dân dạo bộ"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
            />
            {/* Toolbar glass nổi */}
            <div className="absolute inset-x-6 bottom-6 flex flex-col gap-4 rounded-xl border border-glass-border bg-glass p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <H3 className="text-foreground">Công viên trung tâm 32 ha</H3>
                <Caption className="mt-1 block">
                  Đường dạo ven hồ · vườn Nhật · quảng trường ánh sáng
                </Caption>
              </div>
              <LuxuryButton variant="primary">Khám phá tiện ích</LuxuryButton>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ================= RADIUS / SHADOW / SPACING ================= */}
      <Section spacing="compact" id="vi-tri" className="bg-secondary">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Radius */}
          <Reveal>
            <Eyebrow>06 — Bo góc</Eyebrow>
            <H3 className="mt-4">Bo nhẹ, không bo tròn quá đà</H3>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {RADIUS_TOKENS.map((r) => (
                <div key={r.label} className="text-center">
                  <div className={`mx-auto h-20 w-20 bg-brand ${r.className}`} />
                  <p className="mt-3 font-mono text-[0.8125rem] text-muted-foreground">
                    {r.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Shadow */}
          <Reveal delay={80}>
            <Eyebrow>07 — Đổ bóng</Eyebrow>
            <H3 className="mt-4">Bóng rất mềm, khuếch tán rộng</H3>
            <div className="mt-8 flex flex-wrap gap-8">
              <div className="text-center">
                <div className="h-28 w-40 rounded-xl bg-background shadow-luxury-sm" />
                <p className="mt-3 font-mono text-[0.8125rem] text-muted-foreground">
                  shadow-luxury-sm
                </p>
              </div>
              <div className="text-center">
                <div className="h-28 w-40 rounded-xl bg-background shadow-luxury" />
                <p className="mt-3 font-mono text-[0.8125rem] text-muted-foreground">
                  shadow-luxury
                </p>
              </div>
              <div className="text-center">
                <div className="h-28 w-40 rounded-xl bg-background shadow-luxury-lg" />
                <p className="mt-3 font-mono text-[0.8125rem] text-muted-foreground">
                  shadow-luxury-lg
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Spacing */}
        <Reveal className="mt-16">
          <Eyebrow>08 — Khoảng cách</Eyebrow>
          <H3 className="mt-4">Base 8px · Section 120–160px desktop</H3>
          <div className="mt-8 flex flex-wrap items-end gap-4">
            {[8, 16, 24, 40, 64, 120].map((s) => (
              <div key={s} className="text-center">
                <div className="mx-auto bg-brand" style={{ width: s, height: s }} />
                <p className="mt-2 font-mono text-[0.75rem] text-muted-foreground">{s}px</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border">
        <Container className="flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-brand" aria-hidden="true" />
            <span className="font-sans text-lg font-semibold tracking-[-0.02em] text-foreground">
              HOMIX
            </span>
          </div>
          <Caption>Design System · “Apple Luxury Minimal” · Bản duyệt look</Caption>
        </Container>
      </footer>
    </main>
  )
}
