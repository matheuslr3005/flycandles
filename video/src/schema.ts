import { z } from "zod";

// Tudo que aparece como texto no vídeo fica aqui, editável no painel "Props" do Studio.
export const institutionalSchema = z.object({
  brand: z.string(),
  tagline: z.string(),
  manifesto: z.string(),
  pillars: z.array(z.object({ title: z.string(), detail: z.string() })),
  ctaTitle: z.string(),
  ctaHandle: z.string(),
});

export type InstitutionalProps = z.infer<typeof institutionalSchema>;

export const defaultProps: InstitutionalProps = {
  brand: "FLY CANDLES",
  tagline: "First Love Yourself",
  manifesto: "Velas aromáticas feitas à mão para acender o seu momento.",
  pillars: [
    { title: "Feitas à mão", detail: "Cada lata é preparada uma a uma" },
    { title: "Aromas únicos", detail: "Uma cor e um perfume para cada fase" },
    { title: "60g · 120g · 200g", detail: "O tamanho certo para o seu ritual" },
  ],
  ctaTitle: "Peça a sua",
  ctaHandle: "@flycandles",
};
