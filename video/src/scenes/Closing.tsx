import { AbsoluteFill } from "remotion";
import { Reveal } from "../components/Reveal";
import { SceneFade } from "../components/SceneFade";
import { COLORS, FONTS, SAFE } from "../theme";

type Props = { title: string; handle: string; brand: string };

export const Closing: React.FC<Props> = ({ title, handle, brand }) => {
  return (
    <SceneFade>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 56,
          padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
        }}
      >
        <Reveal>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontWeight: 800,
              fontSize: 150,
              color: COLORS.cream,
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {title}
          </div>
        </Reveal>
        <Reveal delay={14}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 700,
              fontSize: 60,
              color: COLORS.creamInk,
              background: COLORS.cream,
              padding: "28px 64px",
              borderRadius: 999,
            }}
          >
            {handle}
          </div>
        </Reveal>
        <Reveal delay={30} distance={20}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 500,
              fontSize: 38,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: COLORS.cream,
              opacity: 0.8,
            }}
          >
            {brand}
          </div>
        </Reveal>
      </AbsoluteFill>
    </SceneFade>
  );
};
