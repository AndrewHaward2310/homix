import type { User } from '@/types'

// TODO: thay mock bằng fetch API backend của tôi (GET /api/users, /api/me...).
// Danh sách người dùng mẫu — khớp với các tài khoản demo ở lib/auth.

export const mockUsers: User[] = [
  {
    id: 'u_customer',
    name: 'Nguyễn Thu Hà',
    email: 'khach@oceanpark.vn',
    role: 'customer',
    avatarUrl: '/images/avatar-customer.png',
    phone: '0901 234 567',
    preferredLocale: 'vi',
  },
  {
    id: 'u_customer_2',
    name: 'Minjun Park',
    email: 'minjun.park@example.com',
    role: 'customer',
    avatarUrl: '/images/avatar-customer.png',
    phone: '+82 10 5555 1234',
    preferredLocale: 'ko',
  },
  {
    id: 'u_host',
    name: 'Trần Quốc Anh',
    email: 'chunha@oceanpark.vn',
    role: 'host',
    avatarUrl: '/images/avatar-host.png',
    phone: '0912 888 777',
    preferredLocale: 'vi',
  },
  {
    id: 'u_host_2',
    name: 'Phạm Hải Yến',
    email: 'yen.host@oceanpark.vn',
    role: 'host',
    avatarUrl: '/images/avatar-host.png',
    phone: '0938 111 222',
    preferredLocale: 'vi',
  },
  {
    id: 'u_agent',
    name: 'Lê Minh Châu',
    email: 'sale@oceanpark.vn',
    role: 'agent',
    avatarUrl: '/images/avatar-agent.png',
    phone: '0977 333 444',
    preferredLocale: 'vi',
  },
]

/** Tra cứu nhanh người dùng theo id. */
export const mockUsersById: Record<string, User> = Object.fromEntries(
  mockUsers.map((u) => [u.id, u]),
)
