import * as THREE from 'three'
import { buildLogo3D } from './logo'

const dustVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPx;
  uniform vec2 uPointer;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.25 + aSeed * 30.0) * 0.5;
    p.x += cos(uTime * 0.2 + aSeed * 17.0) * 0.4 + uPointer.x * (0.25 + aSeed) * 0.6;
    p.y += uPointer.y * (0.25 + aSeed) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.5 + aSeed * 4.0) * uPx * (17.0 / -mv.z);
    vA = 0.25 + 0.75 * pow(max(sin(uTime * (0.6 + aSeed) + aSeed * 50.0), 0.0), 3.0);
  }
`

const dustFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Poeira dourada flutuando, no espírito do glitter dentro da cera. */
export const createDust = (renderer: THREE.WebGLRenderer, count = 320) => {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16
    positions[i * 3 + 2] = -7 + Math.random() * 10
    seeds[i] = Math.random()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const mat = new THREE.ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: renderer.getPixelRatio() },
      uPointer: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color('#fff1c9') },
      uOpacity: { value: 0.9 },
    },
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return { points, material: mat }
}

type Asterisk = { mesh: THREE.Group; base: THREE.Vector3; speed: THREE.Vector3; phase: number; depth: number }

/** Asteriscos da marca (✱) flutuando em camadas de profundidade. */
export const createAsterisks = (count = 8) => {
  const group = new THREE.Group()
  const material = new THREE.MeshPhysicalMaterial({
    color: '#fbf0cf',
    roughness: 0.28,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    transparent: true,
  })
  const arm = new THREE.CapsuleGeometry(0.07, 0.62, 6, 14)
  const items: Asterisk[] = []
  for (let i = 0; i < count; i++) {
    const star = new THREE.Group()
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(arm, material)
      m.rotation.z = (k * Math.PI) / 3
      star.add(m)
    }
    // órbita elíptica atrás da lata principal
    const angle = (i / count) * Math.PI * 2 + 0.4
    const radius = 1 + (i % 3) * 0.16
    const depth = -2 - (i % 4) * 1.3
    const base = new THREE.Vector3(Math.cos(angle) * 3.8 * radius, Math.sin(angle) * 2.9 * radius, depth)
    const s = 0.45 + Math.random() * 0.7
    star.scale.setScalar(s)
    star.position.copy(base)
    group.add(star)
    items.push({
      mesh: star,
      base,
      speed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.4,
      ),
      phase: Math.random() * 10,
      depth,
    })
  }
  const update = (time: number, pointer: { x: number; y: number }) => {
    for (const it of items) {
      const t = time * 0.4 + it.phase
      it.mesh.position.set(
        it.base.x + Math.sin(t) * 0.35 - pointer.x * it.depth * -0.12,
        it.base.y + Math.cos(t * 0.8) * 0.45 - pointer.y * it.depth * -0.08,
        it.base.z,
      )
      it.mesh.rotation.set(time * it.speed.x, time * it.speed.y, time * it.speed.z)
    }
  }
  return { group, material, update }
}

/** Logo FLY em tubos 3D, para o fechamento da página. */
export const createLogoStage = () => {
  const group = new THREE.Group()
  const material = new THREE.MeshPhysicalMaterial({
    color: '#fbf0cf',
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  })
  const logo = buildLogo3D(material, 0.052)
  group.add(logo)
  return { group, logo, material }
}
