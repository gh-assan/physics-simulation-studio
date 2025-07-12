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
import { registerFlagComponentProperties } from "@plugins/flag-simulation";
import { registerWaterComponentProperties } from "@plugins/water-simulation";
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

// Register flag component properties via plugin
registerFlagComponentProperties();
// Register water component properties via plugin
registerWaterComponentProperties();

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

// Initial load of the default simulation
const defaultSimulationName = studio.getAvailableSimulationNames()[0] || null;
stateManager.selectedSimulation.setSimulation(defaultSimulationName);

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

// Main application loop
let lastTime = 0;
function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update the studio (which updates the world if playing)
  studio.update(deltaTime);
}

animate(0);

console.log("Physics Simulation Studio Initialized");
