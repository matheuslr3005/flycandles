import * as THREE from 'three'
import gsap from 'gsap'
import type { Product } from '../data/products'
import type { Backdrop } from '../ui/backdrop'
import type { Carousel } from '../ui/carousel'
import { smoothstep, type ScrollModel } from '../ui/scrollModel'
import { createCandle } from './candle'
import { createAsterisks, createDust, createLogoStage } from './decor'
import { createField } from './field'
import { createStage } from './stage'

const lerp = THREE.MathUtils.lerp

/** Pose da lata durante o ritual (seção fixa): abrir, acender, respirar. */
const RITUAL = { ny: -0.02, tiltOpen: 0.84 }

export const createWorld = (
  canvas: HTMLCanvasElement,
  products: readonly Product[],
  backdrop: Backdrop,
  scroll: ScrollModel,
  carousel: Carousel,
) => {
  const stage = createStage(canvas)
  const { scene, camera, renderer } = stage

  const candles = products.map((p) => createCandle(p, renderer))
  const heroGroup = new THREE.Group()
  for (const c of candles) heroGroup.add(c.root)
  scene.add(heroGroup)

  const field = createField(products, renderer)
  field.group.rotation.x = 0.98
  field.group.visible = false
  scene.add(field.group)

  const dust = createDust(renderer)
  scene.add(dust.points)
  const asterisks = createAsterisks()
  scene.add(asterisks.group)

  const cta = createLogoStage()
  cta.group.visible = false
  scene.add(cta.group)

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, seen: false }
  const spins = products.map(() => ({ value: 0, velocity: 0 }))
  const drag = { active: false, lastX: 0, id: -1 }
  const intro = { t: 0 }
  const ui = { sizeMul: { v: 1 }, thumbHover: { v: 0 } }

  const isInteractive = (el: EventTarget | null) =>
    el instanceof Element && !!el.closest('a, button, input, [data-no-drag]')

  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    pointer.seen = true
    if (drag.active && e.pointerId === drag.id) {
      const spin = spins[carousel.index]
      if (spin) {
        const dx = e.clientX - drag.lastX
        spin.value += dx * 0.011
        spin.velocity = dx * 0.011
      }
      drag.lastX = e.clientX
    }
  })
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || isInteractive(e.target) || scroll.state.heroOut > 0.35 || carousel.busy) return
    drag.active = true
    drag.lastX = e.clientX
    drag.id = e.pointerId
  })
  const endDrag = () => {
    drag.active = false
  }
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.tx = 0
    pointer.ty = 0
    pointer.seen = false
  })

  stage.onResize(() => carousel.snap())

  const tmp = new THREE.Vector3()
  const flameOffset = new THREE.Vector3()
  const white = new THREE.Color('#ffffff')
  const fillColor = new THREE.Color()

  const place = (
    i: number,
    time: number,
    pose: { nx: number; ny: number; k: number; rotX: number; rotY: number; rotZ: number; opacity: number },
    unit: number,
  ) => {
    const c = candles[i]
    if (!c) return
    const visible = pose.opacity > 0.004 && pose.k > 0.004
    c.root.visible = visible
    if (!visible) return
    stage.ndcToWorld(pose.nx, pose.ny, 0, tmp)
    c.root.position.copy(tmp)
    c.root.scale.setScalar(unit * pose.k)
    const bob = Math.sin(time * 1.05 + i * 1.7) * 0.07
    c.pose.position.y = bob
    c.pose.rotation.set(
      pose.rotX + pointer.y * 0.14 + Math.sin(time * 0.6 + i) * 0.02,
      pose.rotY + (spins[i]?.value ?? 0),
      pose.rotZ - pointer.x * 0.1 + Math.sin(time * 0.8 + i) * 0.025,
    )
    c.shadow.position.y = -1.45 - bob * 0.5
    c.setOpacity(pose.opacity)
  }

  const frame = (time: number) => {
    const sc = scroll.update()
    const palette = backdrop.apply(sc.weights)

    pointer.x += (pointer.tx - pointer.x) * 0.07
    pointer.y += (pointer.ty - pointer.y) * 0.07

    const H = stage.worldHeight(0)
    const unit = stage.unit()
    const active = carousel.index
    const portrait = stage.size.aspect < 0.85

    // lights follow the palette so the aluminium picks up the background colour
    stage.lights.rim.color.copy(palette.rim)
    fillColor.copy(palette.rim).lerp(white, 0.45)
    stage.lights.fill.color.copy(fillColor)
    stage.lights.rim.intensity = lerp(2.6, 3.6, sc.weights.dark)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(palette.bgEdge)
      scene.fog.near = 24
      scene.fog.far = 52
    }

    // ---------- candles (hero → ritual) ----------
    const heroVisible = sc.ritualExit < 0.999
    heroGroup.visible = heroVisible
    heroGroup.position.y = sc.ritualExit * H * 1.25
    if (heroVisible) {
      const e = smoothstep(sc.heroOut, 0, 1)
      const open = smoothstep(sc.ritualP, 0.08, 0.6)
      const dolly = smoothstep(sc.ritualP, 0.6, 1)
      const ritualShift = portrait ? 0 : e * lerp(0, 0.03, open)
      candles.forEach((_, i) => {
        const st = carousel.states[i]
        if (!st) return
        const spin = spins[i]
        if (spin) {
          if (!(drag.active && i === active)) {
            spin.value += spin.velocity
            spin.velocity *= 0.93
            // volta suavemente para a frente
            const turns = Math.round(spin.value / (Math.PI * 2)) * Math.PI * 2
            spin.value += (turns - spin.value) * (0.035 + (i === active ? 0 : 0.2))
          }
        }
        const pose = { ...st }
        let opacity = st.opacity
        if (i === active) {
          pose.nx = lerp(st.nx, 0, e) + ritualShift
          pose.ny = lerp(st.ny, portrait ? -0.22 : RITUAL.ny, e)
          pose.k = st.k * ui.sizeMul.v * lerp(1, portrait ? 0.78 : 0.93, e) * (1 + 0.05 * dolly)
          pose.rotX = lerp(st.rotX, RITUAL.tiltOpen, smoothstep(e * 0.6 + open, 0.2, 1))
          pose.rotZ = lerp(st.rotZ, 0, e)
          pose.rotY = st.rotY + Math.sin(sc.ritualP * Math.PI * 2) * 0.12 * e
          // entrada: cai do alto girando
          const t = intro.t
          pose.ny += (1 - t) * 0.55
          pose.rotY += (1 - t) * 2.6
          pose.k *= 0.6 + 0.4 * t
          opacity *= smoothstep(t, 0, 0.35)
        } else {
          opacity *= (1 - smoothstep(sc.heroOut, 0, 0.3)) * smoothstep(intro.t, 0.55, 1)
          if (i === carousel.mod(active + 1)) pose.k *= 1 + 0.2 * ui.thumbHover.v
        }
        pose.opacity = opacity
        place(i, time, pose, unit)

        const candle = candles[i]
        if (candle) {
          candle.setOpen(i === active ? open : 0, portrait)
          candle.update(time, camera)
        }
      })

      // luz da chama segue a vela ativa
      const lit = candles[active]
      if (lit) {
        const level = lit.flameLevel
        lit.flameAnchor.getWorldPosition(tmp)
        stage.lights.flame.position.copy(tmp).add(flameOffset.set(0, 0.6 * lit.root.scale.x, 0.5))
        const flicker = 0.88 + 0.12 * Math.sin(time * 12) * Math.sin(time * 4.1)
        stage.lights.flame.intensity = level * flicker * 9 * lit.root.scale.x * lit.root.scale.x
      }
    } else {
      stage.lights.flame.intensity = 0
    }

    // ---------- field ----------
    const fieldEnter = sc.ritualExit
    const fieldShown = fieldEnter > 0.001 && sc.fieldExit < 0.999
    field.group.visible = fieldShown
    if (fieldShown) {
      field.group.position.set(0, -(1 - fieldEnter) * H * 1.25 + sc.fieldExit * H * 1.25 - 0.4, -3.5)
      field.group.scale.setScalar(Math.max(0.45, (unit / 1.86) * 0.82))
      field.update(
        time,
        camera,
        sc.fieldP * 11,
        pointer.seen ? { x: pointer.x, y: pointer.y } : null,
      )
    }

    // ---------- CTA logo ----------
    const ctaShown = sc.fieldExit > 0.001
    cta.group.visible = ctaShown
    if (ctaShown) {
      const w = H * stage.size.aspect
      const logoScale = Math.min(H * 0.18, w * 0.26)
      cta.group.scale.setScalar(logoScale)
      cta.group.position.set(0, -(1 - sc.fieldExit) * H * 1.25 + H * 0.2, 0)
      cta.group.rotation.set(
        -pointer.y * 0.25 + Math.sin(time * 0.5) * 0.05,
        pointer.x * 0.4 + Math.sin(time * 0.35) * 0.18 + sc.ctaP * 0.8,
        Math.sin(time * 0.4) * 0.03,
      )
      cta.material.color.copy(palette.ink)
    }

    // ---------- decor ----------
    dust.material.uniforms.uTime!.value = time
    ;(dust.material.uniforms.uPointer!.value as THREE.Vector2).set(pointer.x, pointer.y)
    ;(dust.material.uniforms.uColor!.value as THREE.Color).copy(palette.ink)
    asterisks.material.color.copy(palette.ink)
    asterisks.update(time, pointer)
    asterisks.group.visible = sc.ritualExit < 0.4
    asterisks.group.position.y = sc.ritualExit * H * 1.25

    stage.render()
  }

  const playIntro = () => gsap.to(intro, { t: 1, duration: 2.1, ease: 'power3.out', delay: 0.15 })

  return { stage, frame, playIntro, intro, pointer, ui }
}

export type World = ReturnType<typeof createWorld>
