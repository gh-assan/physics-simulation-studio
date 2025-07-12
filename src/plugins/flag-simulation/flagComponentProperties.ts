import { ComponentControlProperty } from "../../studio/types";

export const flagComponentProperties: ComponentControlProperty[] = [
  { property: "width", type: "number", label: "Flag Width", min: 0.1, max: 10, step: 0.1 },
  { property: "height", type: "number", label: "Flag Height", min: 0.1, max: 10, step: 0.1 },
  { property: "segmentsX", type: "number", label: "Segments X", min: 1, max: 50, step: 1 },
  { property: "segmentsY", type: "number", label: "Segments Y", min: 1, max: 50, step: 1 },
  { property: "mass", type: "number", label: "Particle Mass", min: 0.01, max: 1, step: 0.01 },
  { property: "stiffness", type: "number", label: "Stiffness", min: 0.1, max: 1, step: 0.01 },
  { property: "damping", type: "number", label: "Damping", min: 0.01, max: 1, step: 0.01 },
  { property: "textureUrl", type: "text", label: "Texture URL" },
  { property: "windStrength", type: "number", label: "Wind Strength", min: 0, max: 10, step: 0.1 },
  { property: "windDirection.x", type: "number", label: "Wind Direction X", min: -1, max: 1, step: 0.1 },
  { property: "windDirection.y", type: "number", label: "Wind Direction Y", min: -1, max: 1, step: 0.1 },
  { property: "windDirection.z", type: "number", label: "Wind Direction Z", min: -1, max: 1, step: 0.1 }
];
