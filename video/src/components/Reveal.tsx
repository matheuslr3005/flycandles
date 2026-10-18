import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: React.CSSProperties;
};

// Entra subindo e aparecendo, com mola suave. `delay` em frames.
export const Reveal: React.FC<Props> = ({ children, delay = 0, distance = 60, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 28,
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
