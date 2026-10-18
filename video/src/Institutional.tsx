import { AbsoluteFill, CalculateMetadataFunction, Series } from "remotion";
import { Background } from "./components/Background";
import { Closing } from "./scenes/Closing";
import { Manifesto } from "./scenes/Manifesto";
import { Opening } from "./scenes/Opening";
import { Pillars } from "./scenes/Pillars";
import type { InstitutionalProps } from "./schema";
import { VIDEO } from "./theme";

// Duração de cada cena em frames, e quanto uma cena se sobrepõe à anterior (cross-fade).
const OVERLAP = 12;
const SCENE_FRAMES = {
  opening: 105,
  manifesto: 135,
  pillars: 180,
  closing: 120,
} as const;

const SCENE_COUNT = Object.keys(SCENE_FRAMES).length;

export const INSTITUTIONAL_DURATION =
  Object.values(SCENE_FRAMES).reduce((sum, frames) => sum + frames, 0) -
  OVERLAP * (SCENE_COUNT - 1);

export const calculateInstitutionalMetadata: CalculateMetadataFunction<
  InstitutionalProps
> = () => ({
  durationInFrames: INSTITUTIONAL_DURATION,
  fps: VIDEO.fps,
  width: VIDEO.width,
  height: VIDEO.height,
});

export const Institutional: React.FC<InstitutionalProps> = ({
  brand,
  tagline,
  manifesto,
  pillars,
  ctaTitle,
  ctaHandle,
}) => {
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={SCENE_FRAMES.opening}>
          <Opening brand={brand} tagline={tagline} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.manifesto} offset={-OVERLAP}>
          <Manifesto text={manifesto} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.pillars} offset={-OVERLAP}>
          <Pillars pillars={pillars} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_FRAMES.closing} offset={-OVERLAP}>
          <Closing title={ctaTitle} handle={ctaHandle} brand={brand} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
