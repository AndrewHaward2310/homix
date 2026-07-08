import type { LucideIcon } from 'lucide-react'
import {
  Eye,
  Trees,
  Waves,
  Dumbbell,
  SquareParking,
  Home,
  BellRing,
  Anchor,
  Flower2,
  KeyRound,
  Utensils,
  Wifi,
  Umbrella,
  Flame,
  GraduationCap,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

export type AmenityGroup = 'view' | 'comfort' | 'service' | 'outdoor' | 'nearby'

type AmenityMeta = { icon: LucideIcon; group: AmenityGroup }

/** Ánh xạ id tiện ích → icon + nhóm. Id lạ rơi vào 'comfort' + icon mặc định. */
export const AMENITY_META: Record<string, AmenityMeta> = {
  lake_view: { icon: Eye, group: 'view' },
  park_view: { icon: Trees, group: 'view' },
  pool: { icon: Waves, group: 'comfort' },
  private_pool: { icon: Waves, group: 'comfort' },
  gym: { icon: Dumbbell, group: 'comfort' },
  smart_home: { icon: Home, group: 'comfort' },
  kitchen: { icon: Utensils, group: 'comfort' },
  wifi: { icon: Wifi, group: 'comfort' },
  parking: { icon: SquareParking, group: 'service' },
  concierge: { icon: BellRing, group: 'service' },
  self_checkin: { icon: KeyRound, group: 'service' },
  garden: { icon: Flower2, group: 'outdoor' },
  marina: { icon: Anchor, group: 'outdoor' },
  bbq: { icon: Flame, group: 'outdoor' },
  beach_access: { icon: Umbrella, group: 'outdoor' },
  near_school: { icon: GraduationCap, group: 'nearby' },
  near_mall: { icon: ShoppingBag, group: 'nearby' },
}

export function amenityIcon(id: string): LucideIcon {
  return AMENITY_META[id]?.icon ?? Sparkles
}

export function amenityGroup(id: string): AmenityGroup {
  return AMENITY_META[id]?.group ?? 'comfort'
}

export const AMENITY_GROUP_ORDER: AmenityGroup[] = ['view', 'comfort', 'outdoor', 'service', 'nearby']

export const AMENITY_GROUP_LABEL: Record<AmenityGroup, { vi: string; en: string }> = {
  view: { vi: 'Tầm nhìn', en: 'Views' },
  comfort: { vi: 'Tiện nghi', en: 'Comfort' },
  outdoor: { vi: 'Ngoài trời', en: 'Outdoor' },
  service: { vi: 'Dịch vụ & an ninh', en: 'Services' },
  nearby: { vi: 'Xung quanh', en: 'Nearby' },
}
