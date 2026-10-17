import * as THREE from 'three'

/**
 * Logo FLY (traço único, sorriso embaixo, asterisco no canto).
 * Caixa de desenho de 200 x 200. O mesmo traçado alimenta o adesivo da tampa
 * (Path2D) e o logo 3D (tubo ao longo do caminho).
 */
export const LOGO_STROKES = {
  stem: 'M60,30 C56,58 52,88 50,114',
  topArm: 'M58,34 C76,24 100,24 114,36',
  midArm: 'M55,70 C70,64 84,64 96,68',
  loop: 'M100,44 C95,70 94,94 108,106 C122,116 144,108 154,88',
  yArm: 'M134,46 C130,66 134,86 144,102',
  smile: 'M52,120 C58,148 100,162 138,144 C158,134 166,112 162,86',
} as const

export const LOGO_ASTERISK = 'M178,40 L178,58 M170,44 L186,54 M186,44 L170,54'

const LOGO_BOUNDS = { minX: 46, maxX: 190, minY: 22, maxY: 164 }

/** Desenha o logo em um contexto 2D, centralizado em (cx, cy) com largura `size`. */
export const drawLogo = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  lineWidth = 4.6,
) => {
  const bw = LOGO_BOUNDS.maxX - LOGO_BOUNDS.minX
  const bh = LOGO_BOUNDS.maxY - LOGO_BOUNDS.minY
  const k = size / bw
  ctx.save()
  ctx.translate(cx - (bw / 2 + LOGO_BOUNDS.minX) * k, cy - (bh / 2 + LOGO_BOUNDS.minY) * k)
  ctx.scale(k, k)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const d of Object.values(LOGO_STROKES)) ctx.stroke(new Path2D(d))
  ctx.stroke(new Path2D(LOGO_ASTERISK))
  ctx.restore()
}

/** SVG do logo para uso no DOM (nav, loader). */
export const logoSvg = (className = '') => {
  const paths = Object.values(LOGO_STROKES)
    .map((d) => `<path d="${d}" pathLength="1"/>`)
    .join('')
  return `<svg class="${className}" viewBox="40 16 156 154" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}<path d="${LOGO_ASTERISK}" pathLength="1"/></svg>`
}

const pathToPoints = (d: string, samples = 48): THREE.Vector3[][] => {
  const result: THREE.Vector3[][] = []
  const tokens = d.match(/[MLC]|-?\d+\.?\d*/g) ?? []
  let i = 0
  let cur = new THREE.Vector2()
  let sub: THREE.Vector2[] = []
  const flush = () => {
    if (sub.length > 1) result.push(sub.map((p) => new THREE.Vector3(p.x, -p.y, 0)))
    sub = []
  }
  const num = () => Number(tokens[i++])
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M') {
      flush()
      cur = new THREE.Vector2(num(), num())
      sub.push(cur.clone())
    } else if (cmd === 'L') {
      cur = new THREE.Vector2(num(), num())
      sub.push(cur.clone())
    } else if (cmd === 'C') {
      while (i < tokens.length && !/[MLC]/.test(tokens[i] ?? '')) {
        const c1 = new THREE.Vector2(num(), num())
        const c2 = new THREE.Vector2(num(), num())
        const end = new THREE.Vector2(num(), num())
        const curve = new THREE.CubicBezierCurve(cur, c1, c2, end)
        for (let s = 1; s <= samples; s++) sub.push(curve.getPoint(s / samples))
        cur = end
      }
    }
  }
  flush()
  return result
}

/**
 * Logo em 3D: tubos arredondados seguindo o traçado, com tampas esféricas.
 * Retorna um Group centralizado na origem com ~2 unidades de largura.
 */
export const buildLogo3D = (material: THREE.Material, thickness = 0.045) => {
  const group = new THREE.Group()
  const bw = LOGO_BOUNDS.maxX - LOGO_BOUNDS.minX
  const bh = LOGO_BOUNDS.maxY - LOGO_BOUNDS.minY
  const k = 2 / bw
  const cx = LOGO_BOUNDS.minX + bw / 2
  const cy = -(LOGO_BOUNDS.minY + bh / 2)
  const capGeo = new THREE.SphereGeometry(thickness, 12, 8)

  const strokes = [...Object.values(LOGO_STROKES), LOGO_ASTERISK]
  for (const d of strokes) {
    for (const pts of pathToPoints(d)) {
      const mapped = pts.map((p) => new THREE.Vector3((p.x - cx) * k, (p.y - cy) * k, 0))
      const first = mapped[0]
      const last = mapped[mapped.length - 1]
      if (!first || !last) continue
      const curve =
        mapped.length === 2
          ? new THREE.LineCurve3(first, last)
          : new THREE.CatmullRomCurve3(mapped, false, 'centripetal')
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(8, mapped.length), thickness, 8, false),
        material,
      )
      group.add(tube)
      for (const end of [first, last]) {
        const cap = new THREE.Mesh(capGeo, material)
        cap.position.copy(end)
        group.add(cap)
      }
    }
  }
  return group
}
