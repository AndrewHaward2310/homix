/**
 * Template — re-mount mỗi lần điều hướng, cho hiệu ứng mờ dần vào trang.
 * Chỉ opacity (xem globals.css: transform sẽ phá navbar fixed). Tôn trọng
 * prefers-reduced-motion (animate-page-enter tự tắt).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>
}
