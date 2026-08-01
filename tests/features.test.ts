import { describe, it, expect, afterEach } from 'vitest'
import {
  isAnthropicEnabled,
  isEmailEnabled,
  isSmsEnabled,
  isPaymentEnabled,
  blogRssFeeds,
} from '@/lib/features'

// Các hàm này đọc process.env lúc GỌI → set/unset trong test rồi kiểm.
const KEYS = [
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM',
  'VNPAY_TMN_CODE',
  'VNPAY_HASH_SECRET',
  'BLOG_RSS_FEEDS',
]
const saved: Record<string, string | undefined> = {}
for (const k of KEYS) saved[k] = process.env[k]

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('feature flags (có key thì bật)', () => {
  it('mặc định (không key) → tất cả tắt', () => {
    for (const k of KEYS) delete process.env[k]
    expect(isAnthropicEnabled()).toBe(false)
    expect(isEmailEnabled()).toBe(false)
    expect(isSmsEnabled()).toBe(false)
    expect(isPaymentEnabled()).toBe(false)
    expect(blogRssFeeds()).toEqual([])
  })

  it('bật khi có key tương ứng', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-x'
    process.env.RESEND_API_KEY = 're_x'
    expect(isAnthropicEnabled()).toBe(true)
    expect(isEmailEnabled()).toBe(true)
  })

  it('SMS cần ĐỦ 3 biến Twilio', () => {
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_FROM
    process.env.TWILIO_ACCOUNT_SID = 'AC'
    expect(isSmsEnabled()).toBe(false) // thiếu 2 biến
    process.env.TWILIO_AUTH_TOKEN = 'tok'
    process.env.TWILIO_FROM = '+84900000000'
    expect(isSmsEnabled()).toBe(true)
  })

  it('payment cần cả TMN_CODE + HASH_SECRET', () => {
    delete process.env.VNPAY_TMN_CODE
    delete process.env.VNPAY_HASH_SECRET
    process.env.VNPAY_TMN_CODE = 'TMN'
    expect(isPaymentEnabled()).toBe(false)
    process.env.VNPAY_HASH_SECRET = 'secret'
    expect(isPaymentEnabled()).toBe(true)
  })

  it('blogRssFeeds tách theo dấu phẩy, bỏ khoảng trắng & mục rỗng', () => {
    process.env.BLOG_RSS_FEEDS = ' https://a.com/rss , ,https://b.com/feed '
    expect(blogRssFeeds()).toEqual(['https://a.com/rss', 'https://b.com/feed'])
  })
})
