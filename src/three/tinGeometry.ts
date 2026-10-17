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

/** Resolução da geometria: a lata do herói usa `HERO`; as do campo (muitas, pequenas) usam `FIELD`. */
export type Detail = { segments: number; ridgeSteps: number }
export const HERO: Detail = { segments: 72, ridgeSteps: 56 }
export const FIELD: Detail = { segments: 28, ridgeSteps: 14 }

const lathe = (pts: [number, number][], segments: number) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )

/** Casco externo de alumínio, do fundo até a borda. */
export const createBodyGeometry = ({ segments }: Detail = HERO) =>
  lathe(
    [
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
    ],
    segments,
  )

/** Parede interna, que reflete a cor da cera. */
export const createInnerGeometry = ({ segments }: Detail = HERO) =>
  lathe(
    [
      [0.93, 0.8],
      [0.915, 0.795],
      [0.915, 0.12],
      [0.88, 0.1],
      [0, 0.1],
    ],
    segments,
  )

/** Lateral da tampa, com os frisos de rosca. */
export const createLidSideGeometry = ({ segments, ridgeSteps }: Detail = HERO) => {
  const pts: [number, number][] = [[1.02, 0]]
  const ridges = 7
  for (let i = 0; i <= ridgeSteps; i++) {
    const t = i / ridgeSteps
    const y = 0.012 + t * 0.285
    const wave = 0.5 - 0.5 * Math.cos(t * ridges * Math.PI * 2)
    pts.push([1.036 + wave * 0.016, y])
  }
  pts.push([1.045, 0.318], [1.03, 0.335], [0.99, 0.34])
  return lathe(pts, segments)
}

/** Parte de baixo da tampa (visível quando ela está virada). */
export const createLidUnderGeometry = ({ segments }: Detail = HERO) =>
  lathe(
    [
      [0, 0.312],
      [0.96, 0.312],
      [0.985, 0.29],
      [0.985, 0.012],
      [1.02, 0],
    ],
    segments,
  )

export const createLidRingGeometry = ({ segments }: Detail = HERO) => {
  const g = new THREE.RingGeometry(TIN.LABEL_R - 0.01, 0.99, segments, 1)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0.3445, 0)
  return g
}

export const createLabelGeometry = ({ segments }: Detail = HERO) => {
  const g = new THREE.CircleGeometry(TIN.LABEL_R, segments)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0.348, 0)
  return g
}

/** Superfície da cera com um leve menisco junto da parede. */
export const createWaxGeometry = ({ segments }: Detail = HERO) =>
  lathe(
    [
      [0.915, 0.65],
      [0.905, 0.632],
      [0.86, 0.62],
      [0, 0.62],
    ],
    segments,
  )
