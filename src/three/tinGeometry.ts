import * as THREE from 'three'

/** Medidas da lata em unidades de cena (raio = 1). */
export const TIN = {
  R: 1,
  H: 0.8,
  LID_H: 0.34,
  LID_Y: 0.46,
  WAX_Y: 0.62,
  LABEL_R: 0.9,
} as const

const SEG = 96

const lathe = (pts: [number, number][], segments = SEG) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )

/** Casco externo de alumínio, do fundo até a borda. */
export const createBodyGeometry = () =>
  lathe([
    [0, 0],
    [0.9, 0],
    [0.975, 0.014],
    [1.0, 0.05],
    [1.0, 0.44],
    [0.99, 0.468],
    [0.958, 0.5],
    [0.955, 0.77],
    [0.945, 0.795],
    [0.93, 0.8],
  ])

/** Parede interna, que reflete a cor da cera. */
export const createInnerGeometry = () =>
  lathe([
    [0.93, 0.8],
    [0.915, 0.795],
    [0.915, 0.12],
    [0.88, 0.1],
    [0, 0.1],
  ])

/** Lateral da tampa, com os frisos de rosca. */
export const createLidSideGeometry = () => {
  const pts: [number, number][] = [[1.02, 0]]
  const ridges = 7
  const steps = 70
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = 0.012 + t * 0.285
    const wave = 0.5 - 0.5 * Math.cos(t * ridges * Math.PI * 2)
    pts.push([1.036 + wave * 0.016, y])
  }
  pts.push([1.045, 0.318], [1.03, 0.335], [0.99, 0.34])
  return lathe(pts)
}

/** Parte de baixo da tampa (visível quando ela está virada). */
export const createLidUnderGeometry = () =>
  lathe([
    [1.02, 0],
    [0.985, 0.012],
    [0.985, 0.29],
    [0.96, 0.312],
    [0, 0.312],
  ])

export const createLidRingGeometry = () => {
  const g = new THREE.RingGeometry(TIN.LABEL_R - 0.01, 0.99, SEG, 1)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0.3445, 0)
  return g
}

export const createLabelGeometry = () => {
  const g = new THREE.CircleGeometry(TIN.LABEL_R, SEG)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0.348, 0)
  return g
}

/** Superfície da cera com um leve menisco junto da parede. */
export const createWaxGeometry = () =>
  lathe(
    [
      [0, 0.62],
      [0.86, 0.62],
      [0.905, 0.632],
      [0.915, 0.65],
    ],
    64,
  )
