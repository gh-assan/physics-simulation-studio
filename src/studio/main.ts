// Modern Parameter System Integration
import { setupModernParameterSystem, StudioParameterIntegration, SimplifiedPropertyInspectorUIManager } from "../core/ui/SimplifiedParameterSystem";
import { createModernPropertyInspectorSystem } from "./systems/ModernPropertyInspectorSystem";
// Integration test (will auto-run on page load)
import "../core/ui/IntegrationTest";
// Parameter verification (for debugging)
import "../core/ui/ParameterVerification";

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

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager): { uiManager: UIManager; propertyInspectorUIManager: SimplifiedPropertyInspectorUIManager; visibilityManager: VisibilityManager; parameterSystemIntegration: StudioParameterIntegration } {
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

  // Modern Parameter System Integration
  const parameterSystemIntegration = setupModernParameterSystem(pane);
  const propertyInspectorUIManager = parameterSystemIntegration.getManager();

  // Expose for debugging
  (window as any).uiManager = uiManager;
  (window as any).propertyInspectorUIManager = propertyInspectorUIManager;
  (window as any).parameterSystemIntegration = parameterSystemIntegration;
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

    // Don't auto-select a simulation - keep it as empty unless explicitly set
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

  // NEW: Add Plugin Visibility Control
  const pluginControlsFolder = pane.addFolder({ title: "Plugin Controls" });

  // Plugin selector for parameter visibility
  const pluginSelectorState = { plugin: '' };
  const pluginSelector = pluginControlsFolder.addBinding(pluginSelectorState, 'plugin', {
    label: 'Show Parameters',
    options: [
      { text: 'All Plugins', value: '' },
      { text: 'Flag Simulation', value: 'flag-simulation' },
      { text: 'Water Simulation', value: 'water-simulation' },
      { text: 'Solar System', value: 'solar-system' }
    ]
  });

  pluginSelector.on('change', (ev: any) => {
    console.log('Plugin selector changed to:', ev.value);
    if (ev.value) {
      // Switch to specific plugin and show demo parameters
      parameterSystemIntegration.switchToPlugin(ev.value);

      // Show demo parameters for the selected plugin
      if (ev.value === 'flag-simulation') {
        parameterSystemIntegration.demoFlagSimulation();
      } else if (ev.value === 'water-simulation') {
        parameterSystemIntegration.demoWaterSimulation();
      } else if (ev.value === 'solar-system') {
        // Add demo for solar system if it exists
        console.log('Solar system demo not yet implemented');
      }
    } else {
      // Show parameters for current simulation or clear all
      const currentSim = stateManager.selectedSimulation.getSimulationName();
      if (currentSim) {
        parameterSystemIntegration.switchToPlugin(currentSim);
      } else {
        // Show all plugins demo
        parameterSystemIntegration.demoMultiplePlugins();
      }
    }
  });

  // Register Plugin Controls panel with VisibilityManager
  visibilityManager.registerGlobalPanel(
    'plugin-controls',
    pluginControlsFolder,
    leftPanel,
    { priority: 1.5 }
  );

  return { uiManager, propertyInspectorUIManager, visibilityManager, parameterSystemIntegration };
}

function registerComponentsAndSystems(world: World, studio: Studio, propertyInspectorUIManager: SimplifiedPropertyInspectorUIManager, pluginManager: PluginManager, visibilityManager: VisibilityManager): VisibilityOrchestrator {
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

    // NOTE: No default renderers are registered - renderers are added only when simulations load

    // Register the render orchestrator as a system
    world.registerSystem(renderOrchestrator);

    const selectionSystem = new SelectionSystem(studio, world as World);
    world.registerSystem(selectionSystem);

    // Use Modern Property Inspector System
    const propertyInspectorSystem = createModernPropertyInspectorSystem(
      (window as any).uiManager?.getPane(), // Get tweakpane directly
      world as World,
      studio,
      pluginManager,
      selectionSystem
    );
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
    const { uiManager, propertyInspectorUIManager, visibilityManager, parameterSystemIntegration } = setupUI(studio, stateManager, pluginManager);

    // Connect parameter system to Studio
    studio.setParameterSystemIntegration(parameterSystemIntegration);

    const visibilityOrchestrator = registerComponentsAndSystems(world as World, studio, propertyInspectorUIManager, pluginManager as PluginManager, visibilityManager);

    // Load available plugins dynamically
    const loadedPlugins = await pluginDiscovery.loadAllPlugins();

    // Integration: Register plugins with parameter system
    for (const plugin of loadedPlugins) {
      // Access the underlying PluginParameterIntegration through the manager
      const integration = (propertyInspectorUIManager as any).modernManager?.integration;
      if (integration && typeof integration.registerPlugin === 'function') {
        integration.registerPlugin(plugin, world);
      }
    }

    // Show demo parameters immediately
    setTimeout(() => {
      console.log('🎯 Showing demo parameters...');

      // Show demo flag simulation by default
      parameterSystemIntegration.demoFlagSimulation();

      // Also log available options
      console.log('Available parameter demos:');
      console.log('- Flag Simulation: parameterSystemIntegration.demoFlagSimulation()');
      console.log('- Water Simulation: parameterSystemIntegration.demoWaterSimulation()');
      console.log('- Multiple Plugins: parameterSystemIntegration.demoMultiplePlugins()');

      // Add global testing functions
      (window as any).showFlagParams = () => parameterSystemIntegration.demoFlagSimulation();
      (window as any).showWaterParams = () => parameterSystemIntegration.demoWaterSimulation();
      (window as any).showMultipleParams = () => parameterSystemIntegration.demoMultiplePlugins();
      (window as any).clearParams = () => propertyInspectorUIManager.clearInspectorControls();

      console.log('🧪 Test commands available:');
      console.log('- showFlagParams() - Show flag simulation parameters');
      console.log('- showWaterParams() - Show water simulation parameters');
      console.log('- showMultipleParams() - Show multiple plugin parameters');
      console.log('- clearParams() - Clear all parameters');
    }, 1000);

    Logger.getInstance().log(`Physics Simulation Studio ready with ${loadedPlugins.length} plugins loaded`);

    // Run system diagnostics to ensure everything is working
    const diagnostics = new SystemDiagnostics(world as World);
    diagnostics.diagnoseAndFix();

    startApplication(studio);

    Logger.getInstance().log("Physics Simulation Studio Initialized");
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
