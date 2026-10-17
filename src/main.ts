import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/dm-sans'
import gsap from 'gsap'
import './styles.css'
import { PRODUCTS } from './data/products'
import { ensureFonts } from './three/labelTexture'
import { logoSvg } from './three/logo'
import { createWorld } from './three/world'
import { createBackdrop } from './ui/backdrop'
import { createCarousel } from './ui/carousel'
import { initHero } from './ui/hero'
import { createScrollModel } from './ui/scrollModel'
import { initSections } from './ui/sections'

const must = <T extends HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel)
  if (!el) throw new Error(`Elemento ${sel} não encontrado`)
  return el
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const skipIntro = reduceMotion || new URLSearchParams(window.location.search).has('nointro')

const boot = async () => {
  const intro = must('#intro')
  must('#introMark').innerHTML = logoSvg()
  const introPaths = intro.querySelectorAll('path')
  const introLine = intro.querySelector('.intro__line')

  // desenha o logo enquanto o resto carrega
  const drawn = gsap
    .timeline()
    .to(introPaths, { strokeDashoffset: 0, duration: skipIntro ? 0.01 : 1.3, ease: 'power2.inOut', stagger: 0.12 })
    .to(introLine, { opacity: 0.9, duration: 0.6 }, '-=0.5')
    .then()

  await ensureFonts()

  const backdrop = createBackdrop(PRODUCTS[0]!.theme)
  const sectionEls = {
    ritual: must('#ritual'),
    field: must('#field'),
    cta: must('#cta'),
  }
  const scroll = createScrollModel(sectionEls)
  const carousel = createCarousel(PRODUCTS.length, () => window.innerWidth / window.innerHeight)
  const world = createWorld(must<HTMLCanvasElement>('#stage'), PRODUCTS, backdrop, scroll, carousel)
  const hero = initHero(carousel, backdrop, world)
  const sections = initSections()

  if (import.meta.env.DEV) {
    Object.assign(window, {
      __fly: {
        gsap,
        carousel,
        world,
        scroll,
        jump: (y: number) => {
          window.scrollTo({ top: y, behavior: 'instant' })
          scroll.update(true)
        },
      },
    })
  }

  hero.hideForIntro()
  scroll.update(true)
  world.frame(0)

  gsap.ticker.add((time) => {
    world.frame(time)
    sections.update(scroll.state)
  })

  await drawn
  await gsap.to(intro, {
    clipPath: 'inset(0 0 100% 0)',
    duration: skipIntro ? 0.01 : 1.0,
    ease: 'power4.inOut',
    delay: skipIntro ? 0 : 0.25,
  })
  intro.remove()
  world.playIntro()
  hero.reveal()
  if (skipIntro) gsap.globalTimeline.timeScale(1)
}

boot().catch((err) => {
  console.error(err)
  document.getElementById('intro')?.remove()
})
