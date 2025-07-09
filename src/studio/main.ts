import { Studio } from "./Studio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "@plugins/flag-simulation";
import { WaterSimulationPlugin } from "@plugins/water-simulation";
import { FlagComponent } from "../plugins/flag-simulation/FlagComponent";
import {
  WaterBodyComponent,
  WaterDropletComponent
} from "../plugins/water-simulation/WaterComponents";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { RotationComponent } from "../core/components/RotationComponent";
import { Pane } from "tweakpane";
import { registerComponentProperties } from "./utils/ComponentPropertyRegistry";
import { ComponentControlProperty } from "./types";

const world = new World();
const pluginManager = new PluginManager(world);

// Setup Tweakpane for global controls
const pane = new Pane();
const uiManager = new UIManager(pane);
const sceneSerializer = new SceneSerializer();

// Initialize Studio first
const studio = new Studio(world, pluginManager);

// Define component properties for UI
const flagComponentProperties: ComponentControlProperty[] = [
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
  { property: "textureUrl", type: "text", label: "Texture URL" },
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
];

const waterBodyComponentProperties: ComponentControlProperty[] = [
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
];

const waterDropletComponentProperties: ComponentControlProperty[] = [
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
  }
];

// Register component properties
registerComponentProperties(FlagComponent.type, flagComponentProperties);
registerComponentProperties(
  WaterBodyComponent.type,
  waterBodyComponentProperties
);
registerComponentProperties(
  WaterDropletComponent.type,
  waterDropletComponentProperties
);

// Register core components
world.componentManager.registerComponent(
  PositionComponent.name,
  PositionComponent
);
world.componentManager.registerComponent(
  RenderableComponent.name,
  RenderableComponent
);
world.componentManager.registerComponent(
  SelectableComponent.name,
  SelectableComponent
);
world.componentManager.registerComponent(
  RotationComponent.name,
  RotationComponent
);

// Register systems
const renderSystem = new RenderSystem(studio);
world.systemManager.registerSystem(renderSystem);
world.systemManager.registerSystem(new PropertyInspectorSystem(uiManager));

// Set renderSystem on studio
studio.setRenderSystem(renderSystem);

// Register plugins
pluginManager.registerPlugin(new FlagSimulationPlugin());
pluginManager.registerPlugin(new WaterSimulationPlugin());

// Expose for debugging/console interaction
(window as any).world = world;
(window as any).pluginManager = pluginManager;
(window as any).uiManager = uiManager;
(window as any).sceneSerializer = sceneSerializer;
(window as any).studio = studio;

const globalControlsFolder = (pane as any).addFolder({
  title: "Global Controls"
});
globalControlsFolder
  .addButton({ title: "Play" })
  .on("click", () => studio.play());
globalControlsFolder
  .addButton({ title: "Pause" })
  .on("click", () => studio.pause());
globalControlsFolder
  .addButton({ title: "Reset" })
  .on("click", () => studio.reset());

// Add camera controls to the global controls folder
const cameraControlsFolder = (pane as any).addFolder({
  title: "Camera Controls"
});

const cameraControlsParams = {
  enabled: false
};

cameraControlsFolder
  .addBinding(cameraControlsParams, "enabled", { label: "Enable Controls" })
  .on("change", (ev: { value: boolean }) => {
    const graphicsManager = renderSystem.getGraphicsManager();
    graphicsManager.toggleControls(ev.value);
  });

// Add help text directly in the UI
const helpTextParams = {
  'Controls Help': 'Left Click + Drag: Rotate\nRight Click + Drag: Pan\nScroll Wheel: Zoom'
};
cameraControlsFolder.addBinding(helpTextParams, 'Controls Help', {
  readonly: true
});

const simulationSelectionFolder = (pane as any).addFolder({
  title: "Simulations"
});
const simulationParams = {
  selectedSimulation: "flag-simulation" // Default selected simulation
};

simulationSelectionFolder
  .addBinding(simulationParams, "selectedSimulation", {
    label: "Select Simulation",
    options: studio
      .getAvailableSimulationNames()
      .map((name) => ({ text: name, value: name }))
  })
  .on("change", (ev: { value: string }) => {
    void studio.loadSimulation(ev.value);
  });

// Initial load of the default simulation
await studio.loadSimulation(simulationParams.selectedSimulation);

let lastTime = 0;
// Main application loop
function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update the studio (which updates the world if playing)
  studio.update(deltaTime);
}

animate(0);

console.log("Physics Simulation Studio Initialized");
