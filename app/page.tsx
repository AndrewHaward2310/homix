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
import { WaveDivider } from '@/components/luxury/wave-divider'
import { SiteFooter } from '@/components/home/site-footer'
import { getHeroFeaturedServer, getHeroStatsServer } from '@/lib/server/home'

/**
 * Trang chủ được prerender lúc build. Đặt `revalidate` để trang TỰ LÀM MỚI định kỳ:
 * nếu lúc build DB chưa với tới được (số liệu về 0), lần regenerate sau sẽ tự đúng
 * mà không cần deploy lại. Đồng thời số liệu/căn nổi bật luôn tươi.
 */
export const revalidate = 300

// Trang chủ — mặt tiền marketplace, PUBLIC (không yêu cầu đăng nhập).
export default async function Page() {
  // Lấy ở SERVER để ảnh hero vào HTML đầu (LCP) và khối số liệu không nhảy (CLS).
  const [featured, stats] = await Promise.all([getHeroFeaturedServer(), getHeroStatsServer()])

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main id="main-content">
        <HeroSection featured={featured} stats={stats} />
        {/* Dải cam kết dịch vụ (số liệu đã nằm ở hero). */}
        <TrustStrip />
        {/* Thấy căn trước (thắng nhanh) → rồi mới tới bối cảnh vị trí/bản đồ.
            Nhịp nền sáng/tối xen kẽ + divider sóng để trang bớt "một mạch". */}
        <FeaturedPropertiesSection />
        {/* Khối tinted liền: Combo · Vừa xem · Vị trí (bền vững kể cả khi Vừa-xem rỗng) */}
        <WaveDivider variant="to-tinted" />
        <TripCombosSection />
        <RecentlyViewed />
        <BuildingLocatorSection />
        <WaveDivider variant="to-ground" />
        <LifestyleSection />
        <WaveDivider variant="to-tinted" />
        {/* Khối tinted liền: Đánh giá · Đặc quyền */}
        <TestimonialsSection />
        <PerksSection />
      </main>
      <SiteFooter />
    </div>
  )
}
