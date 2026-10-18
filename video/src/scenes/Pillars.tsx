import { AbsoluteFill } from "remotion";
import { Reveal } from "../components/Reveal";
import { SceneFade } from "../components/SceneFade";
import { COLORS, FONTS, SAFE } from "../theme";
import type { InstitutionalProps } from "../schema";

type Props = { pillars: InstitutionalProps["pillars"] };

const STAGGER = 22;

export const Pillars: React.FC<Props> = ({ pillars }) => {
  return (
    <SceneFade>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 90,
          padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
        }}
      >
        {pillars.map((pillar, i) => (
          <Reveal key={pillar.title} delay={8 + i * STAGGER}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontWeight: 800,
                  fontSize: 120,
                  color: COLORS.cream,
                  opacity: 0.45,
                  minWidth: 130,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.serif,
                    fontWeight: 600,
                    fontSize: 84,
                    lineHeight: 1.05,
                    color: COLORS.cream,
                  }}
                >
                  {pillar.title}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontFamily: FONTS.sans,
                    fontWeight: 400,
                    fontSize: 42,
                    lineHeight: 1.3,
                    color: COLORS.cream,
                    opacity: 0.85,
                  }}
                >
                  {pillar.detail}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </AbsoluteFill>
    </SceneFade>
  );
};
