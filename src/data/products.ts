export type LidStyle = {
  /** Cor de fundo do adesivo da tampa */
  disc: string
  /** Cor do logo, do anel fino e do texto sobre o disco */
  line: string
  /** Cor da faixa diagonal inferior */
  band: string
  /** Cor do texto sobre a faixa */
  bandText: string
}

export type Theme = {
  /** Centro do degradê radial do fundo */
  bgCenter: string
  /** Bordas do degradê radial do fundo */
  bgEdge: string
  /** Cor dos textos sobre o fundo */
  ink: string
  /** Cor da pílula/botão primário */
  pill: string
  /** Cor do texto dentro da pílula */
  pillInk: string
  /** Luz de recorte que "sangra" a cor do fundo no alumínio */
  rim: string
}

export type Product = {
  id: string
  name: string
  /** Notas olfativas, em uma linha */
  notes: string
  description: string
  lid: LidStyle
  theme: Theme
  /** Tom da cera, visto quando a lata está aberta */
  wax: string
  /** Preços por tamanho, em reais (valores de protótipo) */
  prices: readonly [number, number, number]
  oldPrices: readonly [number, number, number]
}

export const SIZES = ['60g', '120g', '200g'] as const
export const SIZE_SCALE = [0.9, 1, 1.12] as const

export const BRAND = {
  name: 'Fly Candles',
  tagline: 'First Love Yourself',
  instagram: 'https://instagram.com/flycandles.oficial',
  handle: '@flycandles.oficial',
  maker: '@galaggio',
} as const

export const PRODUCTS: readonly Product[] = [
  {
    id: 'folha-de-figo',
    name: 'Folha de Figo',
    notes: 'verde · leitoso · solar',
    description:
      'Folha esmagada, figo maduro e um fundo de madeira clara. Um aroma que lembra quintal de verão e faz a tarde desacelerar.',
    lid: { disc: '#c9161d', line: '#f5e9bd', band: '#f5e9bd', bandText: '#b5121a' },
    theme: {
      bgCenter: '#e3262d',
      bgEdge: '#6e0911',
      ink: '#fbf0cf',
      pill: '#fbf0cf',
      pillInk: '#7a0c14',
      rim: '#ff6b5a',
    },
    wax: '#d98a4a',
    prices: [29, 42, 59],
    oldPrices: [35, 49, 69],
  },
  {
    id: 'baunilha',
    name: 'Baunilha',
    notes: 'cremosa · quente · abraço',
    description:
      'Baunilha de padaria, açúcar queimado e um toque de leite morno. O cheiro de quando a casa inteira está em paz.',
    lid: { disc: '#f2e3b0', line: '#c9161d', band: '#c9161d', bandText: '#f5e9bd' },
    theme: {
      bgCenter: '#f6e7b4',
      bgEdge: '#c79b4e',
      ink: '#7a0c14',
      pill: '#b5121a',
      pillInk: '#fbf0cf',
      rim: '#ffd98a',
    },
    wax: '#f1d9a0',
    prices: [29, 42, 59],
    oldPrices: [35, 49, 69],
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    notes: 'floral · fresca · calma',
    description:
      'Lavanda de campo, um sopro de ervas e um fundo suave de musgo. Para o fim do dia, para o banho demorado, para dormir bem.',
    lid: { disc: '#e9e6f6', line: '#c9161d', band: '#c9161d', bandText: '#f5e9bd' },
    theme: {
      bgCenter: '#d7d0f2',
      bgEdge: '#7f72bd',
      ink: '#33245f',
      pill: '#33245f',
      pillInk: '#efeaff',
      rim: '#bfb2ff',
    },
    wax: '#b9a4e0',
    prices: [29, 42, 59],
    oldPrices: [35, 49, 69],
  },
  {
    id: 'rose',
    name: 'Flor de Algodão',
    notes: 'limpa · macia · rosada',
    description:
      'Lençol recém-lavado, pétala de rosa clara e almíscar. Leve, delicada e feita pra quem se escolhe primeiro.',
    lid: { disc: '#f6c3cc', line: '#a60f2b', band: '#a60f2b', bandText: '#fde8d9' },
    theme: {
      bgCenter: '#f7b3c2',
      bgEdge: '#b63a62',
      ink: '#560b25',
      pill: '#560b25',
      pillInk: '#ffe9ef',
      rim: '#ffb0c8',
    },
    wax: '#f3a2b8',
    prices: [29, 42, 59],
    oldPrices: [35, 49, 69],
  },
]
