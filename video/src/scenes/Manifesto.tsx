import { AbsoluteFill } from "remotion";
import { Reveal } from "../components/Reveal";
import { SceneFade } from "../components/SceneFade";
import { COLORS, FONTS, SAFE } from "../theme";

type Props = { text: string };

export const Manifesto: React.FC<Props> = ({ text }) => {
  const words = text.split(" ");

  return (
    <SceneFade>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 28,
            rowGap: 8,
            fontFamily: FONTS.serif,
            fontWeight: 600,
            fontSize: 116,
            lineHeight: 1.1,
            color: COLORS.cream,
          }}
        >
          {words.map((word, i) => (
            <Reveal key={`${word}-${i}`} delay={6 + i * 4} distance={40}>
              {word}
            </Reveal>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};
