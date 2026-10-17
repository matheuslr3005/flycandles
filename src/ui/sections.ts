import { logoSvg } from '../three/logo'
import { smoothstep, type ScrollModel, type ScrollState } from './scrollModel'

const q = <T extends HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel)
  if (!el) throw new Error(`Elemento ${sel} não encontrado`)
  return el
}

const STEP_RANGES: readonly [number, number][] = [
  [0.1, 0.38],
  [0.38, 0.64],
  [0.64, 0.86],
]
const FINAL_AT = 0.86

type NavSection = { id: 'hero' | 'ritual' | 'field' | 'cta'; link: HTMLAnchorElement }

/** Textos que dependem do scroll: passos do ritual, cartão do campo, CTA e a pílula da navegação. */
export const initSections = (scroll: ScrollModel) => {
  q('#navLogo').innerHTML = logoSvg()

  const steps = [...document.querySelectorAll<HTMLElement>('.step')]
  const stepLabel = q('#ritualStep')
  const final = q('#ritualFinal')
  const bar = q('#ritualBar')
  const fieldCard = q('#fieldCard')
  const ctaCopy = q('#ctaCopy')
  const thumb = q('#navThumb')

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.nav__pill a')]
  const sections: NavSection[] = links.flatMap((link) => {
    const id = link.dataset.section
    return id === 'hero' || id === 'ritual' || id === 'field' || id === 'cta' ? [{ id, link }] : []
  })

  let activeId = ''
  let lastStep = -2

  const moveThumb = (link: HTMLElement) => {
    thumb.style.width = `${link.offsetWidth}px`
    thumb.style.transform = `translateX(${link.offsetLeft - 6}px)`
  }

  const setActive = (id: string) => {
    if (id === activeId) return
    activeId = id
    for (const s of sections) {
      const on = s.id === id
      s.link.classList.toggle('is-active', on)
      if (on) moveThumb(s.link)
    }
  }

  window.addEventListener('resize', () => {
    const current = sections.find((s) => s.id === activeId)
    if (current) moveThumb(current.link)
  })

  const update = (sc: ScrollState) => {
    // navegação
    const probe = sc.y + sc.vh * 0.5
    let current = sections[0]?.id ?? 'hero'
    for (const s of sections) {
      if (scroll.tops[s.id] <= probe) current = s.id
    }
    setActive(current)

    // ritual
    let stepIndex = -1
    STEP_RANGES.forEach(([a, b], i) => {
      if (sc.ritualP >= a && sc.ritualP < b) stepIndex = i
    })
    const finalOn = sc.ritualP >= FINAL_AT
    const state = finalOn ? 3 : stepIndex
    if (state !== lastStep) {
      lastStep = state
      steps.forEach((s, i) => s.classList.toggle('is-on', i === stepIndex))
      final.classList.toggle('is-on', finalOn)
      if (stepIndex >= 0) stepLabel.textContent = `0${stepIndex + 1} / 03`
    }
    bar.style.transform = `scaleX(${sc.ritualP.toFixed(3)})`

    // cartão do campo
    const cardIn = smoothstep(sc.ritualExit, 0.55, 1) * (1 - smoothstep(sc.fieldExit, 0, 0.35))
    fieldCard.style.opacity = cardIn.toFixed(3)
    fieldCard.style.transform = `translateY(${((1 - cardIn) * 40).toFixed(1)}px)`
    fieldCard.style.pointerEvents = cardIn > 0.5 ? 'auto' : 'none'

    // CTA
    const ctaIn = smoothstep(sc.fieldExit, 0.55, 1)
    ctaCopy.style.opacity = ctaIn.toFixed(3)
    ctaCopy.style.transform = `translateY(${((1 - ctaIn) * 50).toFixed(1)}px)`
    ctaCopy.style.pointerEvents = ctaIn > 0.5 ? 'auto' : 'none'
  }

  // posiciona a pílula da nav na primeira renderização
  requestAnimationFrame(() => {
    const first = sections[0]
    if (first) {
      activeId = ''
      setActive(first.id)
    }
  })

  return { update }
}
