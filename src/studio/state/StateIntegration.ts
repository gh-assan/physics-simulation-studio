/**
 * Integration layer for connecting existing managers to the global state system
 * This allows gradual migration from the current architecture to immutable state management
 */

import { PluginManager } from '../../core/plugin/PluginManager';
import { SystemManager } from '../../core/ecs/SystemManager';
import { ComponentManager } from '../../core/ecs/ComponentManager';
import { GlobalStateStore, getGlobalStore } from './GlobalStore';
import { Actions } from './Actions';
import { Selectors } from './Selectors';
import { PluginInfo, SystemInfo, ComponentInfo } from './AppState';
import { Logger } from '../../core/utils/Logger';

/**
 * State synchronizer for PluginManager
 * Keeps the global state in sync with PluginManager operations
 */
export class PluginManagerStateSync {
  private pluginManager: PluginManager;
  private store: GlobalStateStore;
  private unsubscribers: (() => void)[] = [];

  constructor(pluginManager: PluginManager, store?: GlobalStateStore) {
    this.pluginManager = pluginManager;
    this.store = store || getGlobalStore();
    this.initialize();
  }

  private initialize(): void {
    // Listen to plugin manager events and update global state
    const unsubscribeRegistered = this.pluginManager.onPluginRegistered((plugin) => {
      const pluginInfo: PluginInfo = {
        name: plugin.getName(),
        version: "1.0.0", // Default version - could be enhanced to get from plugin
        dependencies: plugin.getDependencies(),
        isRegistered: true,
        isActive: false,
        metadata: {
          displayName: plugin.getName(),
          description: `${plugin.getName()} simulation plugin`,
          author: "Unknown", // Could be enhanced to get from plugin metadata
        }
      };

      this.store.dispatch(Actions.pluginRegistered(pluginInfo, 'PluginManager'));
      Logger.getInstance().log(`[PluginManagerStateSync] Plugin registered: ${plugin.getName()}`);
    });

    const unsubscribeActivated = this.pluginManager.onPluginActivated((plugin) => {
      this.store.dispatch(Actions.pluginActivated(plugin.getName(), 'PluginManager'));
      Logger.getInstance().log(`[PluginManagerStateSync] Plugin activated: ${plugin.getName()}`);
    });

    const unsubscribeDeactivated = this.pluginManager.onPluginDeactivated((plugin) => {
      this.store.dispatch(Actions.pluginDeactivated(plugin.getName(), 'PluginManager'));
      Logger.getInstance().log(`[PluginManagerStateSync] Plugin deactivated: ${plugin.getName()}`);
    });

    // Store unsubscribers for cleanup
    this.unsubscribers.push(unsubscribeRegistered, unsubscribeActivated, unsubscribeDeactivated);
  }

  /**
   * Manually sync current plugin state to global store
   * Useful for initial state population
   */
  syncCurrentState(): void {
    const availablePluginNames = this.pluginManager.getAvailablePluginNames();
    const activePluginNames = new Set(this.pluginManager.getActivePluginNames());

    for (const pluginName of availablePluginNames) {
      const plugin = this.pluginManager.getPlugin(pluginName);
      if (plugin) {
        const pluginInfo: PluginInfo = {
          name: plugin.getName(),
          version: "1.0.0",
          dependencies: plugin.getDependencies(),
          isRegistered: true,
          isActive: activePluginNames.has(pluginName),
          metadata: {
            displayName: plugin.getName(),
            description: `${plugin.getName()} simulation plugin`,
            author: "Unknown",
          }
        };

        this.store.dispatch(Actions.pluginRegistered(pluginInfo, 'PluginManagerSync'));
        if (activePluginNames.has(pluginName)) {
          this.store.dispatch(Actions.pluginActivated(pluginName, 'PluginManagerSync'));
        }
      }
    }

    Logger.getInstance().log(`[PluginManagerStateSync] Synced ${availablePluginNames.length} plugins to global state`);
  }

  /**
   * Cleanup subscriptions
   */
  dispose(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

/**
 * State synchronizer for SystemManager
 */
export class SystemManagerStateSync {
  private systemManager: SystemManager;
  private store: GlobalStateStore;
  private unsubscribers: (() => void)[] = [];

  constructor(systemManager: SystemManager, store?: GlobalStateStore) {
    this.systemManager = systemManager;
    this.store = store || getGlobalStore();
    this.initialize();
  }

  private initialize(): void {
    // Listen to system registration events
    this.systemManager.onSystemRegistered((system) => {
      const systemInfo: SystemInfo = {
        name: system.constructor.name,
        priority: system.priority || 0,
        isActive: true, // Systems are active by default when registered
        componentDependencies: [], // Could be enhanced to detect component dependencies
      };

      this.store.dispatch(Actions.systemRegistered(systemInfo, 'SystemManager'));
      Logger.getInstance().log(`[SystemManagerStateSync] System registered: ${system.constructor.name}`);
    });
  }

  /**
   * Manually sync current system state to global store
   */
  syncCurrentState(): void {
    const systems = this.systemManager.getAllSystems();

    for (const system of systems) {
      const systemInfo: SystemInfo = {
        name: system.constructor.name,
        priority: system.priority || 0,
        isActive: true,
        componentDependencies: [],
      };

      this.store.dispatch(Actions.systemRegistered(systemInfo, 'SystemManagerSync'));
    }

    Logger.getInstance().log(`[SystemManagerStateSync] Synced ${systems.length} systems to global state`);
  }

  dispose(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

/**
 * State synchronizer for ComponentManager
 */
export class ComponentManagerStateSync {
  private componentManager: ComponentManager;
  private store: GlobalStateStore;
  private unsubscribers: (() => void)[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(componentManager: ComponentManager, store?: GlobalStateStore) {
    this.componentManager = componentManager;
    this.store = store || getGlobalStore();
    this.initialize();
  }

  private initialize(): void {
    // Since ComponentManager doesn't have registration events,
    // we'll poll for component changes periodically
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    // Update component entity counts every second
    this.updateInterval = setInterval(() => {
      this.updateComponentEntityCounts();
    }, 1000);
  }

  private updateComponentEntityCounts(): void {
    const currentState = this.store.getState();
    const registeredComponents = Selectors.Component.getAllComponents(currentState);

    for (const component of registeredComponents) {
      // Get actual entity count from component manager using component types
      const entityCount = this.componentManager.getEntitiesWithComponentTypes([component.name]).length;
      
      if (entityCount !== component.entityCount) {
        this.store.dispatch(Actions.componentRegistered({
          ...component,
          entityCount
        } as ComponentInfo, 'ComponentManagerSync'));
      }
    }
  }

  /**
   * Manually sync current component state to global store
   */
  syncCurrentState(): void {
    const componentConstructors = this.componentManager.getComponentConstructors();

    for (const [componentName, constructor] of componentConstructors.entries()) {
      const entityCount = this.componentManager.getEntitiesWithComponentTypes([componentName]).length;
      
      const componentInfo: ComponentInfo = {
        name: componentName,
        type: componentName, // Could be enhanced to get actual type info
        isRegistered: true,
        entityCount,
      };

      this.store.dispatch(Actions.componentRegistered(componentInfo, 'ComponentManagerSync'));
    }

    Logger.getInstance().log(`[ComponentManagerStateSync] Synced ${componentConstructors.size} components to global state`);
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

/**
 * Master state synchronizer that coordinates all subsystem synchronizers
 */
export class GlobalStateSynchronizer {
  private pluginSync: PluginManagerStateSync;
  private systemSync: SystemManagerStateSync;
  private componentSync: ComponentManagerStateSync;
  private store: GlobalStateStore;

  constructor(
    pluginManager: PluginManager,
    systemManager: SystemManager,
    componentManager: ComponentManager,
    store?: GlobalStateStore
  ) {
    this.store = store || getGlobalStore();
    
    this.pluginSync = new PluginManagerStateSync(pluginManager, this.store);
    this.systemSync = new SystemManagerStateSync(systemManager, this.store);
    this.componentSync = new ComponentManagerStateSync(componentManager, this.store);
  }

  /**
   * Perform initial synchronization of all current state
   * This should be called during application startup after all managers are initialized
   */
  performInitialSync(): void {
    Logger.getInstance().log('[GlobalStateSynchronizer] Starting initial state synchronization...');
    
    this.pluginSync.syncCurrentState();
    this.systemSync.syncCurrentState();
    this.componentSync.syncCurrentState();

    // Dispatch application initialized action
    this.store.dispatch(Actions.applicationInitialized());

    Logger.getInstance().log('[GlobalStateSynchronizer] Initial state synchronization complete');
  }

  /**
   * Get current state summary for debugging
   */
  getStateSummary() {
    return Selectors.Meta.getStateSummary(this.store.getState());
  }

  /**
   * Cleanup all synchronizers
   */
  dispose(): void {
    this.pluginSync.dispose();
    this.systemSync.dispose();
    this.componentSync.dispose();
  }
}

/**
 * Utility function to create a global state synchronizer with all current managers
 * This provides a simple way to integrate the new state system with existing code
 */
export function createGlobalStateSynchronizer(
  pluginManager: PluginManager,
  systemManager: SystemManager,
  componentManager: ComponentManager
): GlobalStateSynchronizer {
  return new GlobalStateSynchronizer(pluginManager, systemManager, componentManager);
}
