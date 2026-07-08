'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Navigation } from 'lucide-react'
import {
  AMENITY_CATEGORY_META,
  getMasterplanTowers,
  MAP_STYLE_URL,
  POI_GEOJSON_URL,
  type AmenityCategory,
} from '@/services/propertyService'
import { useT } from '@/lib/i18n/provider'

type LngLat = [number, number]
type Poi = { name: string; cat: AmenityCategory; lngLat: LngLat; dist: number }

function haversine(a: LngLat, b: LngLat) {
  const R = 6371000
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)

/** Vị trí căn: mini-map + danh sách tiện ích gần nhất kèm khoảng cách. */
export function PropertyLocation({ towerId }: { towerId: string }) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [center, setCenter] = useState<LngLat | null>(null)
  const [pois, setPois] = useState<Poi[]>([])

  // Toạ độ căn = toạ độ toà; tính POI gần nhất.
  useEffect(() => {
    let active = true
    Promise.all([
      getMasterplanTowers(),
      fetch(POI_GEOJSON_URL).then((r) => r.json()),
    ]).then(([towers, fc]) => {
      if (!active) return
      const tw = towers.find((x) => x.id === towerId)
      const c = (tw?.lngLat ?? [105.9472, 20.9955]) as LngLat
      setCenter(c)
      const all: Poi[] = (fc.features as { geometry: { coordinates: LngLat }; properties: { name: string; cat: AmenityCategory } }[])
        .map((f) => ({
          name: f.properties.name,
          cat: f.properties.cat,
          lngLat: f.geometry.coordinates,
          dist: haversine(c, f.geometry.coordinates),
        }))
        .sort((a, b) => a.dist - b.dist)

      // Đa dạng hoá: tối đa 2 điểm/nhóm + bỏ tên gần trùng (vd "BBQ - Hải Đăng 8: 01/02").
      const perCat = new Map<AmenityCategory, number>()
      const seen = new Set<string>()
      const norm = (s: string) => s.toLowerCase().replace(/[0-9:.\-]/g, '').replace(/\s+/g, ' ').trim()
      const diverse: Poi[] = []
      for (const p of all) {
        const key = norm(p.name)
        if (seen.has(key)) continue
        const n = perCat.get(p.cat) ?? 0
        if (n >= 2) continue
        seen.add(key)
        perCat.set(p.cat, n + 1)
        diverse.push(p)
        if (diverse.length >= 8) break
      }
      setPois(diverse)
    })
    return () => {
      active = false
    }
  }, [towerId])

  // Khởi tạo mini-map khi có center.
  useEffect(() => {
    if (!center || !containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center,
        zoom: 15.2,
        attributionControl: { compact: true },
      })
    } catch {
      return
    }
    mapRef.current = map
    map.on('load', () => {
      map.resize()
      // Marker căn (brand).
      const el = document.createElement('div')
      el.className = 'prop-pin'
      new maplibregl.Marker({ element: el }).setLngLat(center).addTo(map)
    })
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [center])

  const nearby = useMemo(() => pois, [pois])

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative h-72 overflow-hidden rounded-2xl border border-border bg-secondary lg:h-full">
        <div ref={containerRef} className="h-full w-full" aria-label="Property location map" />
      </div>
      <div>
        <ul className="space-y-2.5">
          {nearby.map((p, i) => {
            const color = AMENITY_CATEGORY_META[p.cat]?.color ?? '#0B5C63'
            return (
              <li key={i} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1a`, color }}>
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[0.9rem] text-foreground">{p.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1 font-sans text-[0.8125rem] font-medium text-muted-foreground">
                  <Navigation className="size-3.5" /> {fmtDist(p.dist)}
                </span>
              </li>
            )
          })}
        </ul>
        {nearby.length === 0 && (
          <p className="font-sans text-sm text-muted-foreground">{t('common.loading')}</p>
        )}
      </div>
    </div>
  )
}
