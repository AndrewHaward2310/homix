'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Plus,
  Minus,
  Maximize,
  MapPinOff,
  MapPin,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { formatMoney } from '@/types'
import { cn } from '@/lib/utils'
import { BrandLoaderInline } from '@/components/luxury/brand-loader'
import {
  AMENITY_CATEGORY_META,
  AMENITY_CATEGORY_ORDER,
  type AmenityCategory,
  getMasterplanTowers,
  MAP_CONTENT_BOUNDS,
  MAP_DEFAULT_VIEW,
  MAP_MAX_BOUNDS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE_URL,
  POI_GEOJSON_URL,
  type MasterplanTower,
} from '@/services/propertyService'

/** Padding fitBounds theo bề rộng khung (mobile chật hơn). */
function fitPadding(w: number) {
  return w < 768
    ? { top: 90, bottom: 120, left: 24, right: 24 }
    : { top: 96, bottom: 64, left: 360, right: 360 }
}

/** 1 tiện ích đã nạp vào JS (cho search + lọc). */
type Poi = { name: string; cat: AmenityCategory; type: string; lngLat: [number, number] }

/** Bỏ dấu tiếng Việt để search không phân biệt dấu/hoa thường. */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

type PoiFeatureCollection = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: { name: string; cat: AmenityCategory; type: string }
  }[]
}

/** Dựng GeoJSON từ danh sách POI đã lọc theo nhóm đang bật. */
function poisToFeatureCollection(pois: Poi[], active: Set<AmenityCategory>): PoiFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pois
      .filter((p) => active.has(p.cat))
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.lngLat },
        properties: { name: p.name, cat: p.cat, type: p.type },
      })),
  }
}

const POI_SOURCE = 'ocp1-pois'
const POI_DOT_LAYER = 'poi-dot'
const POI_LAYER_IDS = [POI_DOT_LAYER]

// Ánh xạ utilityType (trong GeoJSON) -> tên file icon GỐC của Vinhomes
// (đã tải về public/icons/utilities/). Nhờ vậy pin trông y hệt bản của họ.
const UTIL_ICON_FILE: Record<string, string> = {
  SERVICE: 'service',
  BBQ: 'bbq',
  BUS_STOP: 'bus',
  CUISINE: 'cuisine',
  OTHER: 'other',
  BASKETBALL_COURT: 'basketball',
  VOLLEYBALL_COURT: 'volleyball',
  LAKE_FISHING: 'fishingLake',
  TENNIS_COURT: 'tennis',
  TABLE_TENNIS_COURT: 'pingpong',
  BADMINTON_YARD: 'badminton',
  PICKLEBALL_COURT: 'pickleball',
  SHOPPING: 'shopping',
  ENTERTAINMENT: 'entertainment',
  SWIMMING_POOL: 'swimming',
}

const isDarkTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

/** Bầu trời + sương chân trời — tông sáng/tối, mờ dần khi zoom sâu (nhìn từ trên). */
function applySky(map: maplibregl.Map) {
  const dark = isDarkTheme()
  map.setSky({
    'sky-color': dark ? '#0b1220' : '#bcd7ea',
    'sky-horizon-blend': 0.5,
    'horizon-color': dark ? '#1a2634' : '#e7eef3',
    'horizon-fog-blend': 0.6,
    'fog-color': dark ? '#0a0f17' : '#eef2f5',
    'fog-ground-blend': 0.2,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 13, 0.8, 15, 0.35, 17, 0],
  })
}

/** Sinh vân mặt tiền (tileable): lằn sàn + lưới cửa sổ, để khối nhà đọc ra
 *  toà nhà thật thay vì hộp trơn. Cửa "sáng đèn" theo công thức tất định
 *  (không random) để các ô lát ghép liền mạch. Tông theo sáng/tối. */
function makeFacadeImage(dark: boolean): ImageData {
  const W = 48
  const H = 64
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!
  x.fillStyle = dark ? '#2b303a' : '#ced2d9' // tường
  x.fillRect(0, 0, W, H)
  x.fillStyle = dark ? '#222630' : '#b7bcc6' // lằn sàn
  for (let y = 0; y < H; y += 16) x.fillRect(0, y, W, 3)
  for (let y = 5; y < H; y += 16) {
    for (let wx = 6; wx < W; wx += 16) {
      const lit = (wx * 7 + y * 13) % 5 === 0 // vài ô "sáng đèn"
      x.fillStyle = dark
        ? lit
          ? '#5c6d88'
          : '#333b47'
        : lit
          ? '#a1b2c8'
          : '#6a798d'
      x.fillRect(wx, y, 9, 9)
    }
  }
  return x.getImageData(0, 0, W, H)
}

/** Làm nổi khối nhà 3D có sẵn trong style (dùng render_height thật của tile).
 *  Chống "hộp trơn": ánh sáng định hướng (mặt sáng/tối) + vân mặt tiền (cửa sổ,
 *  lằn sàn) + sàn cao tối thiểu để shophouse không bị dẹt. */
function boostBuildings(map: maplibregl.Map) {
  if (!map.getLayer('building-3d')) return
  const dark = isDarkTheme()

  // Ánh sáng xiên → các mặt hộp có sáng/tối, bớt phẳng.
  map.setLight({
    anchor: 'map',
    position: [1.2, 210, 30],
    color: dark ? '#cdd9ff' : '#ffffff',
    intensity: dark ? 0.35 : 0.5,
  })

  // Style gốc TẮT lớp 3D (visibility:none) — bật lên để lộ khối nhà thật.
  map.setLayoutProperty('building-3d', 'visibility', 'visible')
  map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 1)
  map.setPaintProperty('building-3d', 'fill-extrusion-vertical-gradient', true)

  // Vân mặt tiền (cửa sổ) — thay màu phẳng, cho cảm giác toà nhà thật.
  const facadeId = dark ? 'facade-dark' : 'facade'
  if (!map.hasImage(facadeId)) map.addImage(facadeId, makeFacadeImage(dark))
  map.setPaintProperty('building-3d', 'fill-extrusion-pattern', facadeId)

  // Sàn tối thiểu để shophouse thấp (~3.6m) không bị dẹt, rồi nống nhẹ toàn bộ.
  map.setPaintProperty('building-3d', 'fill-extrusion-height', [
    '*',
    ['max', ['coalesce', ['get', 'render_height'], 6], 9],
    1.25,
  ] as unknown as number)
}

/** Rasterize 1 file SVG icon -> ImageData để map.addImage (maplibre cần raster). */
function loadIconImage(url: string, size = 48): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, size, size)
      resolve(ctx.getImageData(0, 0, size, size))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
import { MasterplanPopup } from './masterplan-popup'
import { MasterplanLegend } from './masterplan-legend'
import { createHeroBuildingsLayer, type Hero } from './hero-buildings'

/** Hàm giả-ngẫu-nhiên TẤT ĐỊNH theo seed (để cụm tháp không nhấp nháy mỗi render). */
function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Toà điểm nhấn 3D theo phân khu (villa giữ khối đùn): mỗi phân khu là 1 CỤM
 *  vài tháp đa dạng (cao/rộng/hướng khác nhau) quanh tâm — giống quần thể thật.
 *  Chiều cao mang tính thị giác, không phải dữ liệu niêm yết. */
function heroesFromTowers(towers: MasterplanTower[]): Hero[] {
  const out: Hero[] = []
  towers.forEach((tw, ti) => {
    const n = tw.name.toLowerCase()
    if (n.includes('king') || n.includes('villa')) return
    const baseFloors = n.includes('diamond') ? 42 : n.includes('sapphire') ? 36 : n.includes('ruby') ? 30 : 28
    const [lng, lat] = tw.lngLat
    const mPerLat = 111320
    const mPerLng = 111320 * Math.cos((lat * Math.PI) / 180)
    const cols = 3
    const rows = 2
    const gap = 56
    let k = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s1 = seeded(ti * 97 + k * 13)
        const s2 = seeded(ti * 53 + k * 29)
        const dx = (c - (cols - 1) / 2) * gap + (s1 - 0.5) * 16
        const dy = (r - (rows - 1) / 2) * gap + (s2 - 0.5) * 16
        out.push({
          lngLat: [lng + dx / mPerLng, lat + dy / mPerLat],
          floors: Math.round(baseFloors * (0.68 + s1 * 0.6)),
          width: 20 + Math.round(s2 * 10),
          depth: 15 + Math.round(s1 * 8),
          rotationDeg: Math.round(s2 * 60) + (c % 2) * 90,
        })
        k++
      }
    }
  })
  return out
}

const STATUS_BADGE: Record<string, string> = {
  selling: 'bg-primary/10 text-primary',
  coming_soon: 'bg-secondary text-muted-foreground',
  sold_out: 'bg-secondary text-muted-foreground line-through decoration-1',
}

export function MasterplanLocator() {
  const { locale, t } = useLocale()
  const [towers, setTowers] = useState<MasterplanTower[]>([])
  const [pois, setPois] = useState<Poi[]>([])
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  // Nhóm tiện ích đang bật (mặc định bật tất cả).
  const [activeCats, setActiveCats] = useState<Set<AmenityCategory>>(
    () => new Set(AMENITY_CATEGORY_ORDER),
  )

  // Nạp danh sách tòa cho bản đồ từ API (trước đây đọc mock đồng bộ).
  useEffect(() => {
    let active = true
    getMasterplanTowers()
      .then((data) => {
        if (active) setTowers(data)
      })
      .catch(() => {
        if (active) setTowers([])
      })
    return () => {
      active = false
    }
  }, [])

  // Nạp 696 POI thật (GeoJSON tĩnh) vào JS để phục vụ search + lọc.
  useEffect(() => {
    let active = true
    fetch(POI_GEOJSON_URL)
      .then((r) => r.json())
      .then((fc: PoiFeatureCollection) => {
        if (!active) return
        setPois(
          fc.features.map((f) => ({
            name: f.properties.name,
            cat: f.properties.cat,
            type: f.properties.type,
            lngLat: f.geometry.coordinates,
          })),
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  // 1 popup tooltip dùng lại (không tạo mới mỗi lần hover).
  const poiPopupRef = useRef<maplibregl.Popup | null>(null)
  const localeRef = useRef(locale)
  localeRef.current = locale
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>>(
    new Map(),
  )
  const heroLayerRef = useRef<ReturnType<typeof createHeroBuildingsLayer> | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [showAmenities, setShowAmenities] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [openPoint, setOpenPoint] = useState({ x: 0, y: 0 })

  // Giữ callback mới nhất cho các handler gắn 1 lần vào marker.
  const openRef = useRef<(id: string) => void>(() => {})
  const hoverRef = useRef<(id: string | null) => void>(() => {})

  // --- responsive flag ---
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const markInteracted = useCallback(() => setHasInteracted(true), [])

  const openTower = towers.find((x) => x.id === openId) ?? null

  // Chiếu lngLat của tháp đang mở -> pixel trong khung để neo popup (desktop).
  const projectOpen = useCallback(() => {
    const map = mapRef.current
    if (!map || !openTower) return
    const p = map.project(openTower.lngLat)
    setOpenPoint({ x: p.x, y: p.y })
  }, [openTower])

  // --- khởi tạo map 1 lần ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: MAP_DEFAULT_VIEW.center,
        zoom: MAP_DEFAULT_VIEW.zoom,
        pitch: MAP_DEFAULT_VIEW.pitch,
        bearing: MAP_DEFAULT_VIEW.bearing,
        // Bó khung + giới hạn zoom quanh Ocean Park 1 để luôn focus vào khu đô thị.
        maxBounds: MAP_MAX_BOUNDS,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true },
      })
    } catch {
      setMapError(true)
      return
    }
    mapRef.current = map
    // Hook dev: cho công cụ chụp ảnh lái camera để kiểm tra 3D (vô hại).
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __oceanMap?: maplibregl.Map }).__oceanMap = map
    }

    const onResize = () => {
      const el = containerRef.current
      if (el) setFrame({ w: el.clientWidth, h: el.clientHeight })
      // Bắt buộc: đồng bộ canvas MapLibre với kích thước container thật
      // (nếu không, canvas kẹt ở size lúc khởi tạo -> bản đồ trắng/mất tile).
      mapRef.current?.resize()
    }

    map.on('load', () => {
      setLoaded(true)
      onResize()

      // Bầu trời + sương chân trời: tạo chiều sâu khi nghiêng camera (style gốc
      // không có sky → chân trời cụt). Đổi tông theo sáng/tối.
      applySky(map)
      // 3D building đã có sẵn trong style (render_height thật) — tăng độ đậm +
      // gradient dọc + hơi nống chiều cao cho khối nhà nổi bật, sang hơn.
      boostBuildings(map)

      // Canh khung nhìn ban đầu khít trọn nội dung OCP1 — kèm cú "bay vào" điện
      // ảnh: bắt đầu ở tầm cao/phẳng rồi hạ xuống nghiêng dần vào khu đô thị.
      const w = containerRef.current?.clientWidth ?? window.innerWidth
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        map.fitBounds(MAP_CONTENT_BOUNDS, {
          padding: fitPadding(w),
          pitch: MAP_DEFAULT_VIEW.pitch,
          bearing: MAP_DEFAULT_VIEW.bearing,
          duration: 0,
        })
      } else {
        map.jumpTo({
          center: MAP_DEFAULT_VIEW.center,
          zoom: MAP_MIN_ZOOM,
          pitch: 0,
          bearing: MAP_DEFAULT_VIEW.bearing + 14,
        })
        map.fitBounds(MAP_CONTENT_BOUNDS, {
          padding: fitPadding(w),
          pitch: MAP_DEFAULT_VIEW.pitch,
          bearing: MAP_DEFAULT_VIEW.bearing,
          duration: 2600,
          curve: 1.5,
          essential: true,
        })
      }
    })
    map.on('error', (e) => {
      // style/tiles không tải được -> hiện fallback
      if (e?.error && !mapRef.current?.isStyleLoaded()) setMapError(true)
    })
    // Icon sprite thiếu (style ngoài Vinhomes hay thiếu) -> chèn ảnh trong suốt để
    // MapLibre không cảnh báo lặp & không nhấp nháy vì thiếu ảnh.
    map.on('styleimagemissing', (e) => {
      const id = e.id
      if (id && !map.hasImage(id)) {
        map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) })
      }
    })
    map.on('move', () => {
      // cập nhật vị trí popup theo camera hiện tại
      projectOpenRef.current()
    })
    map.on('dragstart', markInteracted)
    map.on('zoomstart', markInteracted)

    const ro = new ResizeObserver(onResize)
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      // Dọn marker/popup/3D-layer gắn với map cũ để lần re-init ("Thử lại") tạo lại
      // đúng (nếu không, guard markersRef.has() sẽ bỏ qua mọi tòa → mất hết marker).
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current.clear()
      poiPopupRef.current?.remove()
      poiPopupRef.current = null
      heroLayerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // retryKey: cho phép khởi tạo lại map khi bấm "Thử lại".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey])

  // Toà 3D điểm nhấn (three.js custom layer) — thêm 1 lần khi có tòa + map sẵn sàng.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !towers.length || map.getLayer('hero-buildings')) return
    const heroes = heroesFromTowers(towers)
    if (!heroes.length) return
    try {
      const layer = createHeroBuildingsLayer(heroes, isDarkTheme)
      heroLayerRef.current = layer
      map.addLayer(layer)
    } catch {
      // Không dựng được 3D (thiếu WebGL...) -> vẫn còn khối đùn facade bên dưới.
    }
  }, [loaded, towers])

  // Đổi theme (class .dark trên <html>) -> vẽ lại bầu trời + màu khối nhà + toà hero.
  // CHỈ phản ứng khi trạng thái sáng/tối THỰC SỰ đổi — tránh bị extension (Dark
  // Reader...) hay lib khác đổi class liên tục làm map repaint spam -> nhấp nháy.
  useEffect(() => {
    let lastDark = isDarkTheme()
    const obs = new MutationObserver(() => {
      const nowDark = isDarkTheme()
      if (nowDark === lastDark) return
      lastDark = nowDark
      const map = mapRef.current
      if (map?.isStyleLoaded()) {
        applySky(map)
        boostBuildings(map)
        const hero = heroLayerRef.current as { __rebuild?: (d: boolean) => void } | null
        hero?.__rebuild?.(nowDark)
        map.triggerRepaint()
      }
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Ref cho projectOpen để dùng trong listener 'move' (tránh re-bind).
  const projectOpenRef = useRef(projectOpen)
  useEffect(() => {
    projectOpenRef.current = projectOpen
    projectOpen()
  }, [projectOpen])

  // --- tạo marker pill glass 1 lần khi map sẵn sàng ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return

    towers.forEach((tw) => {
      if (markersRef.current.has(tw.id)) return
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'ocean-pill'
      el.setAttribute('aria-label', tw.name)
      el.innerHTML = `<span class="ocean-pill__dot"></span><span class="ocean-pill__label">${tw.name}</span>`
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        openRef.current(tw.id)
      })
      el.addEventListener('mouseenter', () => hoverRef.current(tw.id))
      el.addEventListener('mouseleave', () => hoverRef.current(null))
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(tw.lngLat)
        .addTo(map)
      markersRef.current.set(tw.id, { marker, el })
    })
  }, [loaded, towers])

  // --- đồng bộ trạng thái hover/open sang class marker ---
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle('is-hover', hoveredId === id)
      el.classList.toggle('is-active', openId === id)
    })
  }, [hoveredId, openId])

  // --- Lớp POI tiện ích: 696 điểm THẬT của Vinhomes (GeoJSON tĩnh), gom cụm.
  //     Thêm 1 lần khi map sẵn sàng; click cụm để phóng to tách điểm.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !pois.length || map.getSource(POI_SOURCE)) return
    let cancelled = false

    // Nạp ICON GỐC của Vinhomes (SVG -> raster) rồi mới dựng layer.
    const setup = async () => {
      await Promise.all(
        Object.entries(UTIL_ICON_FILE).map(async ([type, file]) => {
          const id = `util-${type}`
          if (map.hasImage(id)) return
          const data = await loadIconImage(`/icons/utilities/icon_${file}.svg`)
          if (!cancelled && data && !map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 })
        }),
      )
      // Map có thể đã bị hủy trong lúc chờ icon tải.
      if (cancelled || mapRef.current !== map || map.getSource(POI_SOURCE)) return

      // KHÔNG gom cụm: hiện thẳng từng pin icon như map Vinhomes.
      map.addSource(POI_SOURCE, {
        type: 'geojson',
        data: poisToFeatureCollection(pois, activeCats),
      })

      // Chỉ icon, KHÔNG nhãn cố định — gọn như map Vinhomes (tên hiện khi hover).
      // Bật COLLISION (bỏ allow-overlap): MapLibre tự tỉa pin chồng nhau → thưa
      // ở mức tổng quan, lộ dần khi zoom. symbol-sort-key ưu tiên landmark dễ nhận.
      map.addLayer({
        id: POI_DOT_LAYER,
        type: 'symbol',
        source: POI_SOURCE,
        layout: {
          'icon-image': ['coalesce', ['image', ['concat', 'util-', ['get', 'type']]], ['image', 'util-OTHER']],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.4, 15, 0.66, 18, 0.95],
          'icon-allow-overlap': false,
          // Padding lớn ở mức tổng quan → tỉa mạnh cho thưa; nhỏ dần khi zoom sâu
          // để lộ nhiều tiện ích hơn. sort-key giữ landmark thắng va chạm.
          'icon-padding': ['interpolate', ['linear'], ['zoom'], 13, 22, 15, 8, 17, 3],
          // Ưu tiên giữ (nhỏ = ưu tiên cao) khi va chạm: giao thông/mua sắm/hồ trước.
          'symbol-sort-key': [
            'match',
            ['get', 'cat'],
            'transport', 0,
            'retail', 1,
            'water', 2,
            'entertainment', 3,
            'food', 4,
            'service', 5,
            'sport', 6,
            'bbq', 7,
            8,
          ],
        },
      } as maplibregl.LayerSpecification)

      // Tooltip tên + nhóm khi hover (desktop) / chạm (mobile). Dùng textContent -> an toàn XSS.
      const showTip = (lngLat: maplibregl.LngLatLike, name: string, cat: AmenityCategory) => {
        if (!poiPopupRef.current) {
          poiPopupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 14,
            className: 'poi-tip',
          })
        }
        const meta = AMENITY_CATEGORY_META[cat]
        const el = document.createElement('div')
        el.className = 'poi-tip__inner'
        const dot = document.createElement('span')
        dot.className = 'poi-tip__dot'
        dot.style.backgroundColor = meta?.color ?? '#0B5C63'
        const label = document.createElement('div')
        const strong = document.createElement('div')
        strong.className = 'poi-tip__name'
        strong.textContent = name
        const sub = document.createElement('div')
        sub.className = 'poi-tip__cat'
        sub.textContent = meta ? meta.label[localeRef.current === 'en' ? 'en' : 'vi'] : ''
        label.append(strong, sub)
        el.append(dot, label)
        poiPopupRef.current.setLngLat(lngLat).setDOMContent(el).addTo(map)
      }

      map.on('mousemove', POI_DOT_LAYER, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (!f) return
        const g = f.geometry as { type: 'Point'; coordinates: [number, number] }
        showTip(g.coordinates, String(f.properties?.name ?? ''), f.properties?.cat as AmenityCategory)
      })
      map.on('mouseleave', POI_DOT_LAYER, () => {
        map.getCanvas().style.cursor = ''
        poiPopupRef.current?.remove()
      })
      // Mobile: chạm vào pin để hiện tooltip.
      map.on('click', POI_DOT_LAYER, (e) => {
        const f = e.features?.[0]
        if (!f) return
        const g = f.geometry as { type: 'Point'; coordinates: [number, number] }
        showTip(g.coordinates, String(f.properties?.name ?? ''), f.properties?.cat as AmenityCategory)
      })
    }
    void setup()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, pois])

  // Lọc POI theo nhóm đang bật -> cập nhật dữ liệu nguồn (cluster tự tính lại).
  useEffect(() => {
    const map = mapRef.current
    const src = map?.getSource(POI_SOURCE) as maplibregl.GeoJSONSource | undefined
    if (!src) return
    src.setData(
      poisToFeatureCollection(pois, activeCats) as unknown as Parameters<typeof src.setData>[0],
    )
  }, [activeCats, pois, loaded])

  // Ẩn/hiện toàn bộ lớp POI theo toggle.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !map.getLayer(POI_DOT_LAYER)) return
    const vis = showAmenities ? 'visible' : 'none'
    POI_LAYER_IDS.forEach(
      (id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', vis),
    )
    if (!showAmenities) poiPopupRef.current?.remove()
  }, [showAmenities, loaded])

  // Đóng tooltip khi đổi bộ lọc (điểm có thể biến mất).
  useEffect(() => {
    poiPopupRef.current?.remove()
  }, [activeCats])

  // Đóng tooltip bằng Escape + dọn khi unmount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') poiPopupRef.current?.remove()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      poiPopupRef.current?.remove()
    }
  }, [])

  // Bay tới 1 tháp + mở popup (dùng cho panel click & marker click).
  const focusTower = useCallback(
    (id: string) => {
      const map = mapRef.current
      const tw = towers.find((x) => x.id === id)
      if (map && tw) {
        // Nghiêng sâu + zoom đủ để khối nhà 3D nổi lên khi chọn phân khu.
        map.flyTo({
          center: tw.lngLat,
          zoom: Math.max(map.getZoom(), 15.8),
          pitch: 60,
          bearing: -22,
          duration: 1100,
          curve: 1.4,
          essential: true,
        })
      }
      setOpenId(id)
      markInteracted()
    },
    [towers, markInteracted],
  )

  // cập nhật ref cho handler marker
  useEffect(() => {
    openRef.current = (id: string) => setOpenId((cur) => (cur === id ? null : id))
    hoverRef.current = setHoveredId
  }, [])

  // --- Search: gộp tháp + POI, không phân biệt dấu ---
  type SearchHit =
    | { kind: 'tower'; id: string; name: string; lngLat: [number, number] }
    | { kind: 'poi'; name: string; cat: AmenityCategory; lngLat: [number, number] }

  const searchResults = useMemo<SearchHit[]>(() => {
    const q = normalize(query)
    if (q.length < 2) return []
    const tw: SearchHit[] = towers
      .filter((t) => normalize(t.name).includes(q))
      .slice(0, 4)
      .map((t) => ({ kind: 'tower', id: t.id, name: t.name, lngLat: t.lngLat }))
    const po: SearchHit[] = pois
      .filter((p) => activeCats.has(p.cat) && normalize(p.name).includes(q))
      .slice(0, 8)
      .map((p) => ({ kind: 'poi', name: p.name, cat: p.cat, lngLat: p.lngLat }))
    return [...tw, ...po].slice(0, 10)
  }, [query, towers, pois, activeCats])

  const selectHit = useCallback(
    (hit: SearchHit) => {
      setQuery(hit.name)
      setSearchOpen(false)
      markInteracted()
      if (hit.kind === 'tower') {
        focusTower(hit.id)
        return
      }
      mapRef.current?.flyTo({ center: hit.lngLat, zoom: 16.5, duration: 800, essential: true })
    },
    [focusTower, markInteracted],
  )

  const toggleCat = useCallback((cat: AmenityCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const allActive = activeCats.size === AMENITY_CATEGORY_ORDER.length
  const toggleAll = useCallback(() => {
    setActiveCats((prev) =>
      prev.size === AMENITY_CATEGORY_ORDER.length ? new Set() : new Set(AMENITY_CATEGORY_ORDER),
    )
  }, [])

  // Đóng dropdown lọc khi bấm ra ngoài.
  useEffect(() => {
    if (!filterOpen) return
    const onDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [filterOpen])

  // khi mở tháp -> chiếu điểm ngay
  useEffect(() => {
    if (openId) projectOpen()
  }, [openId, projectOpen])

  const resetView = useCallback(() => {
    const w = containerRef.current?.clientWidth ?? window.innerWidth
    mapRef.current?.fitBounds(MAP_CONTENT_BOUNDS, {
      padding: fitPadding(w),
      pitch: MAP_DEFAULT_VIEW.pitch,
      bearing: MAP_DEFAULT_VIEW.bearing,
      duration: 800,
      essential: true,
    })
    setOpenId(null)
  }, [])

  const zoomBy = useCallback(
    (delta: number) => {
      const map = mapRef.current
      if (!map) return
      markInteracted()
      map.easeTo({ zoom: map.getZoom() + delta, duration: 300 })
    },
    [markInteracted],
  )

  // TODO: nối route thật /search?tower=<id> khi trang danh sách có bộ lọc backend.
  const handleViewUnits = (tw: { id: string }) => {
    window.location.assign(`/search?tower=${tw.id}`)
  }

  // Chặn overlay tương tác (panel/controls) kích hoạt drag của bản đồ.
  const stopFrame = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  }

  // Item phân khu dùng chung cho panel desktop + strip mobile.
  const renderTowerButton = (tw: MasterplanTower, variant: 'panel' | 'strip') => (
    <button
      type="button"
      onMouseEnter={() => setHoveredId(tw.id)}
      onMouseLeave={() => setHoveredId(null)}
      onFocus={() => setHoveredId(tw.id)}
      onBlur={() => setHoveredId(null)}
      onClick={() => focusTower(tw.id)}
      className={cn(
        'group w-full text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40',
        variant === 'panel'
          ? 'flex items-center justify-between gap-3 rounded-lg px-3 py-3'
          : 'flex w-48 shrink-0 flex-col gap-1 rounded-lg border border-border/60 px-3 py-2.5',
        hoveredId === tw.id || openId === tw.id
          ? 'bg-secondary'
          : variant === 'panel'
            ? 'hover:bg-secondary/60'
            : 'bg-background/70',
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-sans text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">
          {tw.name}
        </span>
        <span className="mt-0.5 block font-sans text-[0.8125rem] text-muted-foreground">
          {t('locator.priceFrom')} {formatMoney(tw.priceFromVnd, locale)}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-medium',
          variant === 'strip' && 'mt-1 self-start',
          STATUS_BADGE[tw.status],
        )}
      >
        {t(`tower.${tw.status}`)}
      </span>
    </button>
  )

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-secondary md:h-[88vh]">
      {/* Khung bản đồ MapLibre (nền chính).
          Dùng h-full/w-full: MapLibre ép .maplibregl-map thành position:relative
          nên inset-0 bị bỏ qua — phải cấp chiều cao tường minh, nếu không canvas
          sập về 0px và bản đồ trắng. */}
      <div ref={containerRef} className="h-full w-full" aria-label="Ocean Park map" />

      {/* Fallback khi map lỗi — mang thương hiệu + nút thử lại */}
      {mapError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-secondary to-muted px-6 text-center">
          <MapPinOff className="size-7 text-muted-foreground" aria-hidden="true" />
          <p className="font-sans text-base font-semibold text-foreground">
            {t('locator.errorTitle')}
          </p>
          <p className="max-w-sm font-sans text-sm leading-relaxed text-muted-foreground">
            {t('locator.errorDesc')}
          </p>
          <button
            type="button"
            onClick={() => {
              setMapError(false)
              setLoaded(false)
              setRetryKey((k) => k + 1)
            }}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-sans text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {t('locator.retry')}
          </button>
        </div>
      )}

      {/* Loader thương hiệu khi map đang tải (thay shimmer thô) */}
      {!loaded && !mapError && (
        <>
          <div className="absolute inset-0 z-20 bg-gradient-to-br from-secondary via-muted to-secondary" aria-hidden="true" />
          <BrandLoaderInline label={t('locator.loading')} className="z-[35]" />
        </>
      )}

      {!mapError && (
        <>
          {/* Thanh tìm kiếm + lọc — góc trái trên như map Vinhomes */}
          <div
            {...stopFrame}
            className="absolute left-4 right-4 top-4 z-30 md:left-6 md:right-auto md:top-6 md:w-[380px]"
          >
            <div className="relative">
              <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2.5 shadow-luxury-lg ring-1 ring-black/5">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t('locator.searchPlaceholder')}
                  className="w-full bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    type="button"
                    aria-label={t('locator.close')}
                    onClick={() => {
                      setQuery('')
                      setSearchOpen(false)
                    }}
                    className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {searchOpen && searchResults.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-2 max-h-72 overflow-auto rounded-2xl border border-glass-border bg-background/95 p-1.5 shadow-luxury-lg backdrop-blur-xl">
                  {searchResults.map((hit, i) => (
                    <li key={`${hit.kind}-${hit.name}-${i}`}>
                      <button
                        type="button"
                        onClick={() => selectHit(hit)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              hit.kind === 'poi'
                                ? AMENITY_CATEGORY_META[hit.cat].color
                                : 'var(--primary)',
                          }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate font-sans text-sm text-foreground">
                          {hit.name}
                        </span>
                        <span className="shrink-0 font-sans text-[0.6875rem] text-muted-foreground">
                          {hit.kind === 'tower'
                            ? t('locator.subdivisions')
                            : AMENITY_CATEGORY_META[hit.cat].label[locale === 'en' ? 'en' : 'vi']}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dropdown lọc "Tiện ích" — gộp 9 nhóm cho gọn */}
            {showAmenities && (
              <div ref={filterRef} className="relative mt-2 inline-block">
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  aria-expanded={filterOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-background/90 px-4 py-2 font-sans text-[0.8125rem] font-medium text-foreground shadow-luxury backdrop-blur-xl transition-colors hover:bg-background"
                >
                  <SlidersHorizontal className="size-4 text-brand" aria-hidden="true" />
                  {t('locator.amenities')}
                  {!allActive && (
                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[0.625rem] font-semibold text-brand-foreground">
                      {activeCats.size}
                    </span>
                  )}
                  <ChevronDown
                    className={cn('size-4 opacity-60 transition-transform', filterOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {filterOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 w-60 overflow-hidden rounded-2xl border border-glass-border bg-background/95 p-1.5 shadow-luxury-lg backdrop-blur-2xl">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-sans text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {allActive ? t('locator.filterNone') : t('locator.filterAll')}
                    </button>
                    <div className="my-1 h-px bg-border" />
                    {AMENITY_CATEGORY_ORDER.map((cat) => {
                      const on = activeCats.has(cat)
                      const meta = AMENITY_CATEGORY_META[cat]
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCat(cat)}
                          aria-pressed={on}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-sans text-[0.8125rem] text-foreground transition-colors hover:bg-secondary"
                        >
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: meta.color }}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{meta.label[locale === 'en' ? 'en' : 'vi']}</span>
                          {on && <Check className="size-4 text-brand" aria-hidden="true" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legend (desktop) */}
          <MasterplanLegend
            className="absolute bottom-6 left-6 z-20 hidden md:flex"
            showAmenities={showAmenities}
          />

          {/* Controls glass */}
          <div
            {...stopFrame}
            className="absolute right-4 top-4 z-30 flex flex-col gap-2 md:right-6 md:top-auto md:bottom-6"
          >
            <MapControl label={t('locator.zoomIn')} onClick={() => zoomBy(1)}>
              <Plus className="size-4" aria-hidden="true" />
            </MapControl>
            <MapControl label={t('locator.zoomOut')} onClick={() => zoomBy(-1)}>
              <Minus className="size-4" aria-hidden="true" />
            </MapControl>
            <MapControl label={t('locator.resetView')} onClick={resetView}>
              <Maximize className="size-4" aria-hidden="true" />
            </MapControl>
            <MapControl
              label={t('locator.toggleAmenities')}
              onClick={() => setShowAmenities((v) => !v)}
              active={showAmenities}
            >
              <MapPin className="size-4" aria-hidden="true" />
            </MapControl>
          </div>

          {/* Gợi ý thao tác — tự ẩn sau lần tương tác đầu (desktop) */}
          <div
            className={cn(
              'pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-glass-border bg-glass px-4 py-2 backdrop-blur-xl transition-opacity duration-500 md:block',
              hasInteracted ? 'opacity-0' : 'opacity-100',
            )}
          >
            <span className="font-sans text-[0.8125rem] text-foreground">{t('locator.hint')}</span>
          </div>

          {/* Panel phân khu NỔI — desktop (góc phải) */}
          <div
            {...stopFrame}
            className="absolute right-6 top-6 z-20 hidden max-h-[64%] w-[320px] cursor-default flex-col overflow-hidden rounded-xl border border-glass-border bg-glass shadow-luxury-lg backdrop-blur-xl md:flex"
          >
            <div className="border-b border-border/60 px-5 pb-3 pt-4">
              <p className="font-sans text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('locator.subdivisions')}
              </p>
            </div>
            <ul className="flex-1 overflow-y-auto p-2">
              {towers.map((tw) => (
                <li key={tw.id}>{renderTowerButton(tw, 'panel')}</li>
              ))}
            </ul>
          </div>

          {/* Panel phân khu NỔI — mobile (bottom strip cuộn ngang) */}
          <div
            {...stopFrame}
            className="absolute inset-x-0 bottom-0 z-20 cursor-default border-t border-glass-border bg-glass px-4 py-3 backdrop-blur-xl md:hidden"
          >
            <p className="mb-2 font-sans text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t('locator.subdivisions')}
            </p>
            <ul className="flex gap-3 overflow-x-auto pb-1">
              {towers.map((tw) => (
                <li key={tw.id} className="shrink-0">
                  {renderTowerButton(tw, 'strip')}
                </li>
              ))}
            </ul>
          </div>

          {/* Popup */}
          {openTower && (
            <MasterplanPopup
              tower={openTower}
              isMobile={isMobile}
              point={openPoint}
              frame={frame}
              onClose={() => setOpenId(null)}
              onViewUnits={handleViewUnits}
            />
          )}
        </>
      )}
    </div>
  )
}

/** Nút control dạng glass, thống nhất tone Apple Luxury. */
function MapControl({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-10 items-center justify-center rounded-full border shadow-luxury backdrop-blur-xl transition-transform duration-200 hover:scale-105 active:scale-95',
        active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-glass-border bg-glass text-foreground hover:bg-background/80',
      )}
    >
      {children}
    </button>
  )
}
