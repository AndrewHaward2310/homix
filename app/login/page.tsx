'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-context'
import { LanguageSwitcher } from '@/components/luxury/language-switcher'
import { LuxuryButton } from '@/components/luxury/luxury-button'
import { Logo } from '@/components/luxury/logo'
import { Body, Caption } from '@/components/luxury/typography'
import { useT } from '@/lib/i18n/provider'
import { DEMO_PASSWORD, ROLE_HOME } from '@/lib/auth/types'

const DEMO_HINTS = [
  { email: 'khach@oceanpark.vn', role: 'customer' as const },
  { email: 'chunha@oceanpark.vn', role: 'host' as const },
  { email: 'sale@oceanpark.vn', role: 'agent' as const },
]

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const { user, loading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Đã đăng nhập rồi thì đẩy thẳng về portal tương ứng.
  useEffect(() => {
    if (!loading && user) router.replace(ROLE_HOME[user.role])
  }, [loading, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    if (!result.ok) {
      // Hiển thị thông báo lỗi qua i18n (không dùng chuỗi cứng).
      setError('auth.invalidCredentials')
      setSubmitting(false)
    }
    // Nếu ok, AuthContext tự điều hướng theo role.
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 md:justify-end md:p-10 lg:p-16">
      {/* Ảnh lifestyle tràn viền + overlay tối nhẹ */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/lifestyle-1.png"
          alt="Không gian sống DOMIX HOME bên hồ lúc hoàng hôn"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/45 to-black/25"
          aria-hidden="true"
        />
      </div>

      {/* Chuyển ngôn ngữ — góc phải trên, tone sáng cho nền tối */}
      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <LanguageSwitcher tone="light" />
      </div>

      {/* Panel glassmorphism */}
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
        <Logo tone="light" />

        <h1 className="mt-8 text-balance font-sans text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-white">
          {t('auth.welcomeBack')}
        </h1>
        <Body className="mt-3 text-white/70">{t('auth.loginSubtitle')}</Body>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-sans text-sm font-medium text-white/90">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="h-12 rounded-2xl border border-white/25 bg-white/10 px-4 font-sans text-[0.95rem] text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-white/60 focus:bg-white/15 focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-sans text-sm font-medium text-white/90">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="h-12 rounded-2xl border border-white/25 bg-white/10 px-4 font-sans text-[0.95rem] text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-white/60 focus:bg-white/15 focus:ring-2 focus:ring-white/30"
            />
          </div>

          {error && (
            <p role="alert" className="font-sans text-sm text-red-300">
              {t(error)}
            </p>
          )}

          <LuxuryButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className="mt-2 w-full"
          >
            {submitting ? t('auth.loggingIn') : t('auth.login')}
          </LuxuryButton>

          <button
            type="button"
            className="mx-auto mt-1 font-sans text-sm text-white/50 transition-colors duration-300 hover:text-white/80"
          >
            {t('auth.forgotPassword')}
          </button>
        </form>

        {/* Gợi ý tài khoản demo */}
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4">
          <Caption className="text-white/60">
            {t('auth.demoTitle')}{' '}
            <span className="font-mono text-white/80">{DEMO_PASSWORD}</span>
          </Caption>
          <ul className="mt-3 flex flex-col gap-2">
            {DEMO_HINTS.map((hint) => (
              <li key={hint.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(hint.email)
                    setPassword(DEMO_PASSWORD)
                    setError(null)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-300 hover:bg-white/10"
                >
                  <span className="font-mono text-[0.8125rem] text-white/85">{hint.email}</span>
                  <span className="rounded-full border border-white/20 px-2.5 py-0.5 font-sans text-[0.6875rem] uppercase tracking-[0.12em] text-white/70">
                    {t(`role.${hint.role}`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
