import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Brilho de chama que deriva devagar durante o vídeo inteiro.
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const glowX = width * (0.3 + 0.4 * drift);
  const glowY = height * (0.75 - 0.35 * drift);
  const flicker = 0.85 + 0.15 * Math.sin(frame / 5) * Math.sin(frame / 11);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 80% at 50% 30%, ${COLORS.red} 0%, ${COLORS.redDeep} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 700px at ${glowX}px ${glowY}px, rgba(251,240,207,${0.28 * flicker}) 0%, rgba(251,240,207,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(90% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
