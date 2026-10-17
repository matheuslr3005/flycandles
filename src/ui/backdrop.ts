import * as THREE from 'three'
import type { Theme } from '../data/products'

export type Palette = {
  bgCenter: THREE.Color
  bgEdge: THREE.Color
  ink: THREE.Color
  pill: THREE.Color
  pillInk: THREE.Color
  rim: THREE.Color
}

const toPalette = (t: Theme): Palette => ({
  bgCenter: new THREE.Color(t.bgCenter),
  bgEdge: new THREE.Color(t.bgEdge),
  ink: new THREE.Color(t.ink),
  pill: new THREE.Color(t.pill),
  pillInk: new THREE.Color(t.pillInk),
  rim: new THREE.Color(t.rim),
})

const clonePalette = (p: Palette): Palette => ({
  bgCenter: p.bgCenter.clone(),
  bgEdge: p.bgEdge.clone(),
  ink: p.ink.clone(),
  pill: p.pill.clone(),
  pillInk: p.pillInk.clone(),
  rim: p.rim.clone(),
})

const mixInto = (out: Palette, to: Palette, w: number) => {
  if (w <= 0) return
  out.bgCenter.lerp(to.bgCenter, w)
  out.bgEdge.lerp(to.bgEdge, w)
  out.ink.lerp(to.ink, w)
  out.pill.lerp(to.pill, w)
  out.pillInk.lerp(to.pillInk, w)
  out.rim.lerp(to.rim, w)
}

const CREAM: Palette = toPalette({
  bgCenter: '#f6efdc',
  bgEdge: '#ddc99c',
  ink: '#7a0c14',
  pill: '#b5121a',
  pillInk: '#fbf0cf',
  rim: '#ffe2a8',
})

const RED: Palette = toPalette({
  bgCenter: '#dc272e',
  bgEdge: '#74090f',
  ink: '#fbf0cf',
  pill: '#fbf0cf',
  pillInk: '#7a0c14',
  rim: '#ff7a63',
})

const BLACK = new THREE.Color('#050102')

/** Versão "noite à luz de vela" do tema do produto, usada na seção do ritual. */
const nightOf = (hero: Palette): Palette => {
  const ember = new THREE.Color('#ffb76b')
  return {
    bgCenter: hero.bgEdge.clone().lerp(BLACK, 0.42),
    bgEdge: hero.bgEdge.clone().lerp(BLACK, 0.86),
    ink: new THREE.Color('#fbf0cf'),
    pill: new THREE.Color('#fbf0cf'),
    pillInk: new THREE.Color('#2a0a0e'),
    rim: ember,
  }
}

export type PaletteWeights = { dark: number; cream: number; red: number }

/**
 * Tema do herói (animado entre produtos) + mistura por scroll com as paletas
 * das seções seguintes. Escreve tudo em variáveis CSS no <html>.
 */
export const createBackdrop = (initial: Theme) => {
  const hero = toPalette(initial)
  const current = clonePalette(hero)
  const root = document.documentElement
  const cache = new Map<string, string>()

  const setVar = (name: string, value: string) => {
    if (cache.get(name) === value) return
    cache.set(name, value)
    root.style.setProperty(name, value)
  }

  const apply = (w: PaletteWeights) => {
    current.bgCenter.copy(hero.bgCenter)
    current.bgEdge.copy(hero.bgEdge)
    current.ink.copy(hero.ink)
    current.pill.copy(hero.pill)
    current.pillInk.copy(hero.pillInk)
    current.rim.copy(hero.rim)
    mixInto(current, nightOf(hero), w.dark)
    mixInto(current, CREAM, w.cream)
    mixInto(current, RED, w.red)
    setVar('--bg-c', `#${current.bgCenter.getHexString()}`)
    setVar('--bg-e', `#${current.bgEdge.getHexString()}`)
    setVar('--ink', `#${current.ink.getHexString()}`)
    setVar('--pill', `#${current.pill.getHexString()}`)
    setVar('--pill-ink', `#${current.pillInk.getHexString()}`)
    return current
  }

  /** Anima o tema do herói até o do próximo produto. Retorna o progresso 0..1 via callback. */
  const heroTarget = (theme: Theme) => {
    const from = clonePalette(hero)
    const to = toPalette(theme)
    return (t: number) => {
      hero.bgCenter.copy(from.bgCenter).lerp(to.bgCenter, t)
      hero.bgEdge.copy(from.bgEdge).lerp(to.bgEdge, t)
      hero.ink.copy(from.ink).lerp(to.ink, t)
      hero.pill.copy(from.pill).lerp(to.pill, t)
      hero.pillInk.copy(from.pillInk).lerp(to.pillInk, t)
      hero.rim.copy(from.rim).lerp(to.rim, t)
    }
  }

  return { current, apply, heroTarget }
}

export type Backdrop = ReturnType<typeof createBackdrop>
