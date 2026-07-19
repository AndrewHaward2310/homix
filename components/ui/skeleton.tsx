import { cn } from '@/lib/utils'

/**
 * Skeleton — khối giữ chỗ khi tải, dùng shimmer (`.skeleton` trong globals.css,
 * tự tắt khi prefers-reduced-motion). Bo góc theo token control (rounded-lg).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />
}

/**
 * Khớp CHÍNH XÁC layout của <PropertyCard/>: ảnh 4:3 rounded-2xl, tiêu đề 2 dòng,
 * dòng tòa/rating, dòng giá riêng, 2 thông số — để lúc tải không bị "nhảy layout".
 */
export function PropertyCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div className="px-1 pt-4">
        {/* tiêu đề 2 dòng */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        {/* tòa + rating */}
        <Skeleton className="mt-2.5 h-3 w-1/3" />
        {/* giá */}
        <Skeleton className="mt-3 h-5 w-24" />
        {/* 2 thông số */}
        <div className="mt-2.5 flex items-center gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  )
}

/** Lưới skeleton cho danh sách căn — dùng chung trang chủ & tìm kiếm. */
export function PropertyGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}
