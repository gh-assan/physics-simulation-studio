/**
 * State Selectors - Functions to extract specific data from the global state
 * These provide a clean API for accessing state data and can be memoized for performance
 */

import { AppState, PluginInfo, SystemInfo, ComponentInfo } from './AppState';

/**
 * Plugin selectors
 */
export const PluginSelectors = {
  /**
   * Get all registered plugins
   */
  getAllPlugins: (state: AppState): readonly PluginInfo[] => state.plugins,

  /**
   * Get all active plugins
   */
  getActivePlugins: (state: AppState): readonly PluginInfo[] =>
    state.plugins.filter(plugin => plugin.isActive),

  /**
   * Get plugin by name
   */
  getPluginByName: (state: AppState, pluginName: string): PluginInfo | undefined =>
    state.plugins.find(plugin => plugin.name === pluginName),

  /**
   * Check if plugin is registered
   */
  isPluginRegistered: (state: AppState, pluginName: string): boolean =>
    state.plugins.some(plugin => plugin.name === pluginName),

  /**
   * Check if plugin is active
   */
  isPluginActive: (state: AppState, pluginName: string): boolean =>
    state.plugins.some(plugin => plugin.name === pluginName && plugin.isActive),

  /**
   * Get plugin names (useful for UI dropdowns)
   */
  getPluginNames: (state: AppState): readonly string[] =>
    state.plugins.map(plugin => plugin.name),

  /**
   * Get active plugin names
   */
  getActivePluginNames: (state: AppState): readonly string[] =>
    state.plugins.filter(plugin => plugin.isActive).map(plugin => plugin.name),

  /**
   * Get plugins with unmet dependencies
   */
  getPluginsWithUnmetDependencies: (state: AppState): readonly PluginInfo[] => {
    const registeredNames = new Set(state.plugins.map(p => p.name));
    return state.plugins.filter(plugin =>
      plugin.dependencies.some(dep => !registeredNames.has(dep))
    );
  },

  /**
   * Get plugin dependency graph
   */
  getPluginDependencyGraph: (state: AppState): Map<string, readonly string[]> => {
    const graph = new Map<string, readonly string[]>();
    for (const plugin of state.plugins) {
      graph.set(plugin.name, plugin.dependencies);
    }
    return graph;
  }
};

/**
 * System selectors
 */
export const SystemSelectors = {
  /**
   * Get all registered systems
   */
  getAllSystems: (state: AppState): readonly SystemInfo[] => state.systems,

  /**
   * Get all active systems
   */
  getActiveSystems: (state: AppState): readonly SystemInfo[] =>
    state.systems.filter(system => system.isActive),

  /**
   * Get systems by priority (sorted)
   */
  getSystemsByPriority: (state: AppState): readonly SystemInfo[] =>
    [...state.systems].sort((a, b) => a.priority - b.priority),

  /**
   * Get system by name
   */
  getSystemByName: (state: AppState, systemName: string): SystemInfo | undefined =>
    state.systems.find(system => system.name === systemName),

  /**
   * Check if system is registered
   */
  isSystemRegistered: (state: AppState, systemName: string): boolean =>
    state.systems.some(system => system.name === systemName),

  /**
   * Get system names
   */
  getSystemNames: (state: AppState): readonly string[] =>
    state.systems.map(system => system.name),
};

/**
 * Component selectors
 */
export const ComponentSelectors = {
  /**
   * Get all registered components
   */
  getAllComponents: (state: AppState): readonly ComponentInfo[] => state.components,

  /**
   * Get components with entities
   */
  getComponentsWithEntities: (state: AppState): readonly ComponentInfo[] =>
    state.components.filter(component => component.entityCount > 0),

  /**
   * Get component by name
   */
  getComponentByName: (state: AppState, componentName: string): ComponentInfo | undefined =>
    state.components.find(component => component.name === componentName),

  /**
   * Get total entity count across all components
   */
  getTotalEntityCount: (state: AppState): number =>
    state.components.reduce((total, component) => total + component.entityCount, 0),

  /**
   * Get component names
   */
  getComponentNames: (state: AppState): readonly string[] =>
    state.components.map(component => component.name),
};

/**
 * UI selectors
 */
export const UISelectors = {
  /**
   * Get all UI state
   */
  getUIState: (state: AppState) => state.ui,

  /**
   * Get currently selected entity
   */
  getSelectedEntity: (state: AppState): string | null => state.ui.selectedEntity,

  /**
   * Check if entity is selected
   */
  isEntitySelected: (state: AppState): boolean => state.ui.selectedEntity !== null,

  /**
   * Get visible panels
   */
  getVisiblePanels: (state: AppState): readonly string[] => state.ui.visiblePanels,

  /**
   * Check if panel is visible
   */
  isPanelVisible: (state: AppState, panelId: string): boolean =>
    state.ui.visiblePanels.includes(panelId),

  /**
   * Get active panels
   */
  getActivePanels: (state: AppState): readonly string[] => state.ui.activePanels,

  /**
   * Get inspector mode
   */
  getInspectorMode: (state: AppState) => state.ui.inspectorMode,

  /**
   * Get current theme
   */
  getTheme: (state: AppState) => state.ui.theme,
};

/**
 * Simulation selectors
 */
export const SimulationSelectors = {
  /**
   * Get all simulation state
   */
  getSimulationState: (state: AppState) => state.simulation,

  /**
   * Get current simulation name
   */
  getCurrentSimulation: (state: AppState): string | null => state.simulation.currentSimulation,

  /**
   * Check if a simulation is loaded
   */
  isSimulationLoaded: (state: AppState): boolean => state.simulation.currentSimulation !== null,

  /**
   * Check if simulation is running
   */
  isSimulationRunning: (state: AppState): boolean => state.simulation.isRunning,

  /**
   * Check if simulation is paused
   */
  isSimulationPaused: (state: AppState): boolean => state.simulation.isPaused,

  /**
   * Get frame count
   */
  getFrameCount: (state: AppState): number => state.simulation.frameCount,

  /**
   * Get frame rate
   */
  getFrameRate: (state: AppState): number => state.simulation.frameRate,

  /**
   * Get delta time
   */
  getDeltaTime: (state: AppState): number => state.simulation.deltaTime,
};

/**
 * Viewport selectors
 */
export const ViewportSelectors = {
  /**
   * Get all viewport state
   */
  getViewportState: (state: AppState) => state.viewport,

  /**
   * Get camera state
   */
  getCameraState: (state: AppState) => state.viewport.camera,

  /**
   * Get camera position
   */
  getCameraPosition: (state: AppState) => state.viewport.camera.position,

  /**
   * Get camera target
   */
  getCameraTarget: (state: AppState) => state.viewport.camera.target,

  /**
   * Get camera zoom
   */
  getCameraZoom: (state: AppState): number => state.viewport.camera.zoom,

  /**
   * Get rendering settings
   */
  getRenderingSettings: (state: AppState) => state.viewport.rendering,

  /**
   * Check if grid is visible
   */
  isGridVisible: (state: AppState): boolean => state.viewport.rendering.showGrid,

  /**
   * Check if axes are visible
   */
  areAxesVisible: (state: AppState): boolean => state.viewport.rendering.showAxes,

  /**
   * Get control settings
   */
  getControlSettings: (state: AppState) => state.viewport.controls,

  /**
   * Check if snap to grid is enabled
   */
  isSnapToGridEnabled: (state: AppState): boolean => state.viewport.controls.snapToGrid,

  /**
   * Get grid size
   */
  getGridSize: (state: AppState): number => state.viewport.controls.gridSize,
};

/**
 * Configuration selectors
 */
export const ConfigurationSelectors = {
  /**
   * Get all configuration
   */
  getConfiguration: (state: AppState) => state.configuration,

  /**
   * Get application version
   */
  getVersion: (state: AppState): string => state.configuration.version,

  /**
   * Get environment
   */
  getEnvironment: (state: AppState) => state.configuration.environment,

  /**
   * Check if debug mode is enabled
   */
  isDebugMode: (state: AppState): boolean => state.configuration.features.debugMode,

  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled: (state: AppState): boolean =>
    state.configuration.features.performanceMonitoring,

  /**
   * Get application limits
   */
  getLimits: (state: AppState) => state.configuration.limits,
};

/**
 * Meta selectors - information about the state itself
 */
export const MetaSelectors = {
  /**
   * Get when the state was last updated
   */
  getLastUpdated: (state: AppState): number => state.lastUpdated,

  /**
   * Get a summary of the current state for debugging
   */
  getStateSummary: (state: AppState) => ({
    pluginCount: state.plugins.length,
    activePluginCount: state.plugins.filter(p => p.isActive).length,
    systemCount: state.systems.length,
    activeSystemCount: state.systems.filter(s => s.isActive).length,
    componentCount: state.components.length,
    totalEntityCount: state.components.reduce((sum, c) => sum + c.entityCount, 0),
    selectedEntity: state.ui.selectedEntity,
    currentSimulation: state.simulation.currentSimulation,
    isRunning: state.simulation.isRunning,
    lastUpdated: new Date(state.lastUpdated).toISOString(),
  }),
};

/**
 * Performance selectors
 */
export const PerformanceSelectors = {
  /**
   * Get current performance metrics
   */
  getMetrics: (state: AppState) => state.performance.metrics,

  /**
   * Get current frame rate
   */
  getFrameRate: (state: AppState): number => state.performance.metrics.frameRate,

  /**
   * Get average frame rate
   */
  getAverageFrameRate: (state: AppState): number => state.performance.metrics.averageFrameRate,

  /**
   * Get system update times
   */
  getSystemUpdateTimes: (state: AppState) => state.performance.systemUpdateTimes,

  /**
   * Get slowest systems
   */
  getSlowestSystems: (state: AppState, count = 5) =>
    [...state.performance.systemUpdateTimes]
      .sort((a, b) => b.time - a.time)
      .slice(0, count),

  /**
   * Get entity count
   */
  getEntityCount: (state: AppState): number => state.performance.entityCount,

  /**
   * Check if performance is good (>= 55 FPS)
   */
  isPerformanceGood: (state: AppState): boolean => state.performance.metrics.frameRate >= 55,

  /**
   * Get memory usage
   */
  getMemoryUsage: (state: AppState): number => state.performance.metrics.memoryUsage,
};

/**
 * Error selectors
 */
export const ErrorSelectors = {
  /**
   * Get all errors
   */
  getAllErrors: (state: AppState) => state.errors.errors,

  /**
   * Get unacknowledged errors
   */
  getUnacknowledgedErrors: (state: AppState) =>
    state.errors.errors.filter(error => !error.acknowledged),

  /**
   * Get errors by level
   */
  getErrorsByLevel: (state: AppState, level: 'warning' | 'error' | 'critical') =>
    state.errors.errors.filter(error => error.level === level),

  /**
   * Get critical errors
   */
  getCriticalErrors: (state: AppState) =>
    state.errors.errors.filter(error => error.level === 'critical'),

  /**
   * Get error count
   */
  getErrorCount: (state: AppState): number => state.errors.errors.length,

  /**
   * Get unacknowledged error count
   */
  getUnacknowledgedErrorCount: (state: AppState): number =>
    state.errors.errors.filter(error => !error.acknowledged).length,

  /**
   * Check if there are critical errors
   */
  hasCriticalErrors: (state: AppState): boolean =>
    state.errors.errors.some(error => error.level === 'critical'),

  /**
   * Get most recent error
   */
  getMostRecentError: (state: AppState) =>
    state.errors.errors.length > 0 ? state.errors.errors[0] : null,
};

/**
 * Entity selectors
 */
export const EntitySelectors = {
  /**
   * Get all entities
   */
  getAllEntities: (state: AppState) => state.entities.entities,

  /**
   * Get selected entities
   */
  getSelectedEntities: (state: AppState) =>
    state.entities.entities.filter(entity => entity.isSelected),

  /**
   * Get selected entity IDs
   */
  getSelectedEntityIds: (state: AppState): readonly string[] => state.entities.selectedEntities,

  /**
   * Get visible entities
   */
  getVisibleEntities: (state: AppState) =>
    state.entities.entities.filter(entity => entity.isVisible),

  /**
   * Get entity by ID
   */
  getEntityById: (state: AppState, entityId: string) =>
    state.entities.entities.find(entity => entity.id === entityId),

  /**
   * Get entities with component
   */
  getEntitiesWithComponent: (state: AppState, componentName: string) =>
    state.entities.entities.filter(entity =>
      entity.components.includes(componentName)
    ),

  /**
   * Get entity count
   */
  getEntityCount: (state: AppState): number => state.entities.totalCount,

  /**
   * Get selected entity count
   */
  getSelectedEntityCount: (state: AppState): number => state.entities.selectedEntities.length,

  /**
   * Check if entity is selected
   */
  isEntitySelected: (state: AppState, entityId: string): boolean =>
    state.entities.selectedEntities.includes(entityId),

  /**
   * Check if any entities are selected
   */
  hasSelectedEntities: (state: AppState): boolean => state.entities.selectedEntities.length > 0,
};

/**
 * User preference selectors
 */
export const UserPreferenceSelectors = {
  /**
   * Get current theme
   */
  getTheme: (state: AppState) => state.userPreferences.theme,

  /**
   * Get grid settings
   */
  getGridSettings: (state: AppState) => state.userPreferences.gridSettings,

  /**
   * Check if auto save is enabled
   */
  isAutoSaveEnabled: (state: AppState): boolean => state.userPreferences.autoSave,

  /**
   * Check if debug panels are visible
   */
  areDebugPanelsVisible: (state: AppState): boolean => state.userPreferences.debugPanelsVisible,

  /**
   * Get all preferences
   */
  getAllPreferences: (state: AppState) => state.userPreferences,
};

/**
 * Combined selectors object for easy access
 */
export const Selectors = {
  Plugin: PluginSelectors,
  System: SystemSelectors,
  Component: ComponentSelectors,
  UI: UISelectors,
  Simulation: SimulationSelectors,
  Viewport: ViewportSelectors,
  Configuration: ConfigurationSelectors,
  Performance: PerformanceSelectors,
  Error: ErrorSelectors,
  Entity: EntitySelectors,
  UserPreference: UserPreferenceSelectors,
  Meta: MetaSelectors,
};
