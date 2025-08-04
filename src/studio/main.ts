import { PropertyInspectorUIManager } from "./ui/PropertyInspectorUIManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "@plugins/flag-simulation";
import { WaterSimulationPlugin } from "@plugins/water-simulation";
import { SolarSystemPlugin } from "@plugins/solar-system";
import { flagComponentProperties } from "../plugins/flag-simulation/flagComponentProperties";
import { waterBodyComponentProperties, waterDropletComponentProperties } from "../plugins/water-simulation/waterComponentProperties";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { RotationComponent } from "../core/components/RotationComponent";
import { Pane } from "tweakpane";
import { ViewportToolbar } from "./ui/ViewportToolbar";
import { SelectionSystem } from "./systems/SelectionSystem";
import { Logger } from "../core/utils/Logger";
import { IWorld } from "../core/ecs/IWorld";
import { IPluginManager } from "../core/plugin/IPluginManager";
import { IStateManager } from "./state/IStateManager";
import { IStudio } from "./IStudio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { StateManager } from "./state/StateManager";
import { Studio } from "./Studio";
import { IUIManager } from "./IUIManager";
import { UIManager } from "./uiManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { ComponentPropertyRegistry } from "./utils/ComponentPropertyRegistry";
import { FlagComponent } from "../plugins/flag-simulation/FlagComponent";
import { WaterBodyComponent } from "../plugins/water-simulation/WaterComponents";
import { IPluginContext } from "./IPluginContext";
import { ThreeGraphicsManager } from "./graphics/ThreeGraphicsManager";

// Import styles
import "./styles/studio.css";
import "./styles/toolbar.css";

function setupCoreSystems(): { world: World; pluginManager: PluginManager; stateManager: StateManager; studio: Studio } {
  const world: World = new World();
  const pluginManager: PluginManager = new PluginManager(world);
  const stateManager: StateManager = StateManager.getInstance();
  // Studio expects pluginContext as 4th argument
  const pluginContext: IPluginContext = {
    studio: undefined as any, // will be set after Studio is constructed
    world: world,
    eventBus: (window as any).ApplicationEventBus ? (window as any).ApplicationEventBus.getInstance() : undefined,
    getStateManager: () => stateManager,
  };
  const studio = new Studio(world, pluginManager, stateManager, pluginContext);
  pluginContext.studio = studio;
  const sceneSerializer = new SceneSerializer();

  // Expose for debugging
  (window as any).world = world;
  (window as any).pluginManager = pluginManager;
  (window as any).stateManager = stateManager;
  (window as any).studio = studio;
  (window as any).sceneSerializer = sceneSerializer;

  return { world, pluginManager, stateManager, studio };
}

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager): { uiManager: UIManager; propertyInspectorUIManager: PropertyInspectorUIManager } {
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
    const options = studio.getAvailableSimulationNames().map((name: string) => ({ text: name, value: name }));
    if (options.length === 0) {
      // Show a disabled selector or message if no simulations are available
      simulationSelectionFolder.addButton({ title: "No simulations available" }).disabled = true;
      stateManager.selectedSimulation.state.name = null;
      return;
    }
    // Ensure the state is always a valid plugin name
    if (!options.some((opt: { text: string; value: string; }) => opt.value === stateManager.selectedSimulation.state.name)) {
      stateManager.selectedSimulation.state.name = options[0].value;
    }
    simulationSelectionFolder
      .addBinding(stateManager.selectedSimulation.state, "name", {
        label: "Select Simulation",
        options,
      })
      .on("change", (ev: { value: string | null }) => {
        // Always set the state to the plugin name
        stateManager.selectedSimulation.state.name = ev.value;
        void studio.loadSimulation(ev.value);
      });
  }

  // Initial population
  updateSimulationSelector();

  // If pluginManager has an event emitter, listen for plugin registration events
  if (typeof (pluginManager as any).on === "function") {
    (pluginManager as any).on("plugin:registered", updateSimulationSelector);
  }

  return { uiManager, propertyInspectorUIManager };
}

function registerComponentsAndSystems(world: World, studio: Studio, propertyInspectorUIManager: PropertyInspectorUIManager, pluginManager: PluginManager) {
  // Register Component Properties
  ComponentPropertyRegistry.getInstance().registerComponentProperties(
    (FlagComponent as any).type || "FlagComponent",
    flagComponentProperties
  );
  ComponentPropertyRegistry.getInstance().registerComponentProperties(
    (WaterBodyComponent as any).type || "WaterBodyComponent",
    waterBodyComponentProperties
  );

  // Register Core Components
  // Ensure static 'type' property is present for each component
  world.registerComponent((PositionComponent as any).type ? PositionComponent : class extends PositionComponent { static type = "PositionComponent"; });
  world.registerComponent((RenderableComponent as any).type ? RenderableComponent : class extends RenderableComponent { static type = "RenderableComponent"; });
  world.registerComponent((SelectableComponent as any).type ? SelectableComponent : class extends SelectableComponent { static type = "SelectableComponent"; });
  world.registerComponent((RotationComponent as any).type ? RotationComponent : class extends RotationComponent { static type = "RotationComponent"; });

  // Register Systems
  const graphicsManager = new ThreeGraphicsManager();
  graphicsManager.initialize(document.body);
  const renderSystem = new RenderSystem(graphicsManager, world);
  world.registerSystem(renderSystem);

  const selectionSystem = new SelectionSystem(studio, world as World); // Ensure correct type
  world.registerSystem(selectionSystem);

  world.registerSystem(
    new PropertyInspectorSystem(propertyInspectorUIManager, world as World, studio, pluginManager, selectionSystem)
  );
  studio.setRenderSystem(renderSystem);

  // Create viewport toolbar
  const viewportToolbar = new ViewportToolbar({
    graphicsManager: renderSystem.getGraphicsManager() as ThreeGraphicsManager,
  });
  (window as any).viewportToolbar = viewportToolbar;
}

function registerPlugins(pluginManager: PluginManager) {
  const flagPlugin = new FlagSimulationPlugin();
  Logger.getInstance().log("Registering plugin:", flagPlugin.getName());
  pluginManager.registerPlugin(flagPlugin);
  Logger.getInstance().log("Available plugins after registration:", pluginManager.getAvailablePluginNames());
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
  // Enable logging for debugging
  Logger.getInstance().enable();
  Logger.getInstance().log("Initializing Physics Simulation Studio...");

  const { world, pluginManager, stateManager, studio } = setupCoreSystems();
  const { uiManager, propertyInspectorUIManager } = setupUI(studio, stateManager, pluginManager);
  registerComponentsAndSystems(world as World, studio, propertyInspectorUIManager, pluginManager as PluginManager);
  registerPlugins(pluginManager);

  // Set render system before loading simulation
  const renderSystem = (world as World).systemManager.getSystem(RenderSystem);
  if (renderSystem) {
    studio.setRenderSystem(renderSystem);
  }

  // Load Initial Simulation
  const defaultSimulationName = studio.getAvailableSimulationNames()[0] || null;
  if (defaultSimulationName) {
    Logger.getInstance().log(`Loading default simulation: ${defaultSimulationName}`);
    await studio.loadSimulation(defaultSimulationName);
  } else {
    Logger.getInstance().warn("No default simulation found to load.");
  }

  startApplication(studio);

  Logger.getInstance().log("Physics Simulation Studio Initialized");
}

// Run the main initialization function
main().catch((error) => {
  Logger.getInstance().error("Failed to initialize the studio:", error);
});
