// src/studio/utils/ComponentPropertyDefinitions.ts

import { registerComponentProperties } from "./ComponentPropertyRegistry";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import {
  WaterBodyComponent,
  WaterDropletComponent
} from "../../plugins/water-simulation/WaterComponents";

// Register properties for FlagComponent
registerComponentProperties(FlagComponent.type, [
  {
    property: "width",
    type: "number",
    label: "Flag Width",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "height",
    type: "number",
    label: "Flag Height",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "segmentsX",
    type: "number",
    label: "Segments X",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "segmentsY",
    type: "number",
    label: "Segments Y",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "mass",
    type: "number",
    label: "Particle Mass",
    min: 0.01,
    max: 1,
    step: 0.01
  },
  {
    property: "stiffness",
    type: "number",
    label: "Stiffness",
    min: 0.1,
    max: 1,
    step: 0.01
  },
  {
    property: "damping",
    type: "number",
    label: "Damping",
    min: 0.01,
    max: 1,
    step: 0.01
  },
  {
    property: "textureUrl",
    type: "text",
    label: "Texture URL"
  },
  // Gravity properties
  {
    property: "gravity.x",
    type: "number",
    label: "Gravity X",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.y",
    type: "number",
    label: "Gravity Y",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.z",
    type: "number",
    label: "Gravity Z",
    min: -20,
    max: 20,
    step: 0.1
  },
  // Wind properties
  {
    property: "windStrength",
    type: "number",
    label: "Wind Strength",
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    property: "windDirection.x",
    type: "number",
    label: "Wind Direction X",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.y",
    type: "number",
    label: "Wind Direction Y",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.z",
    type: "number",
    label: "Wind Direction Z",
    min: -1,
    max: 1,
    step: 0.1
  }
]);

// Register properties for WaterBodyComponent
registerComponentProperties(WaterBodyComponent.type, [
  {
    property: "viscosity",
    type: "number",
    label: "Viscosity",
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    property: "surfaceTension",
    type: "number",
    label: "Surface Tension",
    min: 0,
    max: 1,
    step: 0.01
  }
]);

// Register properties for WaterDropletComponent
registerComponentProperties(WaterDropletComponent.type, [
  {
    property: "size",
    type: "number",
    label: "Droplet Size",
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    property: "fallHeight",
    type: "number",
    label: "Fall Height",
    min: 1,
    max: 100,
    step: 1
  },
  {
    property: "velocity.x",
    type: "number",
    label: "Velocity X",
    min: -10,
    max: 10,
    step: 0.1
  },
  {
    property: "velocity.y",
    type: "number",
    label: "Velocity Y",
    min: -10,
    max: 10,
    step: 0.1
  },
  {
    property: "velocity.z",
    type: "number",
    label: "Velocity Z",
    min: -10,
    max: 10,
    step: 0.1
  }
]);

// Export a function to ensure the module is executed
export function initializeComponentProperties(): void {
  // This function is intentionally empty, as the registration happens when the module is imported
}
