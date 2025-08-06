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
import { VisibilityManager } from "./ui/VisibilityManager";
import { SystemDiagnostics } from "./utils/SystemDiagnostics";

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

  Logger.getInstance().log("Core systems initialized."); // Consolidated log

  return { world, pluginManager, stateManager, studio };
}

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager): { uiManager: UIManager; propertyInspectorUIManager: PropertyInspectorUIManager } {
  // Initialize core UI and ensure left panel exists
  const visibilityManager = new VisibilityManager();
  visibilityManager.initializeCoreUI();

  const leftPanel = document.getElementById("left-panel");
  if (!leftPanel) {
    throw new Error("Left panel not found");
  }

  // Create Tweakpane with the container option
  const pane = new Pane({ container: leftPanel });

  const uiManager = new UIManager(pane);
  const propertyInspectorUIManager = new PropertyInspectorUIManager(uiManager, visibilityManager);

  // Expose for debugging
  (window as any).uiManager = uiManager;
  (window as any).propertyInspectorUIManager = propertyInspectorUIManager;
  (window as any).visibilityManager = visibilityManager;

  const globalControlsFolder = pane.addFolder({ title: "Global Controls" });
  globalControlsFolder.addButton({ title: "Play" }).on("click", () => {
    console.log('Play button clicked');
    studio.play();
  });
  globalControlsFolder.addButton({ title: "Pause" }).on("click", () => {
    console.log('Pause button clicked');
    studio.pause();
  });
  globalControlsFolder.addButton({ title: "Reset" }).on("click", () => {
    console.log('Reset button clicked');
    studio.reset();
  });

  // Register Global Controls panel with VisibilityManager
  visibilityManager.registerGlobalPanel(
    'global-controls',
    globalControlsFolder,
    leftPanel,
    { isGlobalControl: true, priority: 1 }
  );

  const simulationSelectionFolder = pane.addFolder({ title: "Simulations" });

  // Register Simulations panel with VisibilityManager
  visibilityManager.registerGlobalPanel(
    'simulation-selector',
    simulationSelectionFolder,
    leftPanel,
    { isSimulationSelector: true, priority: 2 }
  );

  function updateSimulationSelector() {
    simulationSelectionFolder.children.forEach((child: any) => child.dispose());
    const options = studio.getAvailableSimulationNames().map((name: string) => ({ text: name, value: name }));
    if (options.length === 0) {
      simulationSelectionFolder.addButton({ title: "No simulations available" }).disabled = true;
      stateManager.selectedSimulation.state.name = null;
      return;
    }
    if (!options.some((opt: { text: string; value: string; }) => opt.value === stateManager.selectedSimulation.state.name)) {
      stateManager.selectedSimulation.state.name = options[0].value;
    }
    simulationSelectionFolder
      .addBinding(stateManager.selectedSimulation.state, "name", {
        label: "Select Simulation",
        options,
      })
      .on("change", (ev: { value: string | null }) => {
        stateManager.selectedSimulation.state.name = ev.value;
        void studio.loadSimulation(ev.value);
      });
  }

  // Initial population
  updateSimulationSelector();

  if (typeof (pluginManager as any).on === "function") {
    (pluginManager as any).on("plugin:registered", updateSimulationSelector);
  }
  Logger.getInstance().log("UI setup completed."); // Consolidated log

  return { uiManager, propertyInspectorUIManager };
}

function registerComponentsAndSystems(world: World, studio: Studio, propertyInspectorUIManager: PropertyInspectorUIManager, pluginManager: PluginManager) {
  Logger.getInstance().log("[main.ts] registerComponentsAndSystems function called");
  
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
  Logger.getInstance().log("[main.ts] Registering core components...");
  world.registerComponent((PositionComponent as any).type ? PositionComponent : class extends PositionComponent { static type = "PositionComponent"; });
  world.registerComponent((RenderableComponent as any).type ? RenderableComponent : class extends RenderableComponent { static type = "RenderableComponent"; });
  world.registerComponent((SelectableComponent as any).type ? SelectableComponent : class extends SelectableComponent { static type = "SelectableComponent"; });
  world.registerComponent((RotationComponent as any).type ? RotationComponent : class extends RotationComponent { static type = "RotationComponent"; });
  Logger.getInstance().log("[main.ts] Core components registered, now registering systems...");

  // Register Systems
  Logger.getInstance().log("[main.ts] Starting system registration...");
  
  let renderSystem: RenderSystem;
  try {
    // Create graphics manager and initialize canvas
    const graphicsManager = new ThreeGraphicsManager();

    // Initialize graphics manager with the main content container
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content container not found");
    }
    graphicsManager.initialize(mainContent);

    // Register core RenderSystem (this provides the canvas and basic rendering)
    Logger.getInstance().log("[main.ts] Creating RenderSystem...");
    renderSystem = new RenderSystem(graphicsManager, world);
    Logger.getInstance().log("[main.ts] Registering RenderSystem...");
    world.registerSystem(renderSystem);
    
    Logger.getInstance().log("[main.ts] Creating SelectionSystem...");
    const selectionSystem = new SelectionSystem(studio, world as World);
    Logger.getInstance().log("[main.ts] Registering SelectionSystem...");
    world.registerSystem(selectionSystem);

    Logger.getInstance().log("[main.ts] Creating PropertyInspectorSystem...");
    const propertyInspectorSystem = new PropertyInspectorSystem(propertyInspectorUIManager, world as World, studio, pluginManager, selectionSystem);
    Logger.getInstance().log("[main.ts] Registering PropertyInspectorSystem...");
    world.registerSystem(propertyInspectorSystem);
    
    Logger.getInstance().log("[main.ts] System registration completed.");
    studio.setRenderSystem(renderSystem);
  } catch (error) {
    Logger.getInstance().error("[main.ts] Error during system registration:", error);
    throw error;
  }

  // Note: RenderSystem provides the canvas, plugin systems add to it
  Logger.getInstance().log("[main.ts] Core systems registered - RenderSystem provides canvas, plugins add content");

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
  Logger.getInstance().log("=== MAIN FUNCTION STARTED ===");
  Logger.getInstance().log("Initializing Physics Simulation Studio...");

  try {
    Logger.getInstance().log("[main.ts] Starting setupCoreSystems...");
    const { world, pluginManager, stateManager, studio } = setupCoreSystems();
    Logger.getInstance().log("[main.ts] setupCoreSystems completed");

    Logger.getInstance().log("[main.ts] Starting setupUI...");
    const { uiManager, propertyInspectorUIManager } = setupUI(studio, stateManager, pluginManager);
    Logger.getInstance().log("[main.ts] setupUI completed");

    Logger.getInstance().log("[main.ts] Starting registerComponentsAndSystems...");
    registerComponentsAndSystems(world as World, studio, propertyInspectorUIManager, pluginManager as PluginManager);
    Logger.getInstance().log("[main.ts] registerComponentsAndSystems completed");

    Logger.getInstance().log("[main.ts] Starting registerPlugins...");
    registerPlugins(pluginManager);
    Logger.getInstance().log("[main.ts] registerPlugins completed");

    // Load Initial Simulation - this should NOT clear systems
    const defaultSimulationName = studio.getAvailableSimulationNames()[0] || null;
    if (defaultSimulationName) {
      Logger.getInstance().log(`Loading default simulation: ${defaultSimulationName}`);
      await studio.loadSimulation(defaultSimulationName);
      Logger.getInstance().log("Simulation loaded successfully");
    } else {
      Logger.getInstance().warn("No default simulation found to load.");
    }

    // Set render system after systems are registered
    const renderSystem = (world as World).systemManager.getSystem(RenderSystem);
    if (renderSystem) {
      studio.setRenderSystem(renderSystem);
      Logger.getInstance().log("RenderSystem set on studio");
    } else {
      Logger.getInstance().warn("RenderSystem not found after registration");
    }

    // Run system diagnostics to ensure everything is working
    const diagnostics = new SystemDiagnostics(world as World);
    diagnostics.diagnoseAndFix();
    Logger.getInstance().log("System diagnostics report:", diagnostics.getReport());

    startApplication(studio);

    Logger.getInstance().log("Physics Simulation Studio Initialized");
  } catch (error) {
    console.error("[main.ts] Error during initialization:", error);
    Logger.getInstance().error("Failed to initialize the studio:", error);
    throw error;
  }
}

// Run the main initialization function
main().catch((error) => {
  Logger.getInstance().error("Failed to initialize the studio:", error);
});
