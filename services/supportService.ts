// DOMIX HOME — Support (chatbox) service. Client → API.

export type SupportInput = {
  name: string
  contact: string
  message: string
  /** Honeypot chống bot — người thật luôn để trống. */
  company?: string
}

export type SupportResult = { ok: true } | { ok: false; error: string }

/** Gửi lời nhắn hỗ trợ từ chatbox — tạo lead cho chuyên viên chăm sóc. */
export async function sendSupportMessage(input: SupportInput): Promise<SupportResult> {
  try {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data.error ?? 'Gửi lời nhắn thất bại.' }
    return { ok: true }
  } catch {
    // Mất mạng / request bị huỷ — không để lỗi thoát ra làm kẹt nút gửi.
    return { ok: false, error: 'Không có kết nối. Vui lòng thử lại.' }
  }
}
