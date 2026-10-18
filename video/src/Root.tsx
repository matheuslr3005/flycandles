import { Composition } from "remotion";
import {
  Institutional,
  INSTITUTIONAL_DURATION,
  calculateInstitutionalMetadata,
} from "./Institutional";
import { defaultProps, institutionalSchema } from "./schema";
import { VIDEO } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Institucional"
      component={Institutional}
      schema={institutionalSchema}
      defaultProps={defaultProps}
      durationInFrames={INSTITUTIONAL_DURATION}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      calculateMetadata={calculateInstitutionalMetadata}
    />
  );
};
