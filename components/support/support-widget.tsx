'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Headset, ChevronDown, Send, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { sendSupportMessage } from '@/services/supportService'
import { cn } from '@/lib/utils'

const FAQ_KEYS = ['booking', 'cancel', 'viewing', 'payment'] as const
// Khu vực nhân viên / xác thực — KHÔNG hiện widget hỗ trợ khách ở đây.
const HIDDEN_PREFIXES = ['/agent', '/host', '/admin', '/login', '/403', '/account']
// Liên hệ tối thiểu hợp lệ: email hoặc số điện thoại (≥8 chữ số).
const CONTACT_RE = /^([^@\s]+@[^@\s]+\.[^@\s]+|\+?[\d\s().-]{8,})$/

/**
 * SupportWidget — nút hỗ trợ nổi (góc phải dưới) + panel: FAQ trả lời ngay (accordion)
 * và form "để lại lời nhắn" tạo lead cho chuyên viên chăm sóc. Hiện thực hoá cam kết
 * "Hỗ trợ 24/7". Popover không chặn trang; Escape / click ngoài để đóng. Ẩn ở portal.
 */
export function SupportWidget() {
  const t = useT()
  const pathname = usePathname()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'faq' | 'form'>('faq')
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // form
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const submitLock = useRef(false)

  // Đóng: Escape + click ra ngoài; đưa focus vào panel khi mở, trả về FAB khi đóng.
  useEffect(() => {
    if (!open) return
    // focus phần tử đầu trong panel cho người dùng bàn phím
    const firstBtn = panelRef.current?.querySelector<HTMLElement>('button, input, textarea')
    firstBtn?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !fabRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    fabRef.current?.focus()
    // Reset màn "đã gửi"/lỗi để lần mở sau không thấy trạng thái cũ.
    setSent(false)
    setErr('')
    setTab('faq')
  }

  const submit = async () => {
    if (submitLock.current) return
    submitLock.current = true
    setSending(true)
    setErr('')
    try {
      const res = await sendSupportMessage({ name, contact, message, company })
      if (res.ok) {
        setSent(true)
        setName('')
        setContact('')
        setMessage('')
      } else {
        setErr(res.error)
      }
    } finally {
      setSending(false)
      submitLock.current = false
    }
  }

  const canSend = name.trim() !== '' && CONTACT_RE.test(contact.trim()) && message.trim() !== ''
  const field =
    'w-full rounded-xl border border-border bg-background px-3 py-2 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30'

  // Không hiện ở khu nhân viên / trang đăng nhập.
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  // Trang chi tiết BĐS có thanh CTA "đặt lịch" dính đáy ở mobile → nâng FAB/panel lên
  // trên thanh đó (chỉ mobile; từ lg trở lên thanh CTA ẩn nên trả về vị trí thường).
  const lifted = pathname.startsWith('/property/')

  return (
    <>
      {/* Nút nổi — z thấp hơn lightbox/modal (z-100+) để không đè trải nghiệm xem ảnh */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={t('support.title')}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'fixed right-5 z-[80] grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-luxury-lg transition hover:brightness-110 active:scale-95',
          lifted ? 'bottom-24 lg:bottom-5' : 'bottom-5',
          open && 'rotate-90',
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && (
          <span className="absolute right-1 top-1 size-3 rounded-full bg-emerald-400 ring-2 ring-primary" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t('support.title')}
          className={cn(
            'fixed right-5 z-[80] flex max-h-[calc(100dvh-8rem)] w-[min(92vw,23rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-luxury-lg',
            lifted ? 'bottom-40 lg:bottom-24' : 'bottom-24',
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary p-4 text-primary-foreground">
            <span className="grid size-9 place-items-center rounded-full bg-white/15">
              <Headset className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[0.95rem] font-bold leading-tight">{t('support.title')}</div>
              <div className="flex items-center gap-1.5 font-sans text-[0.75rem] text-white/80">
                <span className="size-2 rounded-full bg-emerald-400" />
                {t('support.online')}
              </div>
            </div>
            <button
              type="button"
              aria-label={t('locator.close')}
              onClick={close}
              className="grid size-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'faq' ? (
              <>
                <p className="font-sans text-[0.8125rem] text-muted-foreground">{t('support.intro')}</p>
                <ul className="mt-3 space-y-2">
                  {FAQ_KEYS.map((k) => {
                    const on = openFaq === k
                    return (
                      <li key={k} className="rounded-xl border border-border">
                        <button
                          type="button"
                          aria-expanded={on}
                          onClick={() => setOpenFaq(on ? null : k)}
                          className="flex w-full items-center justify-between gap-2 p-3 text-left font-sans text-[0.875rem] font-semibold text-foreground"
                        >
                          {t(`support.faq.${k}.q`)}
                          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition', on && 'rotate-180')} />
                        </button>
                        {on && (
                          <p className="border-t border-border p-3 font-sans text-[0.8125rem] leading-relaxed text-muted-foreground">
                            {t(`support.faq.${k}.a`)}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : sent ? (
              <div className="grid place-items-center gap-3 py-8 text-center">
                <CheckCircle2 className="size-12 text-emerald-500" />
                <div className="font-sans text-[0.95rem] font-bold text-foreground">{t('support.sentTitle')}</div>
                <p className="max-w-[16rem] font-sans text-[0.8125rem] text-muted-foreground">{t('support.sentHint')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                    setTab('faq')
                  }}
                  className="mt-1 font-sans text-[0.8125rem] font-semibold text-brand underline underline-offset-2"
                >
                  {t('support.backToFaq')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setTab('faq')}
                  className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> {t('support.backToFaq')}
                </button>
                <input
                  className={field}
                  aria-label={t('support.name')}
                  name="name"
                  autoComplete="name"
                  placeholder={t('support.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className={field}
                  aria-label={t('support.contact')}
                  name="contact"
                  inputMode="text"
                  autoComplete="email"
                  placeholder={t('support.contact')}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
                <textarea
                  className={cn(field, 'min-h-[88px] resize-none')}
                  aria-label={t('support.message')}
                  name="message"
                  placeholder={t('support.message')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {/* Honeypot — ẩn khỏi người thật & trình đọc màn hình; bot điền → bị chặn */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] size-px opacity-0"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
                {err && <p className="font-sans text-[0.8125rem] text-red-600">{err}</p>}
                <button
                  type="button"
                  disabled={!canSend || sending}
                  onClick={submit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-4" /> {sending ? t('support.sending') : t('support.send')}
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA: chuyển sang form */}
          {tab === 'faq' && (
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => setTab('form')}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 font-sans text-[0.875rem] font-semibold text-foreground transition hover:bg-secondary"
              >
                <MessageCircle className="size-4" /> {t('support.leaveMessage')}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
