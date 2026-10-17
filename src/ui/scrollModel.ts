const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export const smoothstep = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export type ScrollState = {
  /** scroll suavizado, em px */
  y: number
  vh: number
  /** 0 no topo → 1 quando o ritual encosta */
  heroOut: number
  /** progresso do ritual enquanto ele está fixo */
  ritualP: number
  /** o quanto a seção do ritual já saiu pelo topo */
  ritualExit: number
  fieldP: number
  fieldExit: number
  ctaP: number
  weights: { dark: number; cream: number; red: number }
}

type Sections = { ritual: HTMLElement; field: HTMLElement; cta: HTMLElement }

/**
 * Converte a posição de scroll nativo em progressos por seção.
 * As seções "grudam" via position: sticky; aqui só lemos as medidas.
 */
export const createScrollModel = (els: Sections) => {
  const m = { vh: 1, ritualTop: 0, ritualH: 1, fieldTop: 0, fieldH: 1, ctaTop: 0, ctaH: 1 }
  /** topo (em px absolutos) de cada seção, medido só no resize, nunca por frame */
  const tops = { hero: 0, ritual: 0, field: 0, cta: 0 }
  const state: ScrollState = {
    y: 0,
    vh: 1,
    heroOut: 0,
    ritualP: 0,
    ritualExit: 0,
    fieldP: 0,
    fieldExit: 0,
    ctaP: 0,
    weights: { dark: 0, cream: 0, red: 0 },
  }
  let target = window.scrollY
  let smoothed = target

  const measure = () => {
    const rect = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY
    m.vh = window.innerHeight
    m.ritualTop = rect(els.ritual)
    m.ritualH = els.ritual.offsetHeight
    m.fieldTop = rect(els.field)
    m.fieldH = els.field.offsetHeight
    m.ctaTop = rect(els.cta)
    m.ctaH = els.cta.offsetHeight
    tops.ritual = m.ritualTop
    tops.field = m.fieldTop
    tops.cta = m.ctaTop
  }

  const compute = () => {
    const y = state.y
    state.vh = m.vh
    state.heroOut = clamp01(y / Math.max(m.ritualTop, 1))
    state.ritualP = clamp01((y - m.ritualTop) / Math.max(m.ritualH - m.vh, 1))
    state.ritualExit = clamp01((y - (m.ritualTop + m.ritualH - m.vh)) / m.vh)
    state.fieldP = clamp01((y - m.fieldTop) / Math.max(m.fieldH - m.vh, 1))
    state.fieldExit = clamp01((y - (m.fieldTop + m.fieldH - m.vh)) / m.vh)
    state.ctaP = clamp01((y - m.ctaTop) / Math.max(m.ctaH - m.vh, 1))
    state.weights.dark = smoothstep(state.heroOut, 0.35, 1)
    state.weights.cream = smoothstep(state.ritualExit, 0.1, 0.85)
    state.weights.red = smoothstep(state.fieldExit, 0.1, 0.85)
  }

  const update = (immediate = false) => {
    target = window.scrollY
    smoothed = immediate ? target : smoothed + (target - smoothed) * 0.14
    if (Math.abs(target - smoothed) < 0.05) smoothed = target
    state.y = smoothed
    compute()
    return state
  }

  measure()
  window.addEventListener('resize', measure)
  window.addEventListener('load', measure)

  return { state, update, measure, tops }
}

export type ScrollModel = ReturnType<typeof createScrollModel>
