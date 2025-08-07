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
  | ApplicationShutdownAction;

/**
 * Action Creators - Helper functions to create actions with consistent structure
 */

export const Actions = {
  // Plugin actions
  pluginRegistered: (plugin: PluginInfo, source: string = 'PluginManager'): PluginRegisteredAction => ({
    type: 'PLUGIN_REGISTERED',
    payload: { plugin },
    timestamp: Date.now(),
    metadata: { source },
  }),

  pluginActivated: (pluginName: string, source: string = 'PluginManager'): PluginActivatedAction => ({
    type: 'PLUGIN_ACTIVATED',
    payload: { pluginName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  pluginDeactivated: (pluginName: string, source: string = 'PluginManager'): PluginDeactivatedAction => ({
    type: 'PLUGIN_DEACTIVATED',
    payload: { pluginName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // System actions
  systemRegistered: (system: SystemInfo, source: string = 'SystemManager'): SystemRegisteredAction => ({
    type: 'SYSTEM_REGISTERED',
    payload: { system },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Component actions
  componentRegistered: (component: ComponentInfo, source: string = 'ComponentManager'): ComponentRegisteredAction => ({
    type: 'COMPONENT_REGISTERED',
    payload: { component },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // UI actions
  entitySelected: (entityId: string | null, source: string = 'SelectionSystem'): EntitySelectedAction => ({
    type: 'ENTITY_SELECTED',
    payload: { entityId },
    timestamp: Date.now(),
    metadata: { source },
  }),

  panelVisibilityChanged: (panelId: string, isVisible: boolean, source: string = 'VisibilityManager'): PanelVisibilityChangedAction => ({
    type: 'PANEL_VISIBILITY_CHANGED',
    payload: { panelId, isVisible },
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Simulation actions
  simulationLoaded: (simulationName: string, source: string = 'Studio'): SimulationLoadedAction => ({
    type: 'SIMULATION_LOADED',
    payload: { simulationName },
    timestamp: Date.now(),
    metadata: { source },
  }),

  simulationUnloaded: (source: string = 'Studio'): SimulationUnloadedAction => ({
    type: 'SIMULATION_UNLOADED',
    timestamp: Date.now(),
    metadata: { source },
  }),

  // Viewport actions
  cameraMoved: (position: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, zoom: number, source: string = 'CameraControls'): CameraMovedAction => ({
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
};
