import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const FOV = 28
const CAMERA_DISTANCE = 17

export type Stage = ReturnType<typeof createStage>

/**
 * Palco único: um canvas fixo atrás do conteúdo, uma câmera quase frontal e
 * luzes que o resto do mundo reaproveita (a cor do recorte segue o tema).
 */
export const createStage = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture
  scene.environmentIntensity = 0.75
  scene.fog = new THREE.Fog('#d9c8a0', 40, 90)

  const camera = new THREE.PerspectiveCamera(FOV, 1, 2, 120)
  camera.position.set(0, 1.9, CAMERA_DISTANCE)
  camera.lookAt(0, 0.15, 0)

  const key = new THREE.DirectionalLight('#fff0dc', 1.9)
  key.position.set(-5, 7, 9)
  const fill = new THREE.DirectionalLight('#ffffff', 1.1)
  fill.position.set(7, 1.5, 5)
  const rim = new THREE.DirectionalLight('#ffffff', 2.4)
  rim.position.set(0.5, 3, -9)
  const flame = new THREE.PointLight('#ff9a3d', 0, 9, 2)
  scene.add(key, fill, rim, flame, new THREE.HemisphereLight('#ffffff', '#553322', 0.25))

  const size = { w: 1, h: 1, aspect: 1 }
  const listeners = new Set<() => void>()
  const scratch = new THREE.Vector3()

  const resize = () => {
    size.w = window.innerWidth
    size.h = window.innerHeight
    size.aspect = size.w / size.h
    renderer.setSize(size.w, size.h, false)
    camera.aspect = size.aspect
    // em telas estreitas abrimos um pouco o campo de visão para o produto caber
    camera.fov = size.aspect < 0.8 ? FOV + 10 : FOV
    camera.updateProjectionMatrix()
    listeners.forEach((fn) => fn())
  }

  /** Ponto no plano z = `z` que aparece na posição NDC (nx, ny) da tela. */
  const ndcToWorld = (nx: number, ny: number, z = 0, out = new THREE.Vector3()) => {
    scratch.set(nx, ny, 0.5).unproject(camera).sub(camera.position)
    const t = (z - camera.position.z) / scratch.z
    return out.copy(camera.position).addScaledVector(scratch, t)
  }

  const worldHeight = (z = 0) =>
    2 * (camera.position.z - z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))

  /** Escala base (unidade da lata principal) para a viewport atual. */
  const unit = () => {
    const h = worldHeight()
    const w = h * size.aspect
    return Math.min(0.219 * h, 0.34 * w)
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    renderer,
    scene,
    camera,
    lights: { key, fill, rim, flame },
    size,
    ndcToWorld,
    worldHeight,
    unit,
    onResize: (fn: () => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    render: () => renderer.render(scene, camera),
  }
}
