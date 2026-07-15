import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { AuthProvider } from '@/components/auth/auth-context'
import { LanguageProvider } from '@/lib/i18n/provider'
import { ToastProvider } from '@/components/ui/toast'
import { ThemeProvider, themeInitScript } from '@/components/theme/theme-provider'
import './globals.css'

// Self-host font (không tải Google Fonts lúc build → build ổn định offline).
const sans = localFont({
  src: [
    { path: './fonts/jakarta-latin.woff2', weight: '200 800', style: 'normal' },
    { path: './fonts/jakarta-latin-ext.woff2', weight: '200 800', style: 'normal' },
    { path: './fonts/jakarta-vietnamese.woff2', weight: '200 800', style: 'normal' },
  ],
  variable: '--font-sans-base',
  display: 'swap',
})

const geistMono = localFont({
  src: [{ path: './fonts/geistmono-latin.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist-mono',
  display: 'swap',
})

// Font hiển thị (Space Grotesk) — sans-serif hiện đại, hỗ trợ tiếng Việt đầy đủ.
// Dùng cho tiêu đề lớn/hero (class font-display).
const display = localFont({
  src: [
    { path: './fonts/spacegrotesk-vietnamese.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/spacegrotesk-latin-ext.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/spacegrotesk-latin.woff2', weight: '400 700', style: 'normal' },
  ],
  variable: '--font-display-base',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'HOMIX — Nền tảng bất động sản cao cấp',
    template: '%s',
  },
  description:
    'HOMIX — nền tảng bất động sản cao cấp: mua, thuê dài hạn và lưu trú ngắn ngày trong một trải nghiệm tinh tế.',
  openGraph: {
    siteName: 'HOMIX',
    type: 'website',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`bg-background ${sans.variable} ${geistMono.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* No-flash: đặt class theme trước khi paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
