import * as THREE from 'three'

export type Matcaps = { silver: THREE.Texture; plastic: THREE.Texture }

type MatcapOptions = { color: string; metalness: number; roughness: number }

/**
 * Renderiza uma esfera iluminada pelo ambiente uma única vez e devolve a textura.
 * Com a câmera quase fixa, o matcap equivale ao reflexo de ambiente (IBL), mas custa
 * uma leitura de textura por pixel em vez de várias amostras do cubemap.
 */
const bake = (renderer: THREE.WebGLRenderer, environment: THREE.Texture, opts: MatcapOptions) => {
  const size = 256
  const target = new THREE.WebGLRenderTarget(size, size, { colorSpace: THREE.SRGBColorSpace })
  const scene = new THREE.Scene()
  scene.environment = environment
  scene.environmentIntensity = 0.9
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({ color: opts.color, metalness: opts.metalness, roughness: opts.roughness }),
  )
  const key = new THREE.DirectionalLight('#fff0dc', 1.6)
  key.position.set(-5, 7, 9)
  scene.add(sphere, key)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.set(0, 0, 3)

  const previous = renderer.getRenderTarget()
  renderer.setRenderTarget(target)
  renderer.render(scene, camera)
  renderer.setRenderTarget(previous)

  sphere.geometry.dispose()
  ;(sphere.material as THREE.Material).dispose()
  return target.texture
}

export const bakeMatcaps = (renderer: THREE.WebGLRenderer, environment: THREE.Texture): Matcaps => ({
  silver: bake(renderer, environment, { color: '#dcdfe4', metalness: 1, roughness: 0.3 }),
  plastic: bake(renderer, environment, { color: '#ffffff', metalness: 0.1, roughness: 0.32 }),
})
