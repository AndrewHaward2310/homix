/**
 * WaveDivider — chuyển tiếp SÓNG mềm giữa hai section để trang bớt "một mạch phẳng".
 * Màu tinted khớp với `bg-secondary/40` phủ trên nền `bg-background`
 * (= color-mix 40% secondary + background) nên nối liền không lộ mép.
 *
 * - `variant="to-tinted"`: đi từ nền sáng → nền tinted (sóng tinted dâng lên).
 * - `variant="to-ground"`: đi từ nền tinted → nền sáng (sóng nền sáng dâng lên).
 *
 * Fallback: `fill`/`background` khai báo màu đặc (`var(--secondary)`/`var(--background)`)
 * TRƯỚC khi `color-mix` ghi đè — engine cũ bỏ qua color-mix sẽ về màu đặc, không phải đen.
 */
const TINTED = 'color-mix(in srgb, var(--secondary) 40%, var(--background))'

export function WaveDivider({ variant }: { variant: 'to-tinted' | 'to-ground' }) {
  const toTinted = variant === 'to-tinted'
  // Màu nền của dải & màu fill của sóng, kèm fallback đặc.
  const bgFallback = toTinted ? 'var(--background)' : 'var(--secondary)'
  const bg = toTinted ? 'var(--background)' : TINTED
  const fillFallback = toTinted ? 'var(--secondary)' : 'var(--background)'
  const fill = toTinted ? TINTED : 'var(--background)'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none -mt-px -mb-px overflow-hidden leading-[0]"
      style={{ background: bgFallback }}
    >
      <div style={{ background: bg }}>
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="block h-8 w-full md:h-12">
          <path
            fill={fillFallback}
            d="M0,26 C240,6 480,38 720,26 C960,14 1200,40 1440,22 L1440,48 L0,48 Z"
            style={{ fill }}
          />
        </svg>
      </div>
    </div>
  )
}
