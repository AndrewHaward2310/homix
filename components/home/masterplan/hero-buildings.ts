import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import maplibregl from 'maplibre-gl'

/**
 * Hero buildings — dựng mesh THÁP điểm nhấn bằng three.js rồi render qua MapLibre
 * custom layer (chia sẻ WebGL context với bản đồ). "Giống thật" hơn khối đùn:
 * có đế, thân giật cấp, mái/vương miện, và vân kính (cửa sổ) thật sự trên geometry.
 *
 * Không cần file model ngoài (dựng tham số) → chạy offline, nhẹ (chỉ vài toà).
 */

export type Hero = {
  lngLat: [number, number]
  floors: number
  /** Bề rộng/sâu chân toà (mét). */
  width: number
  depth: number
  /** Xoay quanh trục đứng (độ) để toà không cùng hướng. */
  rotationDeg?: number
}

const FLOOR_H = 3.4 // m mỗi tầng
const TILE_COLS = 4 // số cửa sổ mỗi ô lát
const TILE_FLOORS = 4 // số tầng mỗi ô lát
const TILE_W_M = 13 // ô lát ~13m ngang
const TILE_H_M = TILE_FLOORS * FLOOR_H // ~13.6m dọc

/** 1 ô lát mặt kính (tileable) — lưới cửa sổ + lằn sàn, vài ô "sáng đèn".
 *  Dùng RepeatWrapping + repeat theo mét nên cửa sổ đều nhau ở mọi khối. */
function facadeTexture(dark: boolean): THREE.CanvasTexture {
  const cw = 26
  const ch = 22
  const c = document.createElement('canvas')
  c.width = TILE_COLS * cw
  c.height = TILE_FLOORS * ch
  const x = c.getContext('2d')!
  // Khung/spandrel (giữa các cửa)
  x.fillStyle = dark ? '#39424f' : '#dfe3ea'
  x.fillRect(0, 0, c.width, c.height)
  for (let f = 0; f < TILE_FLOORS; f++) {
    for (let col = 0; col < TILE_COLS; col++) {
      const lit = (col * 7 + f * 13) % 5 === 0
      // Kính phản chiếu trời (xanh nhạt), vài ô sáng đèn ấm.
      x.fillStyle = dark
        ? lit
          ? '#8aa0c6'
          : '#41506a'
        : lit
          ? '#eaf3fb'
          : '#a9c4de'
      x.fillRect(col * cw + 3, f * ch + 3, cw - 6, ch - 7)
      // gờ kính sáng để thấy khối
      x.fillStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.35)'
      x.fillRect(col * cw + 3, f * ch + 3, cw - 6, 2)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace // nếu không, màu bị tối gấp đôi (gamma)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}

/** Vật liệu kính cho 1 khối kích thước w×segH: lặp texture theo mét. */
function glassMaterial(baseTex: THREE.CanvasTexture, w: number, segH: number, dark: boolean) {
  const tex = baseTex.clone()
  tex.needsUpdate = true
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(Math.max(1, Math.round(w / TILE_W_M)), Math.max(1, Math.round(segH / TILE_H_M)))
  // Kính phản chiếu: cần scene.environment (envMap) mới không bị đen. Giữ tông
  // trung tính + roughness vừa để KHÔNG bị cháy trắng, còn thấy vân cửa.
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: dark ? '#7f8da2' : '#bcc8da',
    roughness: 0.34,
    metalness: 0.3,
    envMapIntensity: dark ? 0.4 : 0.65,
  })
}

/** Dựng 1 toà tháp: đế + thân giật cấp (2 setback) + vương miện, kính có vân. */
function buildTower(h: Hero, baseTex: THREE.CanvasTexture, dark: boolean): THREE.Group {
  const g = new THREE.Group()
  const totalH = h.floors * FLOOR_H

  const concrete = new THREE.MeshStandardMaterial({
    color: dark ? '#3a414d' : '#c8ccd3',
    roughness: 0.9,
    metalness: 0.05,
  })

  // Đế (podium) rộng hơn thân.
  const podH = 10
  const podium = new THREE.Mesh(new THREE.BoxGeometry(h.width * 1.3, podH, h.depth * 1.3), concrete)
  podium.position.y = podH / 2
  g.add(podium)

  // Thân giật cấp: 3 đoạn thu nhỏ dần → dáng tháp thanh thoát.
  const segs = [
    { from: 0.0, to: 0.6, s: 1.0 },
    { from: 0.6, to: 0.85, s: 0.83 },
    { from: 0.85, to: 1.0, s: 0.66 },
  ]
  for (const seg of segs) {
    const y0 = podH + seg.from * (totalH - podH)
    const y1 = podH + seg.to * (totalH - podH)
    const segH = Math.max(1, y1 - y0)
    const w = h.width * seg.s
    const d = h.depth * seg.s
    const box = new THREE.BoxGeometry(w, segH, d)
    const side = glassMaterial(baseTex, w, segH, dark)
    const sideD = glassMaterial(baseTex, d, segH, dark)
    // Thứ tự face BoxGeometry: +x,-x,+y,-y,+z,-z
    const mesh = new THREE.Mesh(box, [sideD, sideD, concrete, concrete, side, side])
    mesh.position.y = (y0 + y1) / 2
    g.add(mesh)
  }

  // Vương miện + chi tiết mái (tum thang, bồn nước, cột ăng-ten) cho đỡ "hộp".
  const metal = new THREE.MeshStandardMaterial({
    color: dark ? '#5a6479' : '#9aa6b6',
    roughness: 0.5,
    metalness: 0.3,
    envMapIntensity: 0.8,
  })
  const topW = h.width * 0.66
  const topD = h.depth * 0.66
  const crown = new THREE.Mesh(new THREE.BoxGeometry(topW, 3.5, topD), metal)
  crown.position.y = totalH + 1.7
  g.add(crown)
  // tum thang máy
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.5, 6, topD * 0.5), metal)
  penthouse.position.set(topW * 0.12, totalH + 6.5, -topD * 0.1)
  g.add(penthouse)
  // bồn nước / khối kỹ thuật
  const tank = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.28, 4, topD * 0.28), metal)
  tank.position.set(-topW * 0.22, totalH + 5.5, topD * 0.18)
  g.add(tank)
  // cột ăng-ten
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 12, 6), metal)
  mast.position.set(topW * 0.12, totalH + 15, -topD * 0.1)
  g.add(mast)

  g.rotation.y = ((h.rotationDeg ?? 0) * Math.PI) / 180
  return g
}

export function createHeroBuildingsLayer(
  heroes: Hero[],
  getDark: () => boolean,
): maplibregl.CustomLayerInterface {
  const origin = heroes[0]?.lngLat ?? [105.947, 20.9955]
  const originMerc = maplibregl.MercatorCoordinate.fromLngLat(origin, 0)
  const scale = originMerc.meterInMercatorCoordinateUnits()

  const camera = new THREE.Camera()
  const scene = new THREE.Scene()
  let renderer: THREE.WebGLRenderer | null = null
  let envTexture: THREE.Texture | null = null

  // Ánh sáng: trời/đất + 1 hướng xiên tạo bóng mặt.
  const build = (dark: boolean) => {
    scene.clear()
    scene.environment = envTexture // envMap để kính có phản chiếu
    const hemi = new THREE.HemisphereLight(
      dark ? 0x2a3550 : 0xdfe9ff,
      dark ? 0x141821 : 0xb8b2a6,
      dark ? 1.2 : 1.8,
    )
    scene.add(hemi)
    scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.35 : 0.5))
    const dir = new THREE.DirectionalLight(dark ? 0x9fb4e0 : 0xffffff, dark ? 1.4 : 2.3)
    dir.position.set(-0.7, 1, 0.4)
    scene.add(dir)

    const baseTex = facadeTexture(dark)
    for (const h of heroes) {
      const merc = maplibregl.MercatorCoordinate.fromLngLat(h.lngLat, 0)
      const g = buildTower(h, baseTex, dark)
      g.position.set((merc.x - originMerc.x) / scale, 0, (merc.y - originMerc.y) / scale)
      scene.add(g)
    }
  }

  const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)

  return {
    id: 'hero-buildings',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      renderer = new THREE.WebGLRenderer({
        canvas: _map.getCanvas(),
        context: gl as WebGLRenderingContext,
        // antialias:false khi DÙNG CHUNG context của MapLibre — bật lên dễ gây
        // nhấp nháy trên GPU thật (three tạo framebuffer MSAA lệch với context).
        antialias: false,
      })
      renderer.autoClear = false
      // Env map studio (RoomEnvironment) cho kính phản chiếu — dựng 1 lần.
      try {
        const pmrem = new THREE.PMREMGenerator(renderer)
        envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        pmrem.dispose()
      } catch {
        envTexture = null
      }
      build(getDark())
    },
    render(_gl, args) {
      if (!renderer) return
      try {
        // MapLibre v5: ma trận mercator->clip nằm ở args.defaultProjectionData.mainMatrix.
        const mvp = args.defaultProjectionData?.mainMatrix as unknown as number[]
        if (!mvp) return
        const m = new THREE.Matrix4().fromArray(mvp)
        const l = new THREE.Matrix4()
          .makeTranslation(originMerc.x, originMerc.y, originMerc.z)
          .scale(new THREE.Vector3(scale, -scale, scale))
          .multiply(rotationX)
        camera.projectionMatrix = m.multiply(l)
        renderer.resetState()
        renderer.render(scene, camera)
      } catch {
        // Lỗi GPU/driver ở máy người dùng -> tự tắt để KHÔNG nhấp nháy mỗi frame.
        try {
          renderer?.dispose()
        } catch {}
        renderer = null
      }
    },
    // Cho phép vẽ lại khi đổi theme (locator gọi qua map.style).
    // @ts-expect-error thuộc tính phụ tự thêm để rebuild
    __rebuild(dark: boolean) {
      build(dark)
    },
  }
}
