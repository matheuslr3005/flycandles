# Fly Candles — vídeo institucional (Remotion)

Animações do vídeo institucional em formato vertical **1080×1920 (9:16)**, 30 fps, para Reels, Stories, Shorts e TikTok.
Usa a mesma paleta e as mesmas fontes (Fraunces e DM Sans) do site.

```bash
npm install
npm run dev          # abre o Remotion Studio
npm run render       # gera out/institucional.mp4
npm run still        # gera out/capa.png (frame 0)
npm run lint         # eslint + tsc
```

## Estrutura

```
src/
  Root.tsx             registra a composição "Institucional"
  Institutional.tsx    monta as cenas em <Series> com cross-fade e calcula a duração total
  schema.ts            textos editáveis (zod) e valores padrão, editáveis no painel Props do Studio
  theme.ts             cores, fontes, formato do vídeo e área segura
  scenes/              Opening, Manifesto, Pillars, Closing
  components/          Background, SceneFade, Reveal
public/fonts/          fontes variáveis locais (a renderização não depende de rede)
```

## Como trabalhar

- **Textos**: altere em `src/schema.ts` (`defaultProps`) ou direto no painel Props do Studio.
- **Duração das cenas**: `SCENE_FRAMES` em `src/Institutional.tsx`; a duração total é recalculada sozinha.
- **Nova cena**: crie um componente em `src/scenes/` e adicione um `<Series.Sequence>`.
- **Área segura**: as redes cobrem o topo e o rodapé; mantenha texto dentro de `SAFE` (`src/theme.ts`).
- Os textos atuais (pilares, @ do Instagram) são provisórios: troque pelo conteúdo real.
