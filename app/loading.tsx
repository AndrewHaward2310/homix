import { BrandLoader } from '@/components/luxury/brand-loader'

// Loading UI toàn cục — hiện khi route đang tải (Suspense của App Router).
export default function Loading() {
  return <BrandLoader />
}
