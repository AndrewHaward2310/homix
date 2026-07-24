'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Property } from '@/types'
import {
  MAP_CONTENT_BOUNDS,
  MAP_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  MAP_STYLE_URL,
} from '@/services/propertyService'

type LngLat = [number, number]

/** Đặt căn tại toạ độ toà + jitter nhẹ theo index để không đè nhau. */
function propCoord(base: LngLat, i: number): LngLat {
  const a = i * 2.4
  return [base[0] + Math.cos(a) * 0.0009 * ((i % 3) + 1), base[1] + Math.sin(a) * 0.0007 * ((i % 3) + 1)]
}

function priceLabel(p: Property): string {
  const v = p.priceVnd
  if (v >= 1e9) return (v / 1e9).toFixed(1).replace('.0', '') + ' tỷ'
  return Math.round(v / 1e6) + ' tr'
}

export function SearchMap({
  properties,
  towerCoords,
  hoveredId,
  onHover,
}: {
  properties: Property[]
  towerCoords: Record<string, LngLat>
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Khởi tạo map 1 lần
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        bounds: MAP_CONTENT_BOUNDS,
        fitBoundsOptions: { padding: 60 },
        maxBounds: MAP_MAX_BOUNDS,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: 18,
        attributionControl: { compact: true },
      })
    } catch {
      return
    }
    mapRef.current = map
    map.on('load', () => map.resize())
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Vẽ lại marker khi danh sách đổi
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((_, id) => {
      if (!properties.find((p) => p.id === id)) markersRef.current.delete(id)
    })
    // Xoá hết marker cũ đơn giản: gỡ DOM cha
    document.querySelectorAll('.price-marker-wrap').forEach((n) => n.remove())
    markersRef.current.clear()

    properties.forEach((p, i) => {
      const base = towerCoords[p.towerId]
      if (!base) return
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'price-marker'
      el.textContent = priceLabel(p)
      el.addEventListener('mouseenter', () => onHover(p.id))
      el.addEventListener('mouseleave', () => onHover(null))
      el.addEventListener('click', () => {
        window.location.href = `/property/${p.id}`
      })
      const wrap = document.createElement('div')
      wrap.className = 'price-marker-wrap'
      wrap.appendChild(el)
      new maplibregl.Marker({ element: wrap, anchor: 'bottom' })
        .setLngLat(propCoord(base, i))
        .addTo(map)
      markersRef.current.set(p.id, el)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, towerCoords])

  // Đồng bộ hover từ list -> marker
  useEffect(() => {
    markersRef.current.forEach((el, id) => {
      el.classList.toggle('is-active', hoveredId === id)
    })
  }, [hoveredId])

  return <div ref={containerRef} className="h-full w-full" aria-label="DOMIX HOME search map" />
}
