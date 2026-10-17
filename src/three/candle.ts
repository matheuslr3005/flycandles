import * as THREE from 'three'
import type { Product } from '../data/products'
import { createFlameMaterial, createHaloMaterial } from './flame'
import { makeLabelTexture, makeShadowTexture } from './labelTexture'
import {
  TIN,
  createBodyGeometry,
  createInnerGeometry,
  createLabelGeometry,
  createLidRingGeometry,
  createLidSideGeometry,
  createLidUnderGeometry,
  createWaxGeometry,
} from './tinGeometry'

const sparkleVertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPx;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx * (16.0 / -mv.z);
    float s = sin(uTime * (1.4 + aPhase * 2.0) + aPhase * 40.0);
    vTwinkle = pow(max(s, 0.0), 5.0);
  }
`

const sparkleFragment = /* glsl */ `
  precision highp float;
  varying float vTwinkle;
  uniform float uVisible;
  uniform float uOpacity;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float disc = smoothstep(0.5, 0.0, length(p));
    float cross = pow(max(1.0 - abs(p.x) * 9.0, 0.0), 2.0) * (1.0 - abs(p.y) * 2.0)
                + pow(max(1.0 - abs(p.y) * 9.0, 0.0), 2.0) * (1.0 - abs(p.x) * 2.0);
    float a = (disc * 0.55 + cross) * (0.18 + vTwinkle) * uVisible * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.93, 0.78), a);
  }
`

export type Candle = {
  /** Nó de posição/escala no palco (slot) */
  root: THREE.Group
  /** Nó de inclinação e flutuação */
  pose: THREE.Group
  shadow: THREE.Mesh
  flameAnchor: THREE.Object3D
  setOpacity: (value: number) => void
  /** 0 = tampa fechada, 1 = tampa levitando ao lado, chama acesa */
  setOpen: (value: number, portrait?: boolean) => void
  /** Intensidade da chama (0..1) */
  readonly flameLevel: number
  update: (time: number, camera: THREE.Camera) => void
}

const smooth = (v: number, a: number, b: number) => {
  const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export const createCandle = (product: Product, renderer: THREE.WebGLRenderer): Candle => {
  const fadeables: (THREE.Material & { opacity: number })[] = []
  // dissolve estocástico: evita os artefatos de ordenação da transparência em metal
  const track = <T extends THREE.Material>(m: T) => {
    m.alphaHash = true
    fadeables.push(m)
    return m
  }

  const silver = track(
    new THREE.MeshStandardMaterial({
      color: '#dcdfe4',
      metalness: 1,
      roughness: 0.3,
      side: THREE.DoubleSide,
    }),
  )
  const dark = track(
    new THREE.MeshStandardMaterial({ color: '#17171a', metalness: 0.75, roughness: 0.38 }),
  )
  const innerTint = new THREE.Color('#dcdfe4').lerp(new THREE.Color(product.wax), 0.55)
  const innerMat = track(
    new THREE.MeshStandardMaterial({
      color: innerTint,
      metalness: 1,
      roughness: 0.28,
      side: THREE.DoubleSide,
    }),
  )
  const lidUnderMat = track(
    new THREE.MeshStandardMaterial({
      color: '#b9bcc2',
      metalness: 1,
      roughness: 0.4,
      side: THREE.DoubleSide,
    }),
  )
  const labelMat = track(
    new THREE.MeshPhysicalMaterial({
      map: makeLabelTexture(product.lid, product.name, renderer),
      color: '#cdcdcd',
      roughness: 0.62,
      metalness: 0,
      specularIntensity: 0.4,
      envMapIntensity: 0.5,
    }),
  )
  const waxColor = new THREE.Color(product.wax)
  const waxMat = track(
    new THREE.MeshPhysicalMaterial({
      color: waxColor,
      roughness: 0.38,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      sheen: 0.25,
      sheenColor: waxColor.clone().lerp(new THREE.Color('#ffffff'), 0.5),
      emissive: waxColor,
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    }),
  )
  const wickMat = track(new THREE.MeshStandardMaterial({ color: '#241812', roughness: 0.8 }))

  const tin = new THREE.Group()
  // o pivô de rotação fica no centro da lata, não na base
  tin.position.y = -TIN.H / 2

  const body = new THREE.Mesh(createBodyGeometry(), silver)
  const inner = new THREE.Mesh(createInnerGeometry(), innerMat)
  const wax = new THREE.Mesh(createWaxGeometry(), waxMat)
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.16, 10), wickMat)
  wick.position.y = TIN.WAX_Y + 0.07
  tin.add(body, inner, wax, wick)

  // lid: pivô no centro da tampa, para girar em torno dele
  const lidPivot = new THREE.Group()
  const lid = new THREE.Group()
  lid.position.y = -TIN.LID_H / 2
  lid.add(
    new THREE.Mesh(createLidSideGeometry(), silver),
    new THREE.Mesh(createLidUnderGeometry(), lidUnderMat),
    new THREE.Mesh(createLidRingGeometry(), dark),
    new THREE.Mesh(createLabelGeometry(), labelMat),
  )
  lidPivot.add(lid)
  lidPivot.position.set(0, TIN.LID_Y + TIN.LID_H / 2, 0)
  tin.add(lidPivot)

  // brilho da cera
  const sparkleCount = 160
  const positions = new Float32Array(sparkleCount * 3)
  const phases = new Float32Array(sparkleCount)
  const sizes = new Float32Array(sparkleCount)
  for (let i = 0; i < sparkleCount; i++) {
    const r = Math.sqrt(Math.random()) * 0.86
    const a = Math.random() * Math.PI * 2
    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = TIN.WAX_Y + 0.012
    positions[i * 3 + 2] = Math.sin(a) * r
    phases[i] = Math.random()
    sizes[i] = 2.5 + Math.random() * 5
  }
  const sparkleGeo = new THREE.BufferGeometry()
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  sparkleGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  sparkleGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  const sparkleMat = new THREE.ShaderMaterial({
    vertexShader: sparkleVertex,
    fragmentShader: sparkleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: renderer.getPixelRatio() },
      uVisible: { value: 0 },
      uOpacity: { value: 1 },
    },
  })
  const sparkles = new THREE.Points(sparkleGeo, sparkleMat)
  sparkles.frustumCulled = false
  tin.add(sparkles)

  // chama
  const flameMat = createFlameMaterial()
  const flameGeo = new THREE.PlaneGeometry(0.64, 1.08)
  flameGeo.translate(0, 0.54, 0)
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.renderOrder = 6
  const haloMat = createHaloMaterial()
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), haloMat)
  halo.position.y = 0.45
  halo.renderOrder = 5
  const flameAnchor = new THREE.Group()
  flameAnchor.position.set(0, TIN.WAX_Y + 0.15, 0)
  flameAnchor.add(halo, flame)
  tin.add(flameAnchor)

  const pose = new THREE.Group()
  pose.add(tin)
  const root = new THREE.Group()
  root.add(pose)

  const shadowMat = new THREE.MeshBasicMaterial({
    map: makeShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.42,
  })
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMat)
  shadow.scale.set(3.4, 1, 2.1)
  shadow.position.y = -1.4
  shadow.renderOrder = -1
  root.add(shadow)

  let opacity = 1
  let flameLevel = 0
  const q = new THREE.Quaternion()

  const setOpen = (value: number, portrait = false) => {
    const lift = smooth(value, 0, 0.5)
    const slide = smooth(value, 0.3, 1)
    const baseY = TIN.LID_Y + TIN.LID_H / 2
    if (portrait) {
      // em telas estreitas a tampa fica flutuando acima da lata
      lidPivot.position.set(slide * 0.15, baseY + lift * 1.3 + slide * 1.7, slide * 0.1)
      lidPivot.rotation.set(slide * 0.6 + lift * 0.1, slide * 0.25, -slide * 0.3)
      lidPivot.scale.setScalar(1 - slide * 0.22)
    } else {
      lidPivot.position.set(slide * 2.05, baseY + lift * 1.3 - slide * 0.55, slide * 0.75)
      lidPivot.rotation.set(slide * 0.5 + lift * 0.1, slide * 0.3, -slide * 0.42)
      lidPivot.scale.setScalar(1)
    }
    flameLevel = smooth(value, 0.62, 0.95)
    waxMat.emissiveIntensity = flameLevel * 0.22
    sparkleMat.uniforms.uVisible!.value = smooth(value, 0.35, 0.8)
  }

  const setOpacity = (value: number) => {
    opacity = value
    for (const m of fadeables) m.opacity = value
    shadowMat.opacity = 0.42 * value
    flameMat.uniforms.uOpacity!.value = value
    haloMat.uniforms.uOpacity!.value = value
    sparkleMat.uniforms.uOpacity!.value = value
  }

  const update = (time: number, camera: THREE.Camera) => {
    sparkleMat.uniforms.uTime!.value = time
    flameMat.uniforms.uTime!.value = time
    haloMat.uniforms.uTime!.value = time
    const flicker = 0.9 + 0.1 * Math.sin(time * 11) * Math.sin(time * 5.3 + 1.2)
    flameMat.uniforms.uIntensity!.value = flameLevel * flicker
    haloMat.uniforms.uIntensity!.value = flameLevel * flicker
    flameAnchor.visible = flameLevel > 0.01 && opacity > 0.01
    const s = flameLevel * (0.92 + 0.08 * Math.sin(time * 9))
    flameAnchor.scale.set(s, s * (1 + 0.06 * Math.sin(time * 13)), s)
    if (flameAnchor.visible) {
      tin.getWorldQuaternion(q)
      q.invert().multiply(camera.quaternion)
      flameAnchor.quaternion.copy(q)
    }
  }

  setOpen(0)
  setOpacity(1)

  return {
    root,
    pose,
    shadow,
    flameAnchor,
    setOpacity,
    setOpen,
    get flameLevel() {
      return flameLevel
    },
    update,
  }
}
