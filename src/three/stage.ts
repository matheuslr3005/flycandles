import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { bakeMatcaps } from './matcap'

const FOV = 28
const CAMERA_DISTANCE = 17

const backgroundVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`

/** Degradê radial + vinheta + grão, desenhados no próprio canvas (sem repintar CSS). */
const backgroundFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uCenter;
  uniform vec3 uEdge;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    float t = length((vUv - vec2(0.5, 0.58)) / vec2(1.3, 1.0));
    vec3 col = mix(uCenter, uEdge, clamp(t, 0.0, 1.0));
    float vignette = smoothstep(0.55, 1.0, length((vUv - vec2(0.5, 0.55)) / vec2(1.2, 0.9)));
    col *= 1.0 - vignette * 0.22;
    col *= 1.0 - 0.05 * hash(gl_FragCoord.xy);
    gl_FragColor = vec4(col, 1.0);
  }
`

export type Stage = ReturnType<typeof createStage>

/**
 * Palco único: um canvas fixo atrás do conteúdo, uma câmera quase frontal e
 * luzes que o resto do mundo reaproveita (a cor do recorte segue o tema).
 */
export const createStage = (canvas: HTMLCanvasElement) => {
  // celular/tablet: sem MSAA (caro em GPU móvel) e pixel ratio próprio
  const coarse =
    window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600
  const baseRatio = Math.min(window.devicePixelRatio, coarse ? 2 : 1.5)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    // MSAA só sai em telas pequenas de alta densidade, onde o pixel ratio já suaviza as bordas
    antialias: !coarse || window.devicePixelRatio < 2,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(baseRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.0

  const scene = new THREE.Scene()
  // o ambiente só serve para "assar" os matcaps; a cena em si não usa IBL por pixel
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.035)
  const matcaps = bakeMatcaps(renderer, environment.texture)
  environment.dispose()
  pmrem.dispose()
  scene.fog = new THREE.Fog('#d9c8a0', 24, 52)

  const backgroundMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundVertex,
    fragmentShader: backgroundFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uCenter: { value: new THREE.Color() },
      uEdge: { value: new THREE.Color() },
    },
  })
  const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial)
  background.frustumCulled = false
  background.renderOrder = -1000
  scene.add(background)

  /** As cores chegam no espaço de trabalho (linear); o degradê é interpolado em sRGB, como no CSS. */
  const setBackground = (center: THREE.Color, edge: THREE.Color) => {
    ;(backgroundMaterial.uniforms.uCenter!.value as THREE.Color).copy(center).convertLinearToSRGB()
    ;(backgroundMaterial.uniforms.uEdge!.value as THREE.Color).copy(edge).convertLinearToSRGB()
  }

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
  // luz ambiente no lugar do IBL: levanta os adesivos fosco (Lambert) sem custo por pixel
  scene.add(key, fill, rim, flame, new THREE.AmbientLight('#ffffff', 1.6))

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

  // ---- resolução adaptativa: se o quadro demorar, baixamos o pixel ratio ----
  const ratios = [1, 0.8, 0.65, 0.5].map((k) => Math.max(0.6, baseRatio * k))
  let level = 0
  let slowFrames = 0
  let fastFrames = 0
  let avg = 16

  const adapt = (dtMs: number) => {
    avg += (Math.min(dtMs, 100) - avg) * 0.1
    if (avg > 24) slowFrames++
    else slowFrames = Math.max(0, slowFrames - 1)
    if (avg < 15) fastFrames++
    else fastFrames = 0

    if (slowFrames > 20 && level < ratios.length - 1) {
      level++
      slowFrames = 0
      fastFrames = -400 // depois de cair, demora para tentar subir de novo
      renderer.setPixelRatio(ratios[level] ?? baseRatio)
      renderer.setSize(size.w, size.h, false)
    } else if (fastFrames > 600 && level > 0) {
      level--
      fastFrames = 0
      renderer.setPixelRatio(ratios[level] ?? baseRatio)
      renderer.setSize(size.w, size.h, false)
    }
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    renderer,
    scene,
    camera,
    lights: { key, fill, rim, flame },
    size,
    coarse,
    matcaps,
    ndcToWorld,
    worldHeight,
    unit,
    setBackground,
    adapt,
    onResize: (fn: () => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    render: () => renderer.render(scene, camera),
  }
}
