import type { Lead } from '@/types'

// TODO: thay mock bằng fetch API backend của tôi (GET /api/leads).
// Khách hàng tiềm năng do chuyên viên (agent) phụ trách.

export const mockLeads: Lead[] = [
  {
    id: 'ld_1',
    customerName: 'Đỗ Thanh Bình',
    contact: '0905 678 123',
    needSummary: 'Tìm căn 2PN view hồ để ở, ngân sách ~3,5 tỷ, cần bàn giao nội thất.',
    stage: 'consulting',
    assignedAgentId: 'u_agent',
    matchedPropertyIds: ['p_1'],
  },
  {
    id: 'ld_2',
    customerName: 'Sarah Nguyen',
    contact: 'sarah.n@example.com',
    needSummary: 'Investor from Singapore, wants studio for long-term rental yield.',
    stage: 'new',
    assignedAgentId: 'u_agent',
    matchedPropertyIds: ['p_2', 'p_5'],
  },
  {
    id: 'ld_3',
    customerName: 'Vũ Đình Khang',
    contact: '0988 222 010',
    needSummary: 'Gia đình 5 người, quan tâm biệt thự ven hồ, có thể xuống tiền trong tháng.',
    stage: 'closed',
    assignedAgentId: 'u_agent',
    matchedPropertyIds: ['p_4'],
  },
  {
    id: 'ld_4',
    customerName: 'Lương Mỹ Linh',
    contact: '0909 456 789',
    needSummary: 'Thuê dài hạn căn 3PN gần trường quốc tế cho con, ngân sách 18-20tr/tháng.',
    stage: 'consulting',
    assignedAgentId: 'u_agent',
    matchedPropertyIds: ['p_5'],
  },
]
