import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Reveal } from "../components/Reveal";
import { SceneFade } from "../components/SceneFade";
import { COLORS, FONTS, SAFE } from "../theme";

type Props = { brand: string; tagline: string };

export const Opening: React.FC<Props> = ({ brand, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ring = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 60 });

  return (
    <SceneFade>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
        }}
      >
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            border: `4px solid ${COLORS.cream}`,
            opacity: 0.5 * ring,
            transform: `scale(${interpolate(ring, [0, 1], [0.4, 1])})`,
            position: "absolute",
          }}
        />
        <Reveal delay={10}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontWeight: 800,
              fontSize: 170,
              lineHeight: 0.95,
              color: COLORS.cream,
              textAlign: "center",
              letterSpacing: -4,
            }}
          >
            {brand}
          </div>
        </Reveal>
        <Reveal delay={30} distance={30} style={{ marginTop: 48 }}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 500,
              fontSize: 52,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: COLORS.cream,
              textAlign: "center",
            }}
          >
            {tagline}
          </div>
        </Reveal>
      </AbsoluteFill>
    </SceneFade>
  );
};
