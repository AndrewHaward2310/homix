import Image from 'next/image'
import { cn } from '@/lib/utils'

export type Property = {
  id: string
  name: string
  location: string
  price: string
  area: string
  bedrooms: number
  image: string
  tag?: string
}

type PropertyCardProps = {
  property: Property
  className?: string
  priority?: boolean
}

/**
 * PropertyCard — ảnh tràn 4:5 ở trên, thông tin tối giản bên dưới.
 * KHÔNG viền cứng: dùng khoảng trắng + ảnh làm chủ đạo.
 */
export function PropertyCard({ property, className, priority }: PropertyCardProps) {
  return (
    <a
      href="#can-ho"
      className={cn(
        'group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className,
      )}
    >
      {/* Ảnh tràn viền 4:5 */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary">
        <Image
          src={property.image || '/placeholder.svg'}
          alt={`Căn hộ ${property.name} tại ${property.location}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />
        {property.tag ? (
          <span className="absolute left-4 top-4 rounded-full border border-glass-border bg-glass px-3 py-1 font-sans text-[0.75rem] font-medium text-foreground backdrop-blur-xl">
            {property.tag}
          </span>
        ) : null}
      </div>

      {/* Thông tin tối giản */}
      <div className="px-1 pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-sans text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">
            {property.name}
          </h3>
          <span className="shrink-0 font-sans text-[1.0625rem] font-semibold text-brand">
            {property.price}
          </span>
        </div>

        <p className="mt-1 font-sans text-[0.95rem] text-muted-foreground">
          {property.location}
        </p>

        <div className="mt-4 flex items-center gap-5 font-sans text-[0.875rem] text-muted-foreground">
          <span>{property.area}</span>
          <span aria-hidden="true" className="size-1 rounded-full bg-border" />
          <span>{property.bedrooms} phòng ngủ</span>
        </div>
      </div>
    </a>
  )
}
