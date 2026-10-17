import gsap from 'gsap'
import { PRODUCTS, SIZES, SIZE_SCALE } from '../data/products'
import type { World } from '../three/world'
import type { Backdrop } from './backdrop'
import type { Carousel } from './carousel'

const byId = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Elemento #${id} não encontrado`)
  return el as T
}

const brl = (n: number) => `R$ ${n}`

/** Conecta o DOM do herói (texto, preço, tamanhos, setas) ao carrossel 3D. */
export const initHero = (carousel: Carousel, backdrop: Backdrop, world: World) => {
  const title = byId('heroTitle')
  const notes = byId('heroNotes')
  const desc = byId('heroDesc')
  const idx = byId('heroIdx')
  const total = byId('heroTotal')
  const priceNow = byId('priceNow')
  const priceOld = byId('priceOld')
  const sizesEl = byId('sizes')
  const nextName = byId('heroNextName')
  const nextBtn = byId<HTMLButtonElement>('heroNext')
  const fav = byId<HTMLButtonElement>('fav')

  let sizeIndex = 1
  const favorites = new Set<string>()
  total.textContent = String(PRODUCTS.length).padStart(2, '0')

  const sizeButtons = SIZES.map((label, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'size'
    b.setAttribute('role', 'radio')
    b.textContent = label
    b.addEventListener('click', () => selectSize(i))
    sizesEl.append(b)
    return b
  })

  const paintPrice = () => {
    const p = PRODUCTS[carousel.index]
    if (!p) return
    priceNow.textContent = brl(p.prices[sizeIndex] ?? 0)
    priceOld.textContent = brl(p.oldPrices[sizeIndex] ?? 0)
  }

  const paintSizes = () => {
    sizeButtons.forEach((b, i) => b.setAttribute('aria-checked', String(i === sizeIndex)))
  }

  function selectSize(i: number) {
    if (i === sizeIndex) return
    sizeIndex = i
    paintSizes()
    gsap.fromTo(priceNow, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
    paintPrice()
    gsap.to(world.ui.sizeMul, { v: SIZE_SCALE[i] ?? 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' })
  }

  const paintFav = () => {
    const p = PRODUCTS[carousel.index]
    fav.setAttribute('aria-pressed', String(!!p && favorites.has(p.id)))
  }

  fav.addEventListener('click', () => {
    const p = PRODUCTS[carousel.index]
    if (!p) return
    if (favorites.has(p.id)) favorites.delete(p.id)
    else favorites.add(p.id)
    paintFav()
    gsap.fromTo(fav, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.5)' })
  })

  const paintStatic = (i: number) => {
    const p = PRODUCTS[i]
    const next = PRODUCTS[carousel.mod(i + 1)]
    if (!p || !next) return
    title.textContent = p.name
    notes.textContent = p.notes
    desc.textContent = p.description
    idx.textContent = String(i + 1).padStart(2, '0')
    nextName.textContent = next.name
    paintPrice()
    paintFav()
  }

  const fadeTargets = [notes, desc, priceNow.parentElement, idx, nextName].filter(
    (el): el is HTMLElement => !!el,
  )

  const swap = (to: number, dir: 1 | -1) => {
    const p = PRODUCTS[to]
    if (!p) return
    const tl = gsap.timeline()
    tl.to(title, { yPercent: -110 * dir, duration: 0.45, ease: 'power3.in' }, 0)
    tl.to(fadeTargets, { opacity: 0, y: -10 * dir, duration: 0.35, ease: 'power2.in', stagger: 0.03 }, 0)
    tl.add(() => paintStatic(to))
    tl.fromTo(title, { yPercent: 110 * dir }, { yPercent: 0, duration: 0.9, ease: 'power4.out' }, '>0.02')
    tl.fromTo(
      fadeTargets,
      { opacity: 0, y: 16 * dir },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 },
      '<0.08',
    )

    const apply = backdrop.heroTarget(p.theme)
    const t = { v: 0 }
    gsap.to(t, { v: 1, duration: 1.45, ease: 'power2.inOut', onUpdate: () => apply(t.v) })
  }

  const go = (dir: 1 | -1) => {
    carousel.go(dir, (to) => swap(to, dir))
  }

  document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((b) => {
    b.addEventListener('click', () => go(Number(b.dataset.dir) > 0 ? 1 : -1))
  })
  nextBtn.addEventListener('click', () => go(1))
  nextBtn.addEventListener('pointerenter', () => {
    gsap.to(world.ui.thumbHover, { v: 1, duration: 0.5, ease: 'power3.out' })
  })
  nextBtn.addEventListener('pointerleave', () => {
    gsap.to(world.ui.thumbHover, { v: 0, duration: 0.6, ease: 'power3.out' })
  })

  window.addEventListener('keydown', (e) => {
    if (window.scrollY > window.innerHeight * 0.5) return
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
  })

  // swipe horizontal em toque
  let touchStart: { x: number; y: number } | null = null
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') touchStart = { x: e.clientX, y: e.clientY }
  })
  window.addEventListener('pointerup', (e) => {
    if (!touchStart || e.pointerType !== 'touch') return
    const dx = e.clientX - touchStart.x
    const dy = e.clientY - touchStart.y
    touchStart = null
    if (window.scrollY > window.innerHeight * 0.5) return
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1)
  })

  paintSizes()
  paintStatic(0)

  /** Revelação inicial do texto do herói (depois do loader). */
  const reveal = () => {
    const copy = document.querySelectorAll('.hero__controls, .hero__eyebrow, .hero__notes, .hero__desc, .hero__cta, .hero__buy > *, .hero__tag, .hero__social, .hero__next, .hero__scroll')
    gsap.fromTo(
      title,
      { yPercent: 115 },
      { yPercent: 0, duration: 1.1, ease: 'power4.out' },
    )
    gsap.fromTo(
      copy,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.15, clearProps: 'transform' },
    )
  }

  const hideForIntro = () => {
    gsap.set(title, { yPercent: 115 })
    gsap.set(
      '.hero__controls, .hero__eyebrow, .hero__notes, .hero__desc, .hero__cta, .hero__buy > *, .hero__tag, .hero__social, .hero__next, .hero__scroll',
      { opacity: 0 },
    )
  }

  return { reveal, hideForIntro, go }
}
