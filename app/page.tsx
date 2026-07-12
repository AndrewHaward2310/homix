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

// Trang chủ — mặt tiền marketplace, PUBLIC (không yêu cầu đăng nhập).
export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar />
      <main>
        <HeroSection />
        {/* Tín hiệu tin cậy ngay dưới hero (số liệu thật + cam kết). */}
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
