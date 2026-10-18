import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  children: React.ReactNode;
  fadeFrames?: number;
};

// Fade de entrada e saída da cena; combinado com a sobreposição do <Series> vira cross-fade.
export const SceneFade: React.FC<Props> = ({ children, fadeFrames = 12 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
