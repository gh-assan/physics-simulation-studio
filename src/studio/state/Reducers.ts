/**
 * State Reducers - Pure functions that handle state transitions
 * Each reducer is responsible for a specific slice of the application state
 */

import { AppState, PluginInfo, SystemInfo, ComponentInfo } from './AppState';
import { AppAction } from './Actions';

/**
 * Plugin state reducer
 */
function pluginsReducer(plugins: readonly PluginInfo[], action: AppAction): readonly PluginInfo[] {
  switch (action.type) {
    case 'PLUGIN_REGISTERED': {
      const { plugin } = action.payload;
      // Check if plugin already exists
      if (plugins.some(p => p.name === plugin.name)) {
        return plugins; // No change if already registered
      }
      return [...plugins, plugin];
    }
    
    case 'PLUGIN_ACTIVATED': {
      const { pluginName } = action.payload;
      return plugins.map(plugin =>
        plugin.name === pluginName
          ? { ...plugin, isActive: true }
          : plugin
      );
    }
    
    case 'PLUGIN_DEACTIVATED': {
      const { pluginName } = action.payload;
      return plugins.map(plugin =>
        plugin.name === pluginName
          ? { ...plugin, isActive: false }
          : plugin
      );
    }
    
    default:
      return plugins;
  }
}

/**
 * System state reducer
 */
function systemsReducer(systems: readonly SystemInfo[], action: AppAction): readonly SystemInfo[] {
  switch (action.type) {
    case 'SYSTEM_REGISTERED': {
      const { system } = action.payload;
      // Check if system already exists
      if (systems.some(s => s.name === system.name)) {
        return systems; // No change if already registered
      }
      return [...systems, system];
    }
    
    case 'SYSTEM_ACTIVATED': {
      const { systemName } = action.payload;
      return systems.map(system =>
        system.name === systemName
          ? { ...system, isActive: true }
          : system
      );
    }
    
    default:
      return systems;
  }
}

/**
 * Component state reducer
 */
function componentsReducer(components: readonly ComponentInfo[], action: AppAction): readonly ComponentInfo[] {
  switch (action.type) {
    case 'COMPONENT_REGISTERED': {
      const { component } = action.payload;
      // Check if component already exists
      if (components.some(c => c.name === component.name)) {
        return components; // No change if already registered
      }
      return [...components, component];
    }
    
    case 'COMPONENT_ENTITY_COUNT_UPDATED': {
      const { componentName, newCount } = action.payload;
      return components.map(component =>
        component.name === componentName
          ? { ...component, entityCount: newCount }
          : component
      );
    }
    
    default:
      return components;
  }
}

/**
 * UI state reducer
 */
function uiReducer(ui: AppState['ui'], action: AppAction): AppState['ui'] {
  switch (action.type) {
    case 'PANEL_VISIBILITY_CHANGED': {
      const { panelId, isVisible } = action.payload;
      const visiblePanels = isVisible
        ? [...ui.visiblePanels.filter(id => id !== panelId), panelId]
        : ui.visiblePanels.filter(id => id !== panelId);
      
      return {
        ...ui,
        visiblePanels,
      };
    }
    
    case 'ENTITY_SELECTED': {
      const { entityId } = action.payload;
      return {
        ...ui,
        selectedEntity: entityId,
      };
    }
    
    case 'INSPECTOR_MODE_CHANGED': {
      const { mode } = action.payload;
      return {
        ...ui,
        inspectorMode: mode,
      };
    }
    
    default:
      return ui;
  }
}

/**
 * Simulation state reducer
 */
function simulationReducer(simulation: AppState['simulation'], action: AppAction): AppState['simulation'] {
  switch (action.type) {
    case 'SIMULATION_LOADED': {
      const { simulationName } = action.payload;
      return {
        ...simulation,
        currentSimulation: simulationName,
        isRunning: false, // Reset running state when loading new simulation
        isPaused: false,
      };
    }
    
    case 'SIMULATION_UNLOADED': {
      return {
        ...simulation,
        currentSimulation: null,
        isRunning: false,
        isPaused: false,
      };
    }
    
    case 'SIMULATION_STATE_CHANGED': {
      return {
        ...simulation,
        ...action.payload,
      };
    }
    
    default:
      return simulation;
  }
}

/**
 * Viewport state reducer
 */
function viewportReducer(viewport: AppState['viewport'], action: AppAction): AppState['viewport'] {
  switch (action.type) {
    case 'CAMERA_MOVED': {
      const { position, target, zoom } = action.payload;
      return {
        ...viewport,
        camera: {
          position,
          target,
          zoom,
        },
      };
    }
    
    case 'VIEWPORT_SETTINGS_CHANGED': {
      return {
        ...viewport,
        ...action.payload,
      };
    }
    
    default:
      return viewport;
  }
}

/**
 * Root reducer that combines all sub-reducers
 * This is a pure function that takes the current state and an action,
 * and returns the new state
 */
export function rootReducer(state: AppState, action: AppAction): AppState {
  // Always update timestamp when state changes
  const newState = {
    ...state,
    plugins: pluginsReducer(state.plugins, action),
    systems: systemsReducer(state.systems, action),
    components: componentsReducer(state.components, action),
    ui: uiReducer(state.ui, action),
    simulation: simulationReducer(state.simulation, action),
    viewport: viewportReducer(state.viewport, action),
    lastUpdated: Date.now(),
  };
  
  // Only return new state if something actually changed
  if (JSON.stringify(newState) === JSON.stringify(state)) {
    return state; // No change, return original state reference
  }
  
  return newState;
}

/**
 * Utility function to create a reducer that only handles specific action types
 * This can be used for testing or creating specialized reducers
 */
export function createFilteredReducer<T extends AppAction['type']>(
  reducer: typeof rootReducer,
  actionTypes: T[]
) {
  return (state: AppState, action: AppAction): AppState => {
    if (actionTypes.includes(action.type as T)) {
      return reducer(state, action);
    }
    return state;
  };
}
