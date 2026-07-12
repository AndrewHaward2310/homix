// Dịch vụ dữ liệu trang chủ: số liệu tổng quan + đánh giá tiêu biểu.
import type { Review, LocalizedText } from '@/types'

export type HomeStats = {
  properties: number
  verified: number
  towers: number
  hosts: number
  reviews: number
}

export type FeaturedReview = Review & { propertyTitle: LocalizedText }

export async function getHomeStats(): Promise<HomeStats> {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error(`GET /api/stats thất bại (${res.status})`)
  return ((await res.json()) as { stats: HomeStats }).stats
}

export async function getFeaturedReviews(limit = 9): Promise<FeaturedReview[]> {
  const res = await fetch(`/api/reviews?limit=${limit}`)
  if (!res.ok) throw new Error(`GET /api/reviews thất bại (${res.status})`)
  return ((await res.json()) as { reviews: FeaturedReview[] }).reviews
}

export const homeService = { getHomeStats, getFeaturedReviews }
