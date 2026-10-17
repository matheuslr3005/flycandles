# Fly Candles — protótipo do site

Site interativo em 3D para a Fly Candles (velas aromáticas, *First Love Yourself*).
Vite + TypeScript + Three.js + GSAP, sem nenhum asset externo: as latas, as tampas, a
chama e o logo em 3D são todos gerados por código.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção em dist/
```

Dica: `http://localhost:5173/?nointro` pula o loader de abertura.

## Publicação (GitHub Pages)

O workflow `.github/workflows/deploy.yml` builda e publica a cada push na branch principal.
Na primeira vez, em **Settings → Pages**, deixe **Source = GitHub Actions**. O endereço fica em
`https://<usuario>.github.io/flycandles/`.

## Desempenho

- Fundo (degradê, vinheta e grão) desenhado no próprio canvas, sem `backdrop-filter` nem blend CSS sobre o WebGL.
- Reflexo do alumínio "assado" em matcap no boot; adesivos e cera usam materiais baratos (Lambert/Phong).
- Campo de latas com geometria reduzida e menos latas em celulares; `alphaHash` só durante o fade.
- Resolução adaptativa (baixa o pixel ratio se o quadro passar de ~24 ms), 60 fps no máximo, MSAA desligado em telas touch de alta densidade.

## O que tem

1. **Hero** — carrossel de aromas inspirado na referência: a lata atual escapa para cima/esquerda
   enquanto a próxima cresce do canto inferior direito, e o fundo, a tinta do texto, os botões e a
   luz de recorte mudam de cor junto. Setas, clique na miniatura, teclado (← →), swipe no toque
   e arraste do mouse para girar a lata. O tamanho escolhido (60g/120g/200g) muda preço e escala.
2. **Ritual** (scroll) — a lata se inclina, a tampa levita para o lado, a chama acende e o glitter
   da cera brilha, com os passos *Abra / Acenda / Respire*.
3. **Feitas à mão** — um mar de latas em perspectiva (como na foto da produção), com ondulação que
   reage ao mouse. Instanciado: ~220 latas em poucas draw calls.
4. **Pedidos** — o logo FLY em tubos 3D que acompanha o mouse, com link para o direct.

## Onde mexer

| O quê | Onde |
| --- | --- |
| Aromas, cores de tema, preços, textos | `src/data/products.ts` |
| Traçado do logo (adesivo, 3D, nav, loader) | `src/three/logo.ts` |
| Layout do adesivo da tampa | `src/three/labelTexture.ts` |
| Geometria da lata (medidas, rosca, tampa) | `src/three/tinGeometry.ts` |
| Chama e halo | `src/three/flame.ts` |
| Transições do herói (slots, easings, tempos) | `src/ui/carousel.ts` |
| Posições/poses por scroll | `src/three/world.ts` |
| Paletas por seção | `src/ui/backdrop.ts` |

## Pontos de protótipo (a confirmar com a marca)

- Os aromas **Folha de Figo**, **Baunilha** e **Lavanda** vêm das tampas das fotos. O quarto
  (**Flor de Algodão**, rosa) é um placeholder inspirado no adesivo rosa que aparece numa das fotos.
- Preços, tamanhos (60/120/200 g), descrições olfativas e os números do bloco "Feitas à mão" são
  textos de exemplo.
- O logo FLY foi redesenhado à mão em traço único a partir das fotos; troque o path em
  `src/three/logo.ts` pelo vetor oficial quando houver.
- O botão de pedido leva para o Instagram (`@flycandles.oficial`), já que os pedidos são por direct.
