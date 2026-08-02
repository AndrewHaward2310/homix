'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { LocaleCode } from '@/types'
import viMessages from '@/locales/vi.json'
import enMessages from '@/locales/en.json'
import {
  DEFAULT_LOCALE,
  getIntlLocale,
  isSupportedLocale,
  LOCALE_STORAGE_KEY,
} from './config'

// ============================================================================
// Ocean Park — LanguageProvider (i18n gọn nhẹ, không phụ thuộc next-intl)
// - Locale JSON được nạp ĐỘNG theo mã: thêm locales/<mã>.json + mục trong
//   LOCALES là chạy, KHÔNG cần sửa provider hay component.
// - vi.json được bundle sẵn làm bản khởi tạo => không nháy chữ ở lần vẽ đầu.
// ============================================================================

type Messages = Record<string, string>

/** Tham số nội suy: t("greeting", { name: "An" }) -> "Xin chào {name}". */
type TParams = Record<string, string | number>

type I18nContextValue = {
  locale: LocaleCode
  setLocale: (next: LocaleCode) => void
  t: (key: string, params?: TParams) => string
  /** Định dạng số tiền theo locale hiện tại. */
  formatCurrency: (amount: number, currency?: string) => string
  /** Định dạng ngày theo locale hiện tại. */
  formatDate: (date: string | number | Date, opts?: Intl.DateTimeFormatOptions) => string
  ready: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

// Cache các gói ngôn ngữ đã nạp để không import lại.
const MESSAGE_CACHE: Partial<Record<LocaleCode, Messages>> = {
  vi: viMessages as Messages,
  en: enMessages as Messages,
}

/** Gói tiếng Anh bundle sẵn làm fallback cho locale dịch chưa đủ. */
const EN_FALLBACK = enMessages as Messages

async function loadMessages(locale: LocaleCode): Promise<Messages> {
  if (MESSAGE_CACHE[locale]) return MESSAGE_CACHE[locale] as Messages
  // Import động: webpack tạo context cho toàn bộ /locales, nên chỉ cần
  // thả thêm file JSON là tự nhận diện.
  const mod = await import(`@/locales/${locale}.json`)
  const messages = (mod.default ?? mod) as Messages
  MESSAGE_CACHE[locale] = messages
  return messages
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  )
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<Messages>(MESSAGE_CACHE.vi as Messages)
  const [ready, setReady] = useState(false)

  // Khôi phục ngôn ngữ đã chọn từ localStorage khi tải trang.
  // TODO: đồng bộ locale với tài khoản qua API khi ghép backend.
  useEffect(() => {
    let active = true
    let initial = DEFAULT_LOCALE
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      if (saved && isSupportedLocale(saved)) initial = saved
    } catch {
      // ignore
    }

    loadMessages(initial)
      .then((msgs) => {
        if (!active) return
        setMessages(msgs)
        setLocaleState(initial)
        document.documentElement.lang = initial
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  const setLocale = useCallback((next: LocaleCode) => {
    loadMessages(next).then((msgs) => {
      setMessages(msgs)
      setLocaleState(next)
      document.documentElement.lang = next
      // TODO: đồng bộ locale với tài khoản qua API khi ghép backend.
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
      } catch {
        // ignore
      }
    })
  }, [])

  const t = useCallback(
    (key: string, params?: TParams) => {
      // Chuỗi chưa dịch ở locale hiện tại → rơi về TIẾNG ANH (rồi mới tới key thô).
      // Nhờ vậy thêm ngôn ngữ dịch DẦN vẫn hiển thị mượt, không lộ key như "nav.rent".
      const value = messages[key] ?? (EN_FALLBACK[key] as string | undefined)
      if (value == null) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[v0] i18n: thiếu key "${key}" cho locale "${locale}"`)
        }
        return key
      }
      return interpolate(value, params)
    },
    [messages, locale],
  )

  const formatCurrency = useCallback(
    (amount: number, currency = 'VND') =>
      new Intl.NumberFormat(getIntlLocale(locale), {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    [locale],
  )

  const formatDate = useCallback(
    (date: string | number | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(getIntlLocale(locale), opts ?? { dateStyle: 'medium' }).format(
        new Date(date),
      ),
    [locale],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, formatCurrency, formatDate, ready }),
    [locale, setLocale, t, formatCurrency, formatDate, ready],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n/useT phải nằm trong <LanguageProvider>.')
  return ctx
}

/** Hook chính để lấy chữ giao diện: const t = useT(); t("nav.rent"). */
export function useT() {
  return useI18n().t
}

/** Hook đầy đủ: locale, setLocale, t, formatCurrency, formatDate. */
export function useLocale() {
  return useI18n()
}
