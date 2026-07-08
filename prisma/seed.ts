// Seed DB từ đúng dữ liệu mock hiện có (data/mock/*) để demo không mất dữ liệu.
// Mật khẩu mọi tài khoản: 123456 (hash bằng bcrypt). Chạy: pnpm db:seed.
// Idempotent: dùng upsert nên chạy lại nhiều lần vẫn an toàn.

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { mockUsers } from '@/data/mock/users'
import { mockTowers } from '@/data/mock/towers'
import { mockProperties } from '@/data/mock/properties'
import { mockBookings } from '@/data/mock/bookings'
import { mockLeads } from '@/data/mock/leads'
import { mockPerks } from '@/data/mock/perks'
import { DEMO_PASSWORD } from '@/lib/auth/types'

const prisma = new PrismaClient()

// Metadata định vị masterplan (trước ở MASTERPLAN_META trong propertyService.ts),
// nay nạp vào bảng Tower. Khớp theo id tòa.
const MASTERPLAN_META: Record<
  string,
  { lng: number; lat: number; bMin: number; bMax: number; amenities: string[] }
> = {
  // Toạ độ đặt theo centroid các zone POI thật của OCP1 (Hải Đăng/Đại Dương/Sao Biển/Ngọc Trai/Hải Âu).
  tw_s1: { lng: 105.9439, lat: 20.9944, bMin: 1, bMax: 3, amenities: ['lake_view', 'pool', 'gym'] },
  tw_s2: { lng: 105.9402, lat: 20.9936, bMin: 1, bMax: 2, amenities: ['park_view', 'gym', 'parking'] },
  tw_r1: { lng: 105.9539, lat: 20.9957, bMin: 2, bMax: 3, amenities: ['lake_view', 'pool', 'smart_home'] },
  tw_d1: { lng: 105.9502, lat: 20.9944, bMin: 2, bMax: 4, amenities: ['lake_view', 'concierge', 'smart_home'] },
  tw_k1: { lng: 105.9547, lat: 20.9898, bMin: 4, bMax: 5, amenities: ['private_pool', 'marina', 'garden'] },
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  // Users
  for (const u of mockUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        phone: u.phone ?? null,
        preferredLocale: u.preferredLocale,
        passwordHash,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        phone: u.phone ?? null,
        preferredLocale: u.preferredLocale,
        passwordHash,
      },
    })
  }

  // Agent demo: chức năng "both" (thấy cả tab Sales + Care).
  await prisma.user.update({ where: { id: 'u_agent' }, data: { agentFunction: 'both' } })

  // Admin demo.
  const adminData = {
    name: 'Phan Quản Trị',
    email: 'admin@homix.vn',
    role: 'admin' as const,
    avatarUrl: '/images/avatar-agent.png',
    phone: '0900 000 000',
    preferredLocale: 'vi',
    passwordHash,
  }
  await prisma.user.upsert({ where: { id: 'u_admin' }, update: adminData, create: { id: 'u_admin', ...adminData } })

  // Towers (+ metadata masterplan)
  for (const t of mockTowers) {
    const m = MASTERPLAN_META[t.id]
    const data = {
      name: t.name,
      lat: t.coords[0],
      lng: t.coords[1],
      priceFromVnd: BigInt(t.priceFromVnd),
      status: t.status,
      image: t.image,
      mapLng: m?.lng ?? null,
      mapLat: m?.lat ?? null,
      bedroomsMin: m?.bMin ?? null,
      bedroomsMax: m?.bMax ?? null,
      amenities: m?.amenities ?? [],
    }
    await prisma.tower.upsert({ where: { id: t.id }, update: data, create: { id: t.id, ...data } })
  }

  // Properties
  for (const p of mockProperties) {
    const data = {
      code: p.code,
      title: p.title,
      description: p.description,
      type: p.type,
      areaM2: p.areaM2,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      priceVnd: BigInt(p.priceVnd),
      images: p.images,
      amenities: p.amenities,
      status: p.status,
      towerId: p.towerId,
      hostId: p.hostId,
      // Đa số tin đã kiểm duyệt; để p_4 chưa xác minh cho đa dạng badge.
      verified: p.id !== 'p_4',
    }
    await prisma.property.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } })
  }

  // Reviews mẫu (chỉ khách đã ở mới đánh giá) + denormalize ratingAvg/reviewCount.
  const REVIEWS: { propertyId: string; customerId: string; rating: number; comment: string }[] = [
    { propertyId: 'p_1', customerId: 'u_customer', rating: 5, comment: 'Căn góc thoáng, view hồ tuyệt đẹp, nội thất bàn giao cao cấp. Rất đáng tiền.' },
    { propertyId: 'p_1', customerId: 'u_customer_2', rating: 4, comment: 'Vị trí đẹp, gần tiện ích. Buổi tối hơi ồn một chút nhưng tổng thể hài lòng.' },
    { propertyId: 'p_3', customerId: 'u_customer', rating: 5, comment: 'Nghỉ dưỡng cuối tuần lý tưởng, check-in tự động rất tiện, giường êm.' },
    { propertyId: 'p_3', customerId: 'u_customer_2', rating: 5, comment: 'View hoàng hôn trên hồ đỉnh cao. Sẽ quay lại!' },
    { propertyId: 'p_6', customerId: 'u_customer', rating: 4, comment: 'Gần bãi tắm và khu BBQ, nhóm bạn mình chơi rất vui. Bếp đầy đủ.' },
    { propertyId: 'p_7', customerId: 'u_customer_2', rating: 5, comment: 'Penthouse sang trọng, tầm nhìn panorama không góc chết.' },
    { propertyId: 'p_2', customerId: 'u_customer', rating: 4, comment: 'Studio bố trí thông minh, hợp người độc thân. Ánh sáng tốt.' },
  ]
  // Xoá review cũ để seed idempotent (id review là cuid ngẫu nhiên).
  await prisma.review.deleteMany({})
  for (const rv of REVIEWS) {
    await prisma.review.create({ data: rv })
  }
  // Tính lại ratingAvg + reviewCount cho từng property.
  const grouped = await prisma.review.groupBy({
    by: ['propertyId'],
    _avg: { rating: true },
    _count: { _all: true },
  })
  for (const g of grouped) {
    await prisma.property.update({
      where: { id: g.propertyId },
      data: {
        ratingAvg: g._avg.rating ? Math.round(g._avg.rating * 10) / 10 : null,
        reviewCount: g._count._all,
      },
    })
  }

  // Perks
  for (const pk of mockPerks) {
    const data = { name: pk.name, priceVnd: BigInt(pk.priceVnd), category: pk.category }
    await prisma.perk.upsert({ where: { id: pk.id }, update: data, create: { id: pk.id, ...data } })
  }

  // Bookings (id cố định từ mock để idempotent)
  for (const b of mockBookings) {
    const data = {
      propertyId: b.propertyId,
      customerId: b.customerId,
      type: b.type,
      checkIn: b.checkIn ?? null,
      checkOut: b.checkOut ?? null,
      viewingAt: b.viewingAt ?? null,
      status: b.status,
      totalVnd: BigInt(b.totalVnd),
      createdAt: new Date(b.createdAt),
    }
    await prisma.booking.upsert({ where: { id: b.id }, update: data, create: { id: b.id, ...data } })
  }

  // Leads (id cố định từ mock để idempotent)
  for (const l of mockLeads) {
    const data = {
      customerName: l.customerName,
      contact: l.contact,
      needSummary: l.needSummary,
      stage: l.stage,
      assignedAgentId: l.assignedAgentId,
      matchedPropertyIds: l.matchedPropertyIds,
    }
    await prisma.lead.upsert({ where: { id: l.id }, update: data, create: { id: l.id, ...data } })
  }

  const counts = {
    users: await prisma.user.count(),
    towers: await prisma.tower.count(),
    properties: await prisma.property.count(),
    perks: await prisma.perk.count(),
    bookings: await prisma.booking.count(),
    leads: await prisma.lead.count(),
  }
  console.log('[seed] xong:', counts)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('[seed] lỗi:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
