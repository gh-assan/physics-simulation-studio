/**
 * Example integration of the Global State Management System
 * This demonstrates how to integrate the new immutable state with your existing application
 */

import { GlobalStateStore, getGlobalStore, dispatchGlobal } from './GlobalStore';
import { Actions } from './Actions';
import { Selectors } from './Selectors';
import { createGlobalStateSynchronizer } from './StateIntegration';
import { PluginManager } from '../../core/plugin/PluginManager';
import { SystemManager } from '../../core/ecs/SystemManager';
import { ComponentManager } from '../../core/ecs/ComponentManager';
import { StateManager } from './StateManager';
import { Logger } from '../../core/utils/Logger';

/**
 * Updated main function showing how to integrate global state management
 */
async function mainWithGlobalState() {
  // Enable logging for debugging
  Logger.getInstance().enable();
  Logger.getInstance().log("Initializing Physics Simulation Studio with Global State Management...");

  try {
    // 1. Initialize the global state store FIRST
    const globalStore = getGlobalStore();
    
    // 2. Set up core systems as before
    const { world, pluginManager, stateManager, studio, pluginDiscovery } = setupCoreSystems();
    
    // 3. Create the state synchronizer to bridge old and new state management
    const stateSynchronizer = createGlobalStateSynchronizer(
      pluginManager,
      world.systemManager,
      world.componentManager
    );
    
    // 4. Set up UI and other systems
    const { uiManager, visibilityManager, pane } = setupUI(studio, stateManager, pluginManager);
    const visibilityOrchestrator = registerComponentsAndSystems(world, studio, pluginManager, visibilityManager, pane);

    // 5. Load available plugins dynamically
    const loadedPlugins = await pluginDiscovery.loadAllPlugins();
    
    // 6. Perform initial state synchronization after everything is loaded
    stateSynchronizer.performInitialSync();

    // 7. Set up state change listeners for debugging
    setupStateChangeListeners(globalStore);
    
    // 8. Start the application
    startApplication(studio);

    console.log(`✅ Loaded ${loadedPlugins.length} plugins with global state management`);
    console.log('🎯 Global immutable state ready!');
    console.log('📊 State changes are now predictable and debuggable');

    Logger.getInstance().log("Physics Simulation Studio initialized successfully with Global State Management");

    // Expose state tools for debugging
    (window as any).globalStore = globalStore;
    (window as any).stateSynchronizer = stateSynchronizer;
    (window as any).stateSelectors = Selectors;
    (window as any).stateActions = Actions;

  } catch (error) {
    console.error("Error during initialization:", error);
    Logger.getInstance().error("Failed to initialize the studio:", error);
    throw error;
  }
}

/**
 * Set up state change listeners for debugging and reactive updates
 */
function setupStateChangeListeners(store: GlobalStateStore) {
  // Listen to all state changes for debugging
  store.subscribe((newState, previousState, action) => {
    Logger.getInstance().log(`[State Change] ${action.type}`, {
      action,
      stateSummary: Selectors.Meta.getStateSummary(newState),
    });
  });

  // Listen specifically to plugin changes
  store.selectSubscribe(
    Selectors.Plugin.getAllPlugins,
    (newPlugins, previousPlugins) => {
      console.log(`Plugin state updated: ${newPlugins.length} total plugins`);
      console.log(`Active plugins: ${newPlugins.filter(p => p.isActive).map(p => p.name).join(', ')}`);
    }
  );

  // Listen to simulation changes
  store.selectSubscribe(
    Selectors.Simulation.getCurrentSimulation,
    (currentSim, previousSim) => {
      if (currentSim !== previousSim) {
        console.log(`Simulation changed: ${previousSim} → ${currentSim}`);
      }
    }
  );

  // Listen to UI changes (selected entity)
  store.selectSubscribe(
    Selectors.UI.getSelectedEntity,
    (selectedEntity, previousEntity) => {
      if (selectedEntity !== previousEntity) {
        console.log(`Entity selection changed: ${previousEntity} → ${selectedEntity}`);
        // Update property inspector automatically
        dispatchGlobal(Actions.entitySelected(selectedEntity, 'SelectionSystem'));
      }
    }
  );
}

/**
 * Enhanced plugin management with global state
 */
class StateAwarePluginManager {
  private pluginManager: PluginManager;
  private store: GlobalStateStore;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    this.store = getGlobalStore();
  }

  /**
   * Get plugin information from global state instead of plugin manager directly
   */
  getPluginInfo(pluginName: string) {
    return Selectors.Plugin.getPluginByName(this.store.getState(), pluginName);
  }

  /**
   * Get all active plugins from global state
   */
  getActivePlugins() {
    return Selectors.Plugin.getActivePlugins(this.store.getState());
  }

  /**
   * Check dependencies using global state
   */
  checkDependencies() {
    const pluginsWithUnmetDeps = Selectors.Plugin.getPluginsWithUnmetDependencies(this.store.getState());
    return pluginsWithUnmetDeps;
  }

  /**
   * Activate plugin with state management
   */
  async activatePlugin(pluginName: string, studio: any) {
    // Check if already active using state
    if (Selectors.Plugin.isPluginActive(this.store.getState(), pluginName)) {
      return;
    }

    // Use the original plugin manager to perform the activation
    await this.pluginManager.activatePlugin(pluginName, studio);
    
    // State will be automatically updated via the synchronizer
  }

  /**
   * Get dependency graph from state
   */
  getDependencyGraph() {
    return Selectors.Plugin.getPluginDependencyGraph(this.store.getState());
  }
}

/**
 * Enhanced UI manager with state integration
 */
class StateAwareUIManager {
  private store: GlobalStateStore;

  constructor() {
    this.store = getGlobalStore();
  }

  /**
   * Show/hide panels based on global state
   */
  updatePanelVisibility() {
    const visiblePanels = Selectors.UI.getVisiblePanels(this.store.getState());
    const selectedEntity = Selectors.UI.getSelectedEntity(this.store.getState());
    
    // Update UI based on state
    console.log(`Visible panels: ${visiblePanels.join(', ')}`);
    console.log(`Selected entity: ${selectedEntity}`);
  }

  /**
   * React to state changes
   */
  setupReactiveUI() {
    // Update UI when panel visibility changes
    this.store.selectSubscribe(
      Selectors.UI.getVisiblePanels,
      (visiblePanels) => {
        this.updatePanelVisibility();
      }
    );

    // Update property inspector when entity selection changes
    this.store.selectSubscribe(
      Selectors.UI.getSelectedEntity,
      (selectedEntity) => {
        if (selectedEntity) {
          this.showEntityProperties(selectedEntity);
        } else {
          this.hideEntityProperties();
        }
      }
    );
  }

  private showEntityProperties(entityId: string) {
    console.log(`Showing properties for entity: ${entityId}`);
    // Implement property inspector logic
  }

  private hideEntityProperties() {
    console.log('Hiding entity properties');
    // Implement hide logic
  }
}

/**
 * State-aware simulation management
 */
class StateAwareSimulationManager {
  private store: GlobalStateStore;

  constructor() {
    this.store = getGlobalStore();
  }

  /**
   * Load simulation with state management
   */
  loadSimulation(simulationName: string) {
    // Dispatch state change
    dispatchGlobal(Actions.simulationLoaded(simulationName, 'SimulationManager'));
    
    // The actual simulation loading will happen in response to state changes
    console.log(`Loading simulation: ${simulationName}`);
  }

  /**
   * Unload simulation
   */
  unloadSimulation() {
    dispatchGlobal(Actions.simulationUnloaded('SimulationManager'));
    console.log('Simulation unloaded');
  }

  /**
   * Get current simulation state
   */
  getSimulationState() {
    return Selectors.Simulation.getSimulationState(this.store.getState());
  }

  /**
   * Update simulation state (running/paused/etc)
   */
  updateSimulationState(updates: { isRunning?: boolean; isPaused?: boolean; frameCount?: number }) {
    dispatchGlobal({
      type: 'SIMULATION_STATE_CHANGED',
      payload: updates,
      timestamp: Date.now(),
      metadata: { source: 'SimulationManager' }
    });
  }
}

// Export the enhanced managers and main function
export {
  mainWithGlobalState,
  StateAwarePluginManager,
  StateAwareUIManager,
  StateAwareSimulationManager
};

// Example usage of the new state system
export function demonstrateStateManagement() {
  const store = getGlobalStore();
  
  // Example: Register a plugin via state
  dispatchGlobal(Actions.pluginRegistered({
    name: 'example-plugin',
    version: '1.0.0',
    dependencies: [],
    isRegistered: true,
    isActive: false,
    metadata: {
      displayName: 'Example Plugin',
      description: 'A demonstration plugin',
      author: 'Physics Studio Team'
    }
  }, 'DemoCode'));

  // Example: Select an entity
  dispatchGlobal(Actions.entitySelected('entity-123', 'DemoCode'));

  // Example: Move camera
  dispatchGlobal(Actions.cameraMoved(
    { x: 10, y: 5, z: 15 },
    { x: 0, y: 0, z: 0 },
    1.5,
    'DemoCode'
  ));

  // Get state information
  const stateSummary = Selectors.Meta.getStateSummary(store.getState());
  console.log('Current state summary:', stateSummary);

  // Get specific information
  const activePlugins = Selectors.Plugin.getActivePluginNames(store.getState());
  const selectedEntity = Selectors.UI.getSelectedEntity(store.getState());
  const currentSim = Selectors.Simulation.getCurrentSimulation(store.getState());

  console.log('Active plugins:', activePlugins);
  console.log('Selected entity:', selectedEntity);  
  console.log('Current simulation:', currentSim);
}

// Make functions available for import
declare global {
  interface Window {
    globalStore: GlobalStateStore;
    stateSynchronizer: any;
    stateSelectors: typeof Selectors;
    stateActions: typeof Actions;
    demonstrateStateManagement: typeof demonstrateStateManagement;
  }
}

if (typeof window !== 'undefined') {
  window.demonstrateStateManagement = demonstrateStateManagement;
}
