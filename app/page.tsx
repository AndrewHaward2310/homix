import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { HeroSection } from '@/components/home/hero-section'
import { BuildingLocatorSection } from '@/components/home/building-locator-section'
import { FeaturedPropertiesSection } from '@/components/home/featured-properties-section'
import { TripCombosSection } from '@/components/home/trip-combos-section'
import { TrustStrip } from '@/components/home/trust-strip'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { LifestyleSection } from '@/components/home/lifestyle-section'
import { PerksSection } from '@/components/home/perks-section'
import { RecentlyViewed } from '@/components/property/recently-viewed'
import { SiteFooter } from '@/components/home/site-footer'
import { getHeroFeaturedServer, getHeroStatsServer } from '@/lib/server/home'

// Trang chủ — mặt tiền marketplace, PUBLIC (không yêu cầu đăng nhập).
export default async function Page() {
  // Lấy ở SERVER để ảnh hero vào HTML đầu (LCP) và khối số liệu không nhảy (CLS).
  const [featured, stats] = await Promise.all([getHeroFeaturedServer(), getHeroStatsServer()])

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main>
        <HeroSection featured={featured} stats={stats} />
        {/* Dải cam kết dịch vụ (số liệu đã nằm ở hero). */}
        <TrustStrip />
        {/* Thấy căn trước (thắng nhanh) → rồi mới tới bối cảnh vị trí/bản đồ. */}
        <FeaturedPropertiesSection />
        <TripCombosSection />
        <RecentlyViewed />
        <BuildingLocatorSection />
        <LifestyleSection />
        <TestimonialsSection />
        <PerksSection />
      </main>
      <SiteFooter />
    </div>
  )
}
