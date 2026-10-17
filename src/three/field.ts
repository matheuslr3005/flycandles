import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Product } from '../data/products'
import { makeLabelTexture } from './labelTexture'
import {
  TIN,
  createBodyGeometry,
  createLabelGeometry,
  createLidRingGeometry,
  createLidSideGeometry,
} from './tinGeometry'

const COLS = 13
const ROWS = 17
const SPACING = 2.4

type Tin = { x: number; z: number; yaw: number; variant: number; slot: number; phase: number }

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/**
 * Um mar de latas inclinado para a câmera, como nas fotos da produção.
 * Cada variante de tampa é um InstancedMesh; casco e aro são compartilhados.
 */
export const createField = (products: readonly Product[], renderer: THREE.WebGLRenderer) => {
  const group = new THREE.Group()

  const shellGeo = mergeGeometries([
    createBodyGeometry(),
    createLidSideGeometry().translate(0, TIN.LID_Y, 0),
  ])
  const ringGeo = createLidRingGeometry().translate(0, TIN.LID_Y, 0)
  const labelGeo = createLabelGeometry().translate(0, TIN.LID_Y, 0)
  if (!shellGeo) throw new Error('Falha ao mesclar a geometria da lata')

  const silver = new THREE.MeshStandardMaterial({
    color: '#dcdfe4',
    metalness: 1,
    roughness: 0.34,
    side: THREE.DoubleSide,
  })
  const dark = new THREE.MeshStandardMaterial({ color: '#17171a', metalness: 0.75, roughness: 0.4 })

  const tins: Tin[] = []
  const counts = products.map(() => 0)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const variant = Math.floor(hash(c, r) * products.length) % products.length
      tins.push({
        x: (c - (COLS - 1) / 2) * SPACING + (hash(c + 9, r) - 0.5) * 0.12,
        z: (r - (ROWS - 1) / 2) * SPACING + (hash(c, r + 5) - 0.5) * 0.12,
        yaw: hash(c + 3, r + 7) * Math.PI * 2,
        variant,
        slot: counts[variant] ?? 0,
        phase: hash(c + 1, r + 2) * Math.PI * 2,
      })
      counts[variant] = (counts[variant] ?? 0) + 1
    }
  }

  const shell = new THREE.InstancedMesh(shellGeo, silver, tins.length)
  const rings = new THREE.InstancedMesh(ringGeo, dark, tins.length)
  const labels = products.map((p, i) => {
    const mat = new THREE.MeshPhysicalMaterial({
      map: makeLabelTexture(p.lid, p.name, renderer),
      color: '#cdcdcd',
      roughness: 0.62,
      specularIntensity: 0.4,
      envMapIntensity: 0.5,
    })
    return new THREE.InstancedMesh(labelGeo, mat, Math.max(counts[i] ?? 0, 1))
  })
  for (const mesh of [shell, rings, ...labels]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    group.add(mesh)
  }

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const hit = new THREE.Vector3()
  const ray = new THREE.Ray()
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const inverse = new THREE.Matrix4()
  const caster = new THREE.Raycaster()

  const pointer = { hx: 0, hz: 0, strength: 0 }

  const update = (time: number, camera: THREE.Camera, pan: number, ndc: { x: number; y: number } | null) => {
    if (ndc) {
      caster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera)
      inverse.copy(group.matrixWorld).invert()
      ray.copy(caster.ray).applyMatrix4(inverse)
      if (ray.intersectPlane(plane, hit)) {
        pointer.hx += (hit.x - pointer.hx) * 0.18
        pointer.hz += (hit.z - pointer.hz) * 0.18
      }
    }
    pointer.strength += ((ndc ? 1 : 0) - pointer.strength) * 0.06

    for (let i = 0; i < tins.length; i++) {
      const t = tins[i]
      if (!t) continue
      const z = t.z - pan
      const dx = t.x - pointer.hx
      const dz = z - pointer.hz
      const near = Math.exp(-(dx * dx + dz * dz) / (2 * 1.7 * 1.7)) * pointer.strength
      const bob = Math.sin(time * 0.9 + t.phase + t.x * 0.35 + z * 0.3) * 0.05
      pos.set(t.x, near * 0.85 + bob, z)
      q.setFromAxisAngle(up, t.yaw + near * 0.6)
      // latas nas bordas encolhem para sumir sem corte seco
      const edge = Math.min(1, Math.max(0, (ROWS * SPACING * 0.5 - Math.abs(z)) / 5))
      scl.setScalar((1 + near * 0.08) * (0.4 + 0.6 * edge))
      m.compose(pos, q, scl)
      shell.setMatrixAt(i, m)
      rings.setMatrixAt(i, m)
      labels[t.variant]?.setMatrixAt(t.slot, m)
    }
    shell.instanceMatrix.needsUpdate = true
    rings.instanceMatrix.needsUpdate = true
    for (const l of labels) l.instanceMatrix.needsUpdate = true
  }

  return { group, update }
}

export type Field = ReturnType<typeof createField>
