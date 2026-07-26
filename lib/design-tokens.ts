/**
 * OCEAN PARK — DESIGN TOKENS
 * Nguồn chân lý duy nhất cho hệ thống thiết kế "Apple Luxury Minimal".
 * Các giá trị màu/tỉ lệ ở đây được đồng bộ với CSS variables trong app/globals.css.
 */

export const colors = {
  // Nền
  background: '#FFFFFF',
  backgroundDark: '#0A0A0A',
  surface: '#F5F5F7', // xám nền phụ

  // Chữ
  foreground: '#1D1D1F', // chữ chính
  mutedForeground: '#6F6F74', // chữ phụ (đậm nhẹ để đạt WCAG AA ~5:1 trên nền trắng)

  // Viền
  border: '#E8E8ED', // viền cực nhạt

  // Accent DUY NHẤT — dùng rất tiết chế (CTA / nhấn nhỏ)
  brand: '#0B5C63', // xanh biển sâu
  brandForeground: '#FFFFFF',
} as const

export const typography = {
  fontFamily: 'Geist, Inter, ui-sans-serif, system-ui, sans-serif',
  scale: {
    display: { size: '88px', weight: 700, tracking: '-0.04em', leading: 1.05 },
    h1: { size: '48px', weight: 700, tracking: '-0.03em', leading: 1.08 },
    h2: { size: '32px', weight: 600, tracking: '-0.02em', leading: 1.1 },
    h3: { size: '24px', weight: 600, tracking: '-0.02em', leading: 1.2 },
    body: { size: '17px', weight: 400, tracking: '0', leading: 1.6 },
    caption: { size: '14px', weight: 400, tracking: '0', leading: 1.5 },
  },
} as const

export const spacing = {
  base: 8, // px
  container: 1280, // max-width px
  sectionDesktop: '120px – 160px',
  sectionMobile: '64px – 80px',
} as const

export const radius = {
  sm: '8px',
  md: '10px',
  card: '12px', // card / panel
  pill: '9999px', // nút dạng pill
} as const

export const motion = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)', // ease-out mượt
  durationFast: '400ms',
  durationSlow: '600ms',
  revealOffset: '16px', // translateY khi fade-in
  imageHoverScale: 1.03,
} as const

export const glass = {
  blur: '20px',
  lightBg: 'rgba(255, 255, 255, 0.70)',
  darkBg: 'rgba(10, 10, 10, 0.60)',
  borderOpacity: '10%',
} as const

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  motion,
  glass,
} as const

export type DesignTokens = typeof designTokens
