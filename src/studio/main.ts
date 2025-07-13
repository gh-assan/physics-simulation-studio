
import { Studio } from "./Studio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { StateManager } from "./state/StateManager";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { PropertyInspectorUIManager } from "./ui/PropertyInspectorUIManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "@plugins/flag-simulation";
import { WaterSimulationPlugin } from "@plugins/water-simulation";
import { registerFlagComponentProperties } from "@plugins/flag-simulation";
import { registerWaterComponentProperties } from "@plugins/water-simulation";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { RotationComponent } from "../core/components/RotationComponent";
import { Pane } from "tweakpane";
import { ViewportToolbar } from "./ui/ViewportToolbar";
import { SelectionSystem } from "./systems/SelectionSystem";
import { Logger } from "../core/utils/Logger";

// Import styles
import "./styles/studio.css";
import "./styles/toolbar.css";

function setupCoreSystems() {
  const world = new World();
  const pluginManager = new PluginManager(world);
  const stateManager = StateManager.getInstance();
  const studio = new Studio(world, pluginManager, stateManager);
  const sceneSerializer = new SceneSerializer();

  // Expose for debugging
  (window as any).world = world;
  (window as any).pluginManager = pluginManager;
  (window as any).stateManager = stateManager;
  (window as any).studio = studio;
  (window as any).sceneSerializer = sceneSerializer;

  return { world, pluginManager, stateManager, studio };
}

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager) {
  const pane = new Pane();
  const uiManager = new UIManager(pane);
  const propertyInspectorUIManager = new PropertyInspectorUIManager(uiManager);
  (window as any).uiManager = uiManager;
  (window as any).propertyInspectorUIManager = propertyInspectorUIManager;

  const globalControlsFolder = pane.addFolder({ title: "Global Controls" });
  globalControlsFolder.addButton({ title: "Play" }).on("click", () => studio.play());
  globalControlsFolder.addButton({ title: "Pause" }).on("click", () => studio.pause());
  globalControlsFolder.addButton({ title: "Reset" }).on("click", () => studio.reset());

  const simulationSelectionFolder = pane.addFolder({ title: "Simulations" });

  function updateSimulationSelector() {
    simulationSelectionFolder.children.forEach((child: any) => child.dispose());
    simulationSelectionFolder
      .addBinding(stateManager.selectedSimulation.state, "name", {
        label: "Select Simulation",
        options: studio
          .getAvailableSimulationNames()
          .map((name) => ({ text: name, value: name })),
      })
      .on("change", (ev: { value: string | null }) => {
        void studio.loadSimulation(ev.value);
      });
  }

  // Initial population
  updateSimulationSelector();

  pluginManager.onPluginRegistered(() => {
    updateSimulationSelector();
  });

  return { uiManager, propertyInspectorUIManager };
}

function registerComponentsAndSystems(world: World, studio: Studio, propertyInspectorUIManager: PropertyInspectorUIManager, pluginManager: PluginManager) {
  // Register Component Properties
  registerFlagComponentProperties();
  registerWaterComponentProperties();

  // Register Core Components
  world.componentManager.registerComponent(PositionComponent);
  world.componentManager.registerComponent(RenderableComponent);
  world.componentManager.registerComponent(SelectableComponent);
  world.componentManager.registerComponent(RotationComponent);

  // Register Systems
  const renderSystem = new RenderSystem(studio);
  world.systemManager.registerSystem(renderSystem);

  const selectionSystem = new SelectionSystem(studio, world); // Create a single instance
  world.systemManager.registerSystem(selectionSystem);

  world.systemManager.registerSystem(
    new PropertyInspectorSystem(propertyInspectorUIManager, world, studio, pluginManager, selectionSystem)
  );
  studio.setRenderSystem(renderSystem);

  // Create viewport toolbar
  const viewportToolbar = new ViewportToolbar({
    graphicsManager: renderSystem.getGraphicsManager(),
  });
  (window as any).viewportToolbar = viewportToolbar;
}

function registerPlugins(pluginManager: PluginManager) {
  pluginManager.registerPlugin(new FlagSimulationPlugin());
  pluginManager.registerPlugin(new WaterSimulationPlugin());
}

function startApplication(studio: Studio) {
  let lastTime = 0;
  function animate(currentTime: number) {
    requestAnimationFrame(animate);
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    studio.update(deltaTime);
  }

  animate(0);
}

async function main() {
  Logger.log("Initializing Physics Simulation Studio...");

  const { world, pluginManager, stateManager, studio } = setupCoreSystems();
  const { uiManager, propertyInspectorUIManager } = setupUI(studio, stateManager, pluginManager);
  registerComponentsAndSystems(world, studio, propertyInspectorUIManager, pluginManager);
  registerPlugins(pluginManager);

  // Load Initial Simulation
  const defaultSimulationName = studio.getAvailableSimulationNames()[0] || null;
  if (defaultSimulationName) {
    Logger.log(`Loading default simulation: ${defaultSimulationName}`);
    await studio.loadSimulation(defaultSimulationName);
  } else {
    Logger.warn("No default simulation found to load.");
  }

  startApplication(studio);

  Logger.log("Physics Simulation Studio Initialized");
}

// Run the main initialization function
main().catch((error) => {
  Logger.error("Failed to initialize the studio:", error);
});

