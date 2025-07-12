import { ComponentControlProperty } from "../../studio/types";

export const waterBodyComponentProperties: ComponentControlProperty[] = [
  { property: "viscosity", type: "number", label: "Viscosity", min: 0, max: 1, step: 0.01 },
  { property: "surfaceTension", type: "number", label: "Surface Tension", min: 0, max: 1, step: 0.01 }
];

export const waterDropletComponentProperties: ComponentControlProperty[] = [
  { property: "size", type: "number", label: "Droplet Size", min: 0.1, max: 5, step: 0.1 },
  { property: "fallHeight", type: "number", label: "Fall Height", min: 1, max: 100, step: 1 },
  { property: "mass", type: "number", label: "Mass", min: 0.1, max: 10, step: 0.1 },
  { property: "drag", type: "number", label: "Drag Coefficient", min: 0, max: 1, step: 0.01 },
  { property: "gravity.x", type: "number", label: "Gravity X", min: -20, max: 20, step: 0.1 },
  { property: "gravity.y", type: "number", label: "Gravity Y", min: -20, max: 20, step: 0.1 },
  { property: "gravity.z", type: "number", label: "Gravity Z", min: -20, max: 20, step: 0.1 },
  { property: "velocity.x", type: "number", label: "Velocity X", min: -10, max: 10, step: 0.1 },
  { property: "velocity.y", type: "number", label: "Velocity Y", min: -10, max: 10, step: 0.1 },
  { property: "velocity.z", type: "number", label: "Velocity Z", min: -10, max: 10, step: 0.1 },
  { property: "splashForce", type: "number", label: "Splash Force", min: 0.1, max: 5, step: 0.1 },
  { property: "splashRadius", type: "number", label: "Splash Radius", min: 0.1, max: 10, step: 0.1 },
  { property: "rippleDecay", type: "number", label: "Ripple Decay", min: 0.1, max: 2, step: 0.1 },
  { property: "rippleExpansionRate", type: "number", label: "Ripple Expansion Rate", min: 1, max: 20, step: 0.5 }
];
