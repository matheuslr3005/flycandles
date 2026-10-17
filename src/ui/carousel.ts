import gsap from 'gsap'

/** Estado de um "slot" na tela: posição em NDC, escala relativa e giro. */
export type SlotPose = {
  nx: number
  ny: number
  k: number
  rotX: number
  rotY: number
  rotZ: number
  opacity: number
}

type Presets = Record<'main' | 'thumb' | 'out' | 'hidden', SlotPose>

const HERO_TILT = 0.88

/** Posições-chave (em NDC) do herói; no retrato o produto sobe e o thumb vai pro canto. */
export const presetsFor = (aspect: number): Presets => {
  const portrait = aspect < 0.85
  const compact = aspect < 1.25
  return {
    main: {
      nx: portrait ? 0 : compact ? 0.1 : 0.02,
      ny: portrait ? 0.04 : 0.0,
      k: 1,
      rotX: HERO_TILT,
      rotY: 0,
      rotZ: -0.1,
      opacity: 1,
    },
    thumb: {
      nx: portrait ? 0.74 : 0.86,
      ny: portrait ? -0.7 : -0.66,
      k: portrait ? 0.2 : 0.17,
      rotX: HERO_TILT,
      rotY: 0.5,
      rotZ: -0.1,
      opacity: 1,
    },
    out: {
      nx: portrait ? -0.3 : -0.3,
      ny: portrait ? 0.92 : 0.86,
      k: 0.55,
      rotX: HERO_TILT + 0.4,
      rotY: -1.1,
      rotZ: 0.3,
      opacity: 0,
    },
    hidden: {
      nx: portrait ? 0.74 : 0.86,
      ny: portrait ? -0.7 : -0.66,
      k: 0,
      rotX: HERO_TILT,
      rotY: 0.5,
      rotZ: -0.1,
      opacity: 0,
    },
  }
}

const copy = (p: SlotPose): SlotPose => ({ ...p })

export type Carousel = ReturnType<typeof createCarousel>

/**
 * Máquina de estados do herói. Cada lata ocupa um papel (principal, próxima no
 * canto, anterior estacionada fora da tela) e as transições movem as latas
 * entre papéis como na referência: a atual escapa para cima/esquerda
 * desvanecendo enquanto a próxima cresce do canto inferior direito.
 */
export const createCarousel = (count: number, getAspect: () => number) => {
  let index = 0
  let busy = false
  let presets = presetsFor(getAspect())
  const states: SlotPose[] = Array.from({ length: count }, () => copy(presets.hidden))

  const mod = (n: number) => ((n % count) + count) % count

  const assignRoles = () => {
    presets = presetsFor(getAspect())
    for (let i = 0; i < count; i++) {
      const rel = mod(i - index)
      const target =
        rel === 0 ? presets.main : rel === 1 ? presets.thumb : rel === count - 1 ? presets.out : presets.hidden
      Object.assign(states[i] as SlotPose, target)
    }
  }
  assignRoles()

  const go = (dir: 1 | -1, onStart?: (next: number) => void) => {
    if (busy) return false
    busy = true
    presets = presetsFor(getAspect())
    const from = index
    const to = mod(index + dir)
    index = to
    onStart?.(to)

    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        assignRoles()
        busy = false
      },
    })
    const out = states[from] as SlotPose
    const incoming = states[to] as SlotPose

    if (dir === 1) {
      const nextThumb = states[mod(to + 1)] as SlotPose
      // atual: sai para cima/esquerda, desvanece
      tl.to(out, { nx: presets.out.nx, ny: presets.out.ny, k: presets.out.k, rotX: presets.out.rotX, rotZ: presets.out.rotZ, duration: 1.25, ease: 'power3.inOut' }, 0)
      tl.to(out, { rotY: presets.out.rotY, duration: 1.25, ease: 'power2.inOut' }, 0)
      tl.to(out, { opacity: 0, duration: 0.7, ease: 'power1.in' }, 0.12)
      // próxima: cresce do canto até o centro
      incoming.rotY = presets.thumb.rotY + 1.1
      tl.to(incoming, { nx: presets.main.nx, duration: 1.3, ease: 'power3.inOut' }, 0.04)
      tl.to(incoming, { ny: presets.main.ny, duration: 1.3, ease: 'power2.inOut' }, 0.04)
      tl.to(incoming, { k: presets.main.k, rotX: presets.main.rotX, rotZ: presets.main.rotZ, duration: 1.3, ease: 'power3.inOut' }, 0.04)
      tl.to(incoming, { rotY: presets.main.rotY, duration: 1.5, ease: 'power3.out' }, 0.04)
      // nova "próxima" nasce no canto
      Object.assign(nextThumb, presets.hidden)
      tl.to(nextThumb, { k: presets.thumb.k, opacity: 1, duration: 0.8, ease: 'back.out(1.6)' }, 0.65)
    } else {
      const oldThumb = states[mod(from + 1)] as SlotPose
      // atual encolhe para o canto
      tl.to(out, { nx: presets.thumb.nx, ny: presets.thumb.ny, k: presets.thumb.k, rotY: presets.thumb.rotY, duration: 1.2, ease: 'power3.inOut' }, 0)
      tl.to(oldThumb, { k: 0, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0)
      // anterior desce do canto superior esquerdo
      Object.assign(incoming, presets.out, { opacity: 0 })
      tl.to(incoming, { nx: presets.main.nx, ny: presets.main.ny, k: presets.main.k, rotX: presets.main.rotX, rotZ: presets.main.rotZ, duration: 1.3, ease: 'power3.inOut' }, 0.08)
      tl.to(incoming, { rotY: presets.main.rotY, duration: 1.4, ease: 'power3.out' }, 0.08)
      tl.to(incoming, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.3)
    }
    return true
  }

  return {
    states,
    get index() {
      return index
    },
    get busy() {
      return busy
    },
    go,
    snap: assignRoles,
    mod,
  }
}
