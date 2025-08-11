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
import { SimplifiedRenderSystem } from "./rendering/simplified/SimplifiedRenderSystem";
import { VisibilityOrchestrator } from "./orchestration/VisibilityOrchestrator";
import { PluginDiscoveryService } from "./plugins/PluginDiscoveryService";
import { AutoPluginRegistry } from "../core/plugin/AutoPluginRegistry";

// Import Global State Management System
import { getGlobalStore, initializeGlobalStore } from "./state/GlobalStore";
import { createGlobalStateSynchronizer } from "./state/StateIntegration";
import { Selectors } from "./state/Selectors";
import { Actions } from "./state/Actions";
import { SystemManager } from "../core/ecs/SystemManager";
import { ComponentManager } from "../core/ecs/ComponentManager";
// Import styles - Commented out for Vite compatibility when using compiled JS
// import "./styles/studio.css";
// import "./styles/toolbar.css";

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

function setupUI(studio: Studio, stateManager: StateManager, pluginManager: PluginManager): { uiManager: UIManager; visibilityManager: VisibilityManager; pane: Pane } {
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

  return { uiManager, visibilityManager, pane };
}

function registerComponentsAndSystems(world: World, studio: Studio, pluginManager: PluginManager, visibilityManager: VisibilityManager, pane: Pane): VisibilityOrchestrator {
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

    // Create the new SimplifiedRenderSystem - much cleaner!
    const renderSystem = new SimplifiedRenderSystem(graphicsManager);

    // Set the RenderSystem in Studio BEFORE any plugin initialization
    studio.setRenderSystem(renderSystem);

    // No need for complex orchestrator setup - SimplifiedRenderSystem handles everything!

    // Register only the SimplifiedRenderSystem (much simpler!)
    world.registerSystem(renderSystem);

    // Create visibility manager (simplified without orchestrator dependency)
    const visibilityOrchestrator = new VisibilityOrchestrator(visibilityManager, renderSystem as any);
    visibilityOrchestrator.initialize();

    const selectionSystem = new SelectionSystem(studio, world as World);
    world.registerSystem(selectionSystem);

    // Use Clean Plugin-Based Property Inspector System
    const propertyInspectorSystem = new SimplifiedPropertyInspectorSystem(studio);
    propertyInspectorSystem.initialize(pane);
    world.registerSystem(propertyInspectorSystem);

    // Store graphics manager for later use
    (window as any).graphicsManager = graphicsManager;

    // Create viewport toolbar
    const viewportToolbar = new ViewportToolbar({
      graphicsManager: graphicsManager,
    });
    (window as any).viewportToolbar = viewportToolbar;

    // Expose for debugging (simplified)
    (window as any).renderSystem = renderSystem;
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

/**
 * Set up state change listeners for debugging and reactive updates
 */
function setupStateChangeListeners(store: any, studio: Studio) {
  // Listen to all state changes for debugging
  store.subscribe((newState: any, previousState: any, action: any) => {
    if (action.type !== 'COMPONENT_ENTITY_COUNT_UPDATED') { // Avoid spam from frequent updates
      Logger.getInstance().log(`[Global State] ${action.type}`, {
        action: action.type,
        source: action.metadata?.source || 'Unknown',
        timestamp: new Date(action.timestamp).toISOString(),
      });
    }
  });

  // Listen specifically to plugin changes
  store.selectSubscribe(
    Selectors.Plugin.getAllPlugins,
    (newPlugins: any, previousPlugins: any) => {
      const activeCount = newPlugins.filter((p: any) => p.isActive).length;
      console.log(`🔌 Plugin state updated: ${newPlugins.length} total plugins, ${activeCount} active`);
    }
  );

  // Listen to simulation changes
  store.selectSubscribe(
    Selectors.Simulation.getCurrentSimulation,
    (currentSim: any, previousSim: any) => {
      if (currentSim !== previousSim) {
        console.log(`🎮 Simulation changed: ${previousSim} → ${currentSim}`);
      }
    }
  );

  // Listen to UI changes (selected entity)
  store.selectSubscribe(
    Selectors.UI.getSelectedEntity,
    (selectedEntity: any, previousEntity: any) => {
      if (selectedEntity !== previousEntity) {
        console.log(`🎯 Entity selection changed: ${previousEntity} → ${selectedEntity}`);
      }
    }
  );
}

/**
 * Demonstrate the global state management system
 */
function demonstrateGlobalState() {
  console.log('\n🚀 Demonstrating Global State Management:');

  const store = (window as any).globalStore;
  const currentState = store.getState();

  // Show initial state summary
  const summary = Selectors.Meta.getStateSummary(currentState);
  console.log('📊 Current State Summary:', summary);

  // Show plugin information
  const allPlugins = Selectors.Plugin.getAllPlugins(currentState);
  const activePlugins = Selectors.Plugin.getActivePlugins(currentState);
  console.log(`🔌 Plugins: ${allPlugins.length} total, ${activePlugins.length} active`);

  // Show current simulation
  const currentSim = Selectors.Simulation.getCurrentSimulation(currentState);
  console.log(`🎮 Current Simulation: ${currentSim || 'None loaded'}`);

  // Show UI state
  const selectedEntity = Selectors.UI.getSelectedEntity(currentState);
  const visiblePanels = Selectors.UI.getVisiblePanels(currentState);
  console.log(`🎯 Selected Entity: ${selectedEntity || 'None'}`);
  console.log(`👁️  Visible Panels: ${visiblePanels.join(', ')}`);

  // Show viewport state
  const cameraPos = Selectors.Viewport.getCameraPosition(currentState);
  const showGrid = Selectors.Viewport.isGridVisible(currentState);
  console.log(`📷 Camera Position: (${cameraPos.x}, ${cameraPos.y}, ${cameraPos.z})`);
  console.log(`🔲 Grid Visible: ${showGrid}`);

  // Add to window for manual testing
  (window as any).demonstrateGlobalState = demonstrateGlobalState;

  console.log('\n💡 Try these in the browser console:');
  console.log('   - demonstrateGlobalState() - Run this demo again');
  console.log('   - globalStore.getState() - Get current state');
  console.log('   - stateSelectors.Plugin.getAllPlugins(globalStore.getState()) - Get plugins');
  console.log('   - globalStore.getStats() - Get store statistics');
  console.log('   - globalStore.getActionHistory() - See action history');
}

async function main() {
  // Enable logging for debugging
  Logger.getInstance().enable();
  Logger.getInstance().log("Initializing Physics Simulation Studio with Global State Management...");

  try {
    // 1. Initialize Global State Store FIRST - this must happen before everything else
    console.log("🌟 Initializing Global State Management System...");
    const globalStore = initializeGlobalStore();

    // Add global state debugging tools to window
    (window as any).globalStore = globalStore;
    (window as any).stateSelectors = Selectors;
    (window as any).stateActions = Actions;

    // 2. Set up core systems as before
    const { world, pluginManager, stateManager, studio, pluginDiscovery } = setupCoreSystems();

    // 3. Create the state synchronizer to bridge old and new state management
    console.log("🔗 Setting up state synchronization...");
    const stateSynchronizer = createGlobalStateSynchronizer(
      pluginManager,
      world.systemManager as SystemManager,
      world.componentManager as ComponentManager
    );
    (window as any).stateSynchronizer = stateSynchronizer;

    // 4. Set up UI and other systems
    const { uiManager, visibilityManager, pane } = setupUI(studio, stateManager, pluginManager);
    const visibilityOrchestrator = registerComponentsAndSystems(world as World, studio, pluginManager as PluginManager, visibilityManager, pane);

    // 5. Set up state change listeners for debugging and reactive updates
    setupStateChangeListeners(globalStore, studio);

    // 6. Auto-discover and register plugins
    console.log("🔍 Starting automatic plugin discovery...");
    const autoPluginRegistry = AutoPluginRegistry.getInstance();

    // Discover all plugins that implement ISimulationPlugin
    await autoPluginRegistry.discoverPlugins();

    // Auto-register all discovered plugins
    const registeredPlugins = await autoPluginRegistry.autoRegisterPlugins(world, pluginManager, studio);

    console.log(`✅ Auto-discovered and registered ${registeredPlugins.length} plugins: ${registeredPlugins.join(', ')}`);

    // Add plugins to plugin manager if not already added
    for (const pluginName of registeredPlugins) {
      const plugin = autoPluginRegistry.getPlugin(pluginName);
      if (plugin && pluginManager && !pluginManager.getPlugin?.(pluginName)) {
        try {
          pluginManager.registerPlugin(plugin);
        } catch (error) {
          console.log(`Plugin ${pluginName} already registered in manager:`, (error as Error).message);
        }
      }
    }

    // 7. Perform initial state synchronization AFTER everything is loaded
    console.log("🔄 Performing initial state synchronization...");
    stateSynchronizer.performInitialSync();

    // 8. Log state summary
    const stateSummary = Selectors.Meta.getStateSummary(globalStore.getState());
    console.log("📊 Initial State Summary:", stateSummary);

    console.log(`✅ Auto-registered ${registeredPlugins.length} plugins total`);
    console.log('🎯 Global immutable state management ready!');
    console.log('📋 State changes are now predictable and debuggable');

    // 9. STUDIO INTEGRATION FIX: Trigger parameter display for first available plugin
    if (registeredPlugins.length > 0) {
      const firstPlugin = registeredPlugins[0];
      console.log(`🔧 STUDIO FIX: Triggering parameter display for ${firstPlugin}`);

      // Find the property inspector system and trigger parameter display
      const systems = (world.systemManager as any).getSystems ? (world.systemManager as any).getSystems() : [];
      const propertySystem = systems.find((s: any) => s.constructor.name.includes('PropertyInspector'));

      if (propertySystem && typeof (propertySystem as any).showParametersForPlugin === 'function') {
        setTimeout(() => {
          console.log(`🎯 Triggering showParametersForPlugin(${firstPlugin})`);
          (propertySystem as any).showParametersForPlugin(firstPlugin);
        }, 1000); // Give UI time to render
      } else {
        console.warn('🔧 Property Inspector System not found or missing showParametersForPlugin method');

        // Alternative approach: dispatch custom event
        const event = new CustomEvent('force-parameter-display', {
          detail: { pluginName: firstPlugin }
        });
        window.dispatchEvent(event);
        console.log(`🎯 Dispatched force-parameter-display event for ${firstPlugin}`);
      }
    }

    Logger.getInstance().log(`Physics Simulation Studio ready with ${registeredPlugins.length} plugins and global state management`);

    // Run system diagnostics to ensure everything is working
    const diagnostics = new SystemDiagnostics(world as World);
    diagnostics.diagnoseAndFix();

    startApplication(studio);

    // Demonstrate the global state system
    setTimeout(() => {
      demonstrateGlobalState();
    }, 1000); // Give systems time to fully initialize

    Logger.getInstance().log("Physics Simulation Studio Initialized with Global State Management System");
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
