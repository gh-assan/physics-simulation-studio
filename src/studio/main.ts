import { Studio } from "./Studio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { StateManager } from "./state/StateManager";
import { SelectedSimulationState } from "./state/StateTypes";
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
import { ViewportToolbar } from "./ui/ViewportToolbar";

// Import styles
import "./styles/studio.css";
import "./styles/toolbar.css";

const world = new World();
const pluginManager = new PluginManager(world);
const stateManager = StateManager.getInstance();

// Setup Tweakpane for global controls
const pane = new Pane();
const uiManager = new UIManager(pane);
const sceneSerializer = new SceneSerializer();

// Initialize Studio first
const studio = new Studio(world, pluginManager, stateManager);

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
  // Basic properties
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

  // Physics properties
  {
    property: "mass",
    type: "number",
    label: "Mass",
    min: 0.1,
    max: 10,
    step: 0.1
  },
  {
    property: "drag",
    type: "number",
    label: "Drag Coefficient",
    min: 0,
    max: 1,
    step: 0.01
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

  // Velocity properties
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
  },

  // Splash properties
  {
    property: "splashForce",
    type: "number",
    label: "Splash Force",
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    property: "splashRadius",
    type: "number",
    label: "Splash Radius",
    min: 0.1,
    max: 10,
    step: 0.1
  },

  // Ripple properties
  {
    property: "rippleDecay",
    type: "number",
    label: "Ripple Decay",
    min: 0.1,
    max: 2,
    step: 0.1
  },
  {
    property: "rippleExpansionRate",
    type: "number",
    label: "Ripple Expansion Rate",
    min: 1,
    max: 20,
    step: 0.5
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
  PositionComponent.type,
  PositionComponent
);
world.componentManager.registerComponent(
  RenderableComponent.type,
  RenderableComponent
);
world.componentManager.registerComponent(
  SelectableComponent.type,
  SelectableComponent
);
world.componentManager.registerComponent(
  RotationComponent.type,
  RotationComponent
);

// Register systems
const renderSystem = new RenderSystem(studio);
world.systemManager.registerSystem(renderSystem);
world.systemManager.registerSystem(
  new PropertyInspectorSystem(uiManager, world, studio, pluginManager)
);

// Set renderSystem on studio
studio.setRenderSystem(renderSystem);

// Create viewport toolbar
const viewportToolbar = new ViewportToolbar({
  graphicsManager: renderSystem.getGraphicsManager()
});

// Expose for debugging/console interaction
(window as any).viewportToolbar = viewportToolbar;

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

// Enable camera controls by default
const graphicsManager = renderSystem.getGraphicsManager();
graphicsManager.toggleControls(true);

// Add event listeners for toolbar events
window.addEventListener("tool-changed", (event) => {
  const customEvent = event as CustomEvent;
  console.log(`Tool changed to: ${customEvent.detail.tool}`);
});

window.addEventListener("snap-changed", (event) => {
  const customEvent = event as CustomEvent;
  console.log(`Snap to grid changed to: ${customEvent.detail.snapToGrid}`);
});

window.addEventListener("grid-changed", (event) => {
  const customEvent = event as CustomEvent;
  console.log(`Grid visibility changed to: ${customEvent.detail.visible}`);
});

const simulationSelectionFolder = (pane as any).addFolder({
  title: "Simulations"
});

simulationSelectionFolder
  .addBinding(stateManager.selectedSimulation.state, "name", {
    label: "Select Simulation",
    options: studio
      .getAvailableSimulationNames()
      .map((name) => ({ text: name, value: name }))
  })
  .on("change", (ev: { value: string }) => {
    stateManager.selectedSimulation.setSimulation(ev.value);
  });

stateManager.selectedSimulation.on("change", (state: SelectedSimulationState) => {
  void studio.loadSimulation(state.name);
});

// Initial load of the default simulation
const defaultSimulationName = studio.getAvailableSimulationNames()[0] || null;
stateManager.selectedSimulation.setSimulation(defaultSimulationName);

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
