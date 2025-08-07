// Clean Plugin-Based Parameter System
import { SimplifiedPropertyInspectorSystem } from "./systems/SimplifiedPropertyInspectorSystem";

import { SceneSerializer } from "./systems/SceneSerializer";
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
import { PluginManager, PluginManagerEvent } from "../core/plugin/PluginManager";
import { StateManager } from "./state/StateManager";
import { Studio } from "./Studio";
import { IUIManager } from "./IUIManager";
import { UIManager } from "./uiManager";
import { ComponentPropertyRegistry } from "./utils/ComponentPropertyRegistry";
import { IPluginContext } from "./IPluginContext";
import { ThreeGraphicsManager } from "./graphics/ThreeGraphicsManager";
import { VisibilityManager } from "./ui/VisibilityManager";
import { SystemDiagnostics } from "./utils/SystemDiagnostics";
import { RenderOrchestrator } from "./rendering/RenderOrchestrator";
import { VisibilityOrchestrator } from "./orchestration/VisibilityOrchestrator";
import { PluginDiscoveryService } from "./plugins/PluginDiscoveryService";

// Import styles
import "./styles/studio.css";
import "./styles/toolbar.css";

function setupCoreSystems(): { world: World; pluginManager: PluginManager; stateManager: StateManager; studio: Studio; pluginDiscovery: PluginDiscoveryService } {
  const world: World = new World();
  const pluginManager: PluginManager = new PluginManager(world);
  const stateManager: StateManager = StateManager.getInstance();

  // Create plugin discovery service for dynamic plugin loading
  const pluginDiscovery = new PluginDiscoveryService(pluginManager);

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
  (window as any).pluginDiscovery = pluginDiscovery;

  return { world, pluginManager, stateManager, studio, pluginDiscovery };
}

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager): { uiManager: UIManager; visibilityManager: VisibilityManager } {
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

  // Expose for debugging
  (window as any).uiManager = uiManager;
  (window as any).visibilityManager = visibilityManager;

  const globalControlsFolder = pane.addFolder({ title: "Global Controls" });
  const playButton = globalControlsFolder.addButton({ title: "Play" }).on("click", () => {
    console.log('Play button clicked');
    studio.play();
  });
  const pauseButton = globalControlsFolder.addButton({ title: "Pause" }).on("click", () => {
    console.log('Pause button clicked');
    studio.pause();
  });
  const resetButton = globalControlsFolder.addButton({ title: "Reset" }).on("click", () => {
    console.log('Reset button clicked');
    studio.reset();
  });

  // Function to update button states based on simulation selection
  function updateControlButtonStates() {
    const hasSimulation = !!stateManager.selectedSimulation.state.name?.length;
    playButton.disabled = !hasSimulation;
    pauseButton.disabled = !hasSimulation;
    resetButton.disabled = !hasSimulation;
  }

  // Initialize button states
  updateControlButtonStates();

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
      stateManager.selectedSimulation.state.name = "";
      updateControlButtonStates();
      return;
    }

    // Add an "Unload" option to allow deselecting simulations
    const optionsWithUnload = [{ text: "Unload Simulation", value: "" }, ...options];

    console.log('Creating simulation selector with state:', stateManager.selectedSimulation.state.name);
    console.log('Available options:', optionsWithUnload);
    simulationSelectionFolder
      .addBinding(stateManager.selectedSimulation.state, "name", {
        label: "Select Simulation",
        options: optionsWithUnload,
      })
      .on("change", (ev: { value: string }) => {
        console.log('Simulation selector changed to:', ev.value);
        stateManager.selectedSimulation.state.name = ev.value;

        if (!ev.value || ev.value === "") {
          studio.unloadSimulation();
          updateControlButtonStates();
          return;
        }

        void studio.loadSimulation(ev.value);
        updateControlButtonStates();
      });
  }

  // Initial population
  updateSimulationSelector();

  // Listen for simulation state changes to update button states
  stateManager.selectedSimulation.onChange(() => {
    updateControlButtonStates();
  });

  // Listen for plugin registration to update simulation selector
  pluginManager.on(PluginManagerEvent.PLUGIN_REGISTERED, updateSimulationSelector);

  return { uiManager, visibilityManager };
}

function registerComponentsAndSystems(world: World, studio: Studio, pluginManager: PluginManager, visibilityManager: VisibilityManager): VisibilityOrchestrator {
  // Register Core Components Only - Plugin components are registered by plugins themselves
  world.registerComponent((PositionComponent as any).type ? PositionComponent : class extends PositionComponent { static type = "PositionComponent"; });
  world.registerComponent((RenderableComponent as any).type ? RenderableComponent : class extends RenderableComponent { static type = "RenderableComponent"; });
  world.registerComponent((SelectableComponent as any).type ? SelectableComponent : class extends SelectableComponent { static type = "SelectableComponent"; });
  world.registerComponent((RotationComponent as any).type ? RotationComponent : class extends RotationComponent { static type = "RotationComponent"; });

  // Register Systems with Centralized Orchestration
  try {
    // Create graphics manager and initialize canvas
    const graphicsManager = new ThreeGraphicsManager();

    // Initialize graphics manager with the main content container
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content container not found");
    }
    graphicsManager.initialize(mainContent);

    // Create centralized render orchestrator
    const renderOrchestrator = new RenderOrchestrator(graphicsManager);

    // Create centralized visibility orchestrator with proper render orchestrator
    const visibilityOrchestrator = new VisibilityOrchestrator(visibilityManager, renderOrchestrator);
    visibilityOrchestrator.initialize();

    // Register the render orchestrator as a system
    world.registerSystem(renderOrchestrator);

    const selectionSystem = new SelectionSystem(studio, world as World);
    world.registerSystem(selectionSystem);

    // Use Clean Plugin-Based Property Inspector System  
    const propertyInspectorSystem = new SimplifiedPropertyInspectorSystem(studio);
    propertyInspectorSystem.initialize((window as any).uiManager?.getPane());
    world.registerSystem(propertyInspectorSystem);

    // Store graphics manager for later use
    (window as any).graphicsManager = graphicsManager;

    // Create viewport toolbar
    const viewportToolbar = new ViewportToolbar({
      graphicsManager: graphicsManager,
    });
    (window as any).viewportToolbar = viewportToolbar;

    // Expose for debugging
    (window as any).renderOrchestrator = renderOrchestrator;
    (window as any).visibilityOrchestrator = visibilityOrchestrator;

    return visibilityOrchestrator;

  } catch (error) {
    Logger.getInstance().error("Error during system registration:", error);
    throw error;
  }
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

  try {
    const { world, pluginManager, stateManager, studio, pluginDiscovery } = setupCoreSystems();
    const { uiManager, visibilityManager } = setupUI(studio, stateManager, pluginManager);

    const visibilityOrchestrator = registerComponentsAndSystems(world as World, studio, pluginManager as PluginManager, visibilityManager);

    // Load available plugins dynamically
    const loadedPlugins = await pluginDiscovery.loadAllPlugins();

    console.log(`✅ Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(', ')}`);
    console.log('🎯 Clean plugin-based parameter system ready!');
    console.log('📋 Parameters will appear when you select entities in the scene');

    Logger.getInstance().log(`Physics Simulation Studio ready with ${loadedPlugins.length} plugins loaded`);

    // Run system diagnostics to ensure everything is working
    const diagnostics = new SystemDiagnostics(world as World);
    diagnostics.diagnoseAndFix();

    startApplication(studio);

    Logger.getInstance().log("Physics Simulation Studio Initialized with Clean Plugin-Based Parameter System");
  } catch (error) {
    console.error("Error during initialization:", error);
    Logger.getInstance().error("Failed to initialize the studio:", error);
    throw error;
  }
}

// Run the main initialization function
main().catch((error) => {
  Logger.getInstance().error("Failed to initialize the studio:", error);
});
