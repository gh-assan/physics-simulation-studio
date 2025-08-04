// src/studio/utils/ComponentPropertyDefinitions.ts

import { ComponentPropertyRegistry } from "./ComponentPropertyRegistry";
import { FlagComponent } from "../../core/ecs/FlagComponent";
import { WaterBodyComponent, WaterDropletComponent } from "../../plugins/water-simulation/WaterComponents";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
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
    label: "Width",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "height",
    type: "number",
    label: "Height",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "segmentsX",
    type: "number",
    label: "Seg X",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "segmentsY",
    type: "number",
    label: "Seg Y",
    min: 1,
    max: 50,
    step: 1
  },
  {
    property: "mass",
    type: "number",
    label: "Mass",
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
    label: "Texture"
  },
  // Gravity properties
  {
    property: "gravity.x",
    type: "number",
    label: "Grav X",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.y",
    type: "number",
    label: "Grav Y",
    min: -20,
    max: 20,
    step: 0.1
  },
  {
    property: "gravity.z",
    type: "number",
    label: "Grav Z",
    min: -20,
    max: 20,
    step: 0.1
  },
  // Wind properties
  {
    property: "windStrength",
    type: "number",
    label: "Wind Str",
    min: 0,
    max: 10,
    step: 0.1
  },
  {
    property: "windDirection.x",
    type: "number",
    label: "Wind X",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.y",
    type: "number",
    label: "Wind Y",
    min: -1,
    max: 1,
    step: 0.1
  },
  {
    property: "windDirection.z",
    type: "number",
    label: "Wind Z",
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

// Register properties for PositionComponent
registerComponentProperties("PositionComponent", [
  {
    property: "x",
    type: "number",
    label: "Pos X",
    min: -100,
    max: 100,
    step: 0.1
  },
  {
    property: "y",
    type: "number",
    label: "Pos Y",
    min: -100,
    max: 100,
    step: 0.1
  },
  {
    property: "z",
    type: "number",
    label: "Pos Z",
    min: -100,
    max: 100,
    step: 0.1
  }
]);

// Register properties for RotationComponent
ComponentPropertyRegistry.getInstance().registerComponentProperties("RotationComponent", [
  {
    property: "x",
    type: "number",
    label: "Rot X",
    min: -1,
    max: 1,
    step: 0.01
  },
  {
    property: "y",
    type: "number",
    label: "Rot Y",
    min: -1,
    max: 1,
    step: 0.01
  },
  {
    property: "z",
    type: "number",
    label: "Rot Z",
    min: -1,
    max: 1,
    step: 0.01
  },
  {
    property: "w",
    type: "number",
    label: "Rot W",
    min: -1,
    max: 1,
    step: 0.01
  }
]);

// Export a function to ensure the module is executed
export function initializeComponentProperties(): void {
  // This function is intentionally empty, as the registration happens when the module is imported
}
