// Hằng số & kiểu cho lớp xác thực. Dữ liệu người dùng thật nằm ở DB (Prisma);
// đăng nhập đi qua /api/auth/*. User/Role dùng chung hợp đồng ở types/index.ts.

import type { Role, User } from '@/types'

export type { Role, User }

/** Route đích tương ứng với từng vai trò sau khi đăng nhập. */
export const ROLE_HOME: Record<Role, string> = {
  customer: '/',
  host: '/host',
  agent: '/agent',
  admin: '/admin',
}

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Khách hàng',
  host: 'Chủ nhà',
  agent: 'Vận hành',
  admin: 'Quản trị',
}

// Mật khẩu dùng chung cho toàn bộ tài khoản demo (seed DB + gợi ý ở màn login).
// TODO: khi mở đăng ký thật, bỏ hằng này và cho user tự đặt mật khẩu.
export const DEMO_PASSWORD = '123456'
