/**
 * Action Types for State Management
 * These define all possible state changes in the application
 */

import { PluginInfo, SystemInfo, ComponentInfo, UIState, SimulationState, ViewportState } from './AppState';

// Base action interface
export interface BaseAction {
  readonly type: string;
  readonly timestamp?: number;
  readonly metadata?: {
    readonly source: string;
    readonly correlationId?: string;
  };
}

// Plugin Actions
export interface PluginRegisteredAction extends BaseAction {
  readonly type: 'PLUGIN_REGISTERED';
  readonly payload: {
    readonly plugin: PluginInfo;
  };
}

export interface PluginActivatedAction extends BaseAction {
  readonly type: 'PLUGIN_ACTIVATED';
  readonly payload: {
    readonly pluginName: string;
  };
}

export interface PluginDeactivatedAction extends BaseAction {
  readonly type: 'PLUGIN_DEACTIVATED';
  readonly payload: {
    readonly pluginName: string;
  };
}

// System Actions
export interface SystemRegisteredAction extends BaseAction {
  readonly type: 'SYSTEM_REGISTERED';
  readonly payload: {
    readonly system: SystemInfo;
  };
}

export interface SystemActivatedAction extends BaseAction {
  readonly type: 'SYSTEM_ACTIVATED';
  readonly payload: {
    readonly systemName: string;
  };
}

// Component Actions
export interface ComponentRegisteredAction extends BaseAction {
  readonly type: 'COMPONENT_REGISTERED';
  readonly payload: {
    readonly component: ComponentInfo;
  };
}

export interface ComponentEntityCountUpdatedAction extends BaseAction {
  readonly type: 'COMPONENT_ENTITY_COUNT_UPDATED';
  readonly payload: {
    readonly componentName: string;
    readonly newCount: number;
  };
}

// UI Actions
export interface PanelVisibilityChangedAction extends BaseAction {
  readonly type: 'PANEL_VISIBILITY_CHANGED';
  readonly payload: {
    readonly panelId: string;
    readonly isVisible: boolean;
  };
}

export interface EntitySelectedAction extends BaseAction {
  readonly type: 'ENTITY_SELECTED';
  readonly payload: {
    readonly entityId: string | null;
  };
}

export interface InspectorModeChangedAction extends BaseAction {
  readonly type: 'INSPECTOR_MODE_CHANGED';
  readonly payload: {
    readonly mode: 'component' | 'system' | 'plugin';
  };
}

// Simulation Actions
export interface SimulationLoadedAction extends BaseAction {
  readonly type: 'SIMULATION_LOADED';
  readonly payload: {
    readonly simulationName: string;
  };
}

export interface SimulationUnloadedAction extends BaseAction {
  readonly type: 'SIMULATION_UNLOADED';
}

export interface SimulationStateChangedAction extends BaseAction {
  readonly type: 'SIMULATION_STATE_CHANGED';
  readonly payload: Partial<SimulationState>;
}

// Viewport Actions
export interface CameraMovedAction extends BaseAction {
  readonly type: 'CAMERA_MOVED';
  readonly payload: {
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
    readonly target: { readonly x: number; readonly y: number; readonly z: number };
    readonly zoom: number;
  };
}

export interface ViewportSettingsChangedAction extends BaseAction {
  readonly type: 'VIEWPORT_SETTINGS_CHANGED';
  readonly payload: Partial<ViewportState>;
}

// Application lifecycle actions
export interface ApplicationInitializedAction extends BaseAction {
  readonly type: 'APPLICATION_INITIALIZED';
}

export interface ApplicationShutdownAction extends BaseAction {
  readonly type: 'APPLICATION_SHUTDOWN';
}

// Performance monitoring actions
export interface PerformanceMetricsUpdatedAction extends BaseAction {
  readonly type: 'PERFORMANCE_METRICS_UPDATED';
  readonly payload: {
    readonly frameRate: number;
    readonly renderTime: number;
    readonly updateTime: number;
    readonly memoryUsage: number;
    readonly entityCount: number;
  };
}

export interface SystemPerformanceUpdatedAction extends BaseAction {
  readonly type: 'SYSTEM_PERFORMANCE_UPDATED';
  readonly payload: {
    readonly systemName: string;
    readonly updateTime: number;
  };
}

// Error handling actions
export interface ErrorOccurredAction extends BaseAction {
  readonly type: 'ERROR_OCCURRED';
  readonly payload: {
    readonly error: string;
    readonly level: 'warning' | 'error' | 'critical';
    readonly source: string;
    readonly stackTrace?: string;
  };
}

export interface ErrorAcknowledgedAction extends BaseAction {
  readonly type: 'ERROR_ACKNOWLEDGED';
  readonly payload: {
    readonly errorId: string;
  };
}

export interface ErrorsClearedAction extends BaseAction {
  readonly type: 'ERRORS_CLEARED';
}

// Entity management actions
export interface EntityCreatedAction extends BaseAction {
  readonly type: 'ENTITY_CREATED';
  readonly payload: {
    readonly entityId: string;
    readonly name?: string;
    readonly components: readonly string[];
  };
}

export interface EntityDestroyedAction extends BaseAction {
  readonly type: 'ENTITY_DESTROYED';
  readonly payload: {
    readonly entityId: string;
  };
}

export interface EntityVisibilityChangedAction extends BaseAction {
  readonly type: 'ENTITY_VISIBILITY_CHANGED';
  readonly payload: {
    readonly entityId: string;
    readonly isVisible: boolean;
  };
}

export interface EntitiesSelectedAction extends BaseAction {
  readonly type: 'ENTITIES_SELECTED';
  readonly payload: {
    readonly entityIds: readonly string[];
  };
}

// User preferences actions
export interface UserPreferenceChangedAction extends BaseAction {
  readonly type: 'USER_PREFERENCE_CHANGED';
  readonly payload: {
    readonly key: string;
    readonly value: any;
  };
}

export interface ThemeChangedAction extends BaseAction {
  readonly type: 'THEME_CHANGED';
  readonly payload: {
    readonly theme: 'light' | 'dark' | 'auto';
  };
}

// Union of all possible actions
export type AppAction =
  | PluginRegisteredAction
  | PluginActivatedAction
  | PluginDeactivatedAction
  | SystemRegisteredAction
  | SystemActivatedAction
  | ComponentRegisteredAction
  | ComponentEntityCountUpdatedAction
  | PanelVisibilityChangedAction
  | EntitySelectedAction
  | InspectorModeChangedAction
  | SimulationLoadedAction
  | SimulationUnloadedAction
  | SimulationStateChangedAction
  | CameraMovedAction
  | ViewportSettingsChangedAction
  | ApplicationInitializedAction
  | ApplicationShutdownAction
  | PerformanceMetricsUpdatedAction
  | SystemPerformanceUpdatedAction
  | ErrorOccurredAction
  | ErrorAcknowledgedAction
  | ErrorsClearedAction
  | EntityCreatedAction
  | EntityDestroyedAction
  | EntityVisibilityChangedAction
  | EntitiesSelectedAction
  | UserPreferenceChangedAction
  | ThemeChangedAction;

/**
 * Action Creators - Helper functions to create actions with consistent structure
 */

export const Actions = {
  // Plugin actions
  pluginRegistered: (plugin: PluginInfo, source = 'PluginManager'): PluginRegisteredAction => ({
    type: 'PLUGIN_REGISTERED',
    payload: { plugin },
    timestamp: Date.now(),
    metadata: { source },
  }),

  pluginActivated: (pluginName: string, source = 'PluginManager'): PluginActivatedAction => ({
    type: 'PLUGIN_ACTIVATED',
    payload: { pluginName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  pluginDeactivated: (pluginName: string, source = 'PluginManager'): PluginDeactivatedAction => ({
    type: 'PLUGIN_DEACTIVATED',
    payload: { pluginName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // System actions
  systemRegistered: (system: SystemInfo, source = 'SystemManager'): SystemRegisteredAction => ({
    type: 'SYSTEM_REGISTERED',
    payload: { system },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Component actions
  componentRegistered: (component: ComponentInfo, source = 'ComponentManager'): ComponentRegisteredAction => ({
    type: 'COMPONENT_REGISTERED',
    payload: { component },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // UI actions
  entitySelected: (entityId: string | null, source = 'SelectionSystem'): EntitySelectedAction => ({
    type: 'ENTITY_SELECTED',
    payload: { entityId },
    timestamp: Date.now(),
    metadata: { source },
  }),

  panelVisibilityChanged: (panelId: string, isVisible: boolean, source = 'VisibilityManager'): PanelVisibilityChangedAction => ({
    type: 'PANEL_VISIBILITY_CHANGED',
    payload: { panelId, isVisible },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Simulation actions
  simulationLoaded: (simulationName: string, source = 'Studio'): SimulationLoadedAction => ({
    type: 'SIMULATION_LOADED',
    payload: { simulationName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  simulationUnloaded: (source = 'Studio'): SimulationUnloadedAction => ({
    type: 'SIMULATION_UNLOADED',
    timestamp: Date.now(),
    metadata: { source },
  }),

  simulationStateChanged: (stateChanges: Partial<SimulationState>, source = 'Studio'): SimulationStateChangedAction => ({
    type: 'SIMULATION_STATE_CHANGED',
    payload: stateChanges,
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Viewport actions
  cameraMoved: (position: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, zoom: number, source = 'CameraControls'): CameraMovedAction => ({
    type: 'CAMERA_MOVED',
    payload: { position, target, zoom },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Application lifecycle
  applicationInitialized: (): ApplicationInitializedAction => ({
    type: 'APPLICATION_INITIALIZED',
    timestamp: Date.now(),
    metadata: { source: 'Application' },
  }),

  // Performance monitoring
  performanceMetricsUpdated: (
    frameRate: number,
    renderTime: number,
    updateTime: number,
    memoryUsage: number,
    entityCount: number,
    source = 'PerformanceMonitor'
  ): PerformanceMetricsUpdatedAction => ({
    type: 'PERFORMANCE_METRICS_UPDATED',
    payload: { frameRate, renderTime, updateTime, memoryUsage, entityCount },
    timestamp: Date.now(),
    metadata: { source },
  }),

  systemPerformanceUpdated: (systemName: string, updateTime: number, source = 'SystemManager'): SystemPerformanceUpdatedAction => ({
    type: 'SYSTEM_PERFORMANCE_UPDATED',
    payload: { systemName, updateTime },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Error handling
  errorOccurred: (
    error: string,
    level: 'warning' | 'error' | 'critical',
    source: string,
    stackTrace?: string
  ): ErrorOccurredAction => ({
    type: 'ERROR_OCCURRED',
    payload: { error, level, source, stackTrace },
    timestamp: Date.now(),
    metadata: { source },
  }),

  errorAcknowledged: (errorId: string, source = 'ErrorManager'): ErrorAcknowledgedAction => ({
    type: 'ERROR_ACKNOWLEDGED',
    payload: { errorId },
    timestamp: Date.now(),
    metadata: { source },
  }),

  errorsCleared: (source = 'ErrorManager'): ErrorsClearedAction => ({
    type: 'ERRORS_CLEARED',
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Entity management
  entityCreated: (entityId: string, components: string[], name?: string, source = 'EntityManager'): EntityCreatedAction => ({
    type: 'ENTITY_CREATED',
    payload: { entityId, components, name },
    timestamp: Date.now(),
    metadata: { source },
  }),

  entityDestroyed: (entityId: string, source = 'EntityManager'): EntityDestroyedAction => ({
    type: 'ENTITY_DESTROYED',
    payload: { entityId },
    timestamp: Date.now(),
    metadata: { source },
  }),

  entityVisibilityChanged: (entityId: string, isVisible: boolean, source = 'RenderSystem'): EntityVisibilityChangedAction => ({
    type: 'ENTITY_VISIBILITY_CHANGED',
    payload: { entityId, isVisible },
    timestamp: Date.now(),
    metadata: { source },
  }),

  entitiesSelected: (entityIds: string[], source = 'SelectionSystem'): EntitiesSelectedAction => ({
    type: 'ENTITIES_SELECTED',
    payload: { entityIds },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // User preferences
  userPreferenceChanged: (key: string, value: any, source = 'PreferenceManager'): UserPreferenceChangedAction => ({
    type: 'USER_PREFERENCE_CHANGED',
    payload: { key, value },
    timestamp: Date.now(),
    metadata: { source },
  }),

  themeChanged: (theme: 'light' | 'dark' | 'auto', source = 'ThemeManager'): ThemeChangedAction => ({
    type: 'THEME_CHANGED',
    payload: { theme },
    timestamp: Date.now(),
    metadata: { source },
  }),
};
