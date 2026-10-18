import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Mesma paleta e tipografia do site (src/styles.css na raiz do repositório).
export const COLORS = {
  red: "#e3262d",
  redDeep: "#6e0911",
  cream: "#fbf0cf",
  creamInk: "#7a0c14",
} as const;

// Fontes variáveis (as mesmas do site) servidas de public/fonts: não dependem de rede na renderização.
export const FONTS = {
  serif: "Fraunces",
  sans: "DM Sans",
} as const;

loadFont({
  family: FONTS.serif,
  url: staticFile("fonts/fraunces-latin-wght-normal.woff2"),
  weight: "100 900",
});

loadFont({
  family: FONTS.sans,
  url: staticFile("fonts/dm-sans-latin-wght-normal.woff2"),
  weight: "100 1000",
});

// Formato vertical 9:16 (Reels, Stories, Shorts, TikTok).
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

// A interface das redes cobre topo e rodapé: mantenha texto dentro desta área.
export const SAFE = {
  top: 220,
  bottom: 380,
  side: 80,
} as const;
