// Map model Prisma -> hợp đồng dữ liệu ở types/index.ts.
// Mục đích: không để type Prisma (BigInt, Json...) rò rỉ ra API. Mọi Route Handler
// phải serialize qua đây để response luôn khớp shape frontend đang dùng.

import type {
  Booking as PrismaBooking,
  Favorite as PrismaFavorite,
  Lead as PrismaLead,
  Perk as PrismaPerk,
  Property as PrismaProperty,
  Review as PrismaReview,
  Tower as PrismaTower,
  User as PrismaUser,
} from '@prisma/client'
import type {
  Booking,
  BookingPerk,
  Favorite,
  Lead,
  LocaleCode,
  LocalizedText,
  Perk,
  Property,
  Review,
  Tower,
  User,
} from '@/types'

// VND tối đa ~4.2e10, nằm trong khoảng an toàn của Number (< 2^53) nên convert thẳng.
const toNum = (v: bigint): number => Number(v)

export function toUser(u: PrismaUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    phone: u.phone ?? undefined,
    preferredLocale: u.preferredLocale as LocaleCode,
    agentFunction: u.agentFunction ?? undefined,
  }
}

export function toTower(t: PrismaTower): Tower {
  return {
    id: t.id,
    name: t.name,
    coords: [t.lat, t.lng],
    priceFromVnd: toNum(t.priceFromVnd),
    status: t.status,
    image: t.image,
  }
}

export function toProperty(p: PrismaProperty): Property {
  return {
    id: p.id,
    code: p.code,
    title: p.title as LocalizedText,
    description: p.description as LocalizedText,
    type: p.type,
    towerId: p.towerId,
    areaM2: p.areaM2,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    priceVnd: toNum(p.priceVnd),
    images: p.images,
    amenities: p.amenities,
    status: p.status,
    hostId: p.hostId,
    verified: p.verified,
    ratingAvg: p.ratingAvg ?? undefined,
    reviewCount: p.reviewCount,
    viewCount: p.viewCount,
  }
}

export function toFavorite(f: PrismaFavorite): Favorite {
  return {
    id: f.id,
    userId: f.userId,
    propertyId: f.propertyId,
    createdAt: f.createdAt.toISOString(),
  }
}

/** Review kèm tên/avatar khách (join User). */
export function toReview(r: PrismaReview & { customer?: PrismaUser | null }): Review {
  return {
    id: r.id,
    propertyId: r.propertyId,
    customerId: r.customerId,
    customerName: r.customer?.name ?? 'Khách',
    avatarUrl: r.customer?.avatarUrl ?? undefined,
    rating: r.rating,
    comment: r.comment,
    images: r.images ?? [],
    createdAt: r.createdAt.toISOString(),
  }
}

export function toBooking(b: PrismaBooking): Booking {
  return {
    id: b.id,
    propertyId: b.propertyId,
    customerId: b.customerId,
    type: b.type,
    checkIn: b.checkIn ?? undefined,
    checkOut: b.checkOut ?? undefined,
    viewingAt: b.viewingAt ?? undefined,
    status: b.status,
    perks: toBookingPerks(b.perks),
    totalVnd: toNum(b.totalVnd),
    createdAt: b.createdAt.toISOString(),
  }
}

/** Đọc snapshot perks (JSONB) về mảng BookingPerk, bỏ qua dữ liệu cũ/không hợp lệ. */
function toBookingPerks(raw: PrismaBooking['perks']): BookingPerk[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: BookingPerk[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    if (typeof r.perkId !== 'string' || typeof r.qty !== 'number') continue
    out.push({
      perkId: r.perkId,
      qty: r.qty,
      priceVnd: typeof r.priceVnd === 'number' ? r.priceVnd : toNum(r.priceVnd as never),
      name: (r.name ?? {}) as LocalizedText,
    })
  }
  return out.length ? out : undefined
}

export function toLead(l: PrismaLead): Lead {
  return {
    id: l.id,
    customerName: l.customerName,
    contact: l.contact,
    needSummary: l.needSummary,
    stage: l.stage,
    assignedAgentId: l.assignedAgentId,
    matchedPropertyIds: l.matchedPropertyIds,
  }
}

export function toPerk(p: PrismaPerk): Perk {
  return {
    id: p.id,
    name: p.name as LocalizedText,
    priceVnd: toNum(p.priceVnd),
    category: p.category,
  }
}
