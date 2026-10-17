import * as THREE from 'three'
import type { LidStyle } from '../data/products'
import { drawLogo } from './logo'

const SIZE = 1024

export const FONT_SANS = '"DM Sans Variable", "DM Sans", system-ui, sans-serif'
export const FONT_SERIF = '"Fraunces Variable", "Fraunces", Georgia, serif'

/** Garante que as fontes da marca estão prontas antes de pintar os adesivos. */
export const ensureFonts = async () => {
  if (!('fonts' in document)) return
  await Promise.all([
    document.fonts.load(`600 40px ${FONT_SANS}`),
    document.fonts.load(`500 40px ${FONT_SANS}`),
    document.fonts.load(`600 40px ${FONT_SERIF}`),
    document.fonts.load(`400 40px ${FONT_SERIF}`),
  ]).catch(() => undefined)
  await document.fonts.ready
}

const spaced = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) => {
  ctx.letterSpacing = `${tracking}px`
  ctx.fillText(text, x, y)
  ctx.letterSpacing = '0px'
}

/** Pinta o adesivo circular da tampa: logo, "First Love Yourself" e a faixa diagonal. */
export const makeLabelTexture = (style: LidStyle, scent: string, renderer?: THREE.WebGLRenderer) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  // opaco até as bordas: a geometria circular já recorta o adesivo
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D indisponível')

  const c = SIZE / 2
  ctx.fillStyle = style.disc
  ctx.fillRect(0, 0, SIZE, SIZE)

  // faixa diagonal inferior
  ctx.fillStyle = style.band
  ctx.beginPath()
  ctx.moveTo(0, 650)
  ctx.lineTo(SIZE, 880)
  ctx.lineTo(SIZE, SIZE)
  ctx.lineTo(0, SIZE)
  ctx.closePath()
  ctx.fill()

  // anel fino
  ctx.strokeStyle = style.line
  ctx.globalAlpha = 0.85
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.arc(c, c, c - 48, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  // logo + assinatura
  drawLogo(ctx, c - 6, 372, 420, style.line, 4.4)

  ctx.save()
  ctx.translate(c, 596)
  ctx.rotate(-0.06)
  ctx.fillStyle = style.line
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 34px ${FONT_SERIF}`
  spaced(ctx, 'FIRST LOVE YOURSELF', 0, 0, 5)
  ctx.restore()

  // texto na faixa
  ctx.save()
  ctx.translate(430, 826)
  ctx.rotate(Math.atan2(230, SIZE))
  ctx.fillStyle = style.bandText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 40px ${FONT_SANS}`
  spaced(ctx, 'Vela Aromática', 0, -26, 0.5)
  ctx.font = `600 50px ${FONT_SANS}`
  spaced(ctx, scent, 0, 34, 0.5)
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8
  texture.needsUpdate = true
  return texture
}

/** Mancha de sombra suave que fica embaixo do produto flutuante. */
export const makeShadowTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.45, 'rgba(0,0,0,0.4)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
