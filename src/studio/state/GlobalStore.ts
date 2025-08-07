/**
 * Global State Store - Redux-style state management for the Physics Simulation Studio
 * This provides a centralized, immutable state container with predictable state updates
 */

import { AppState, createInitialAppState } from './AppState';
import { AppAction } from './Actions';
import { rootReducer } from './Reducers';

/**
 * State change listener callback
 */
export type StateChangeListener = (newState: AppState, previousState: AppState, action: AppAction) => void;

/**
 * State selector function - extracts specific data from the state
 */
export type StateSelector<T> = (state: AppState) => T;

/**
 * Store subscription interface
 */
export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Global State Store
 * Provides Redux-style state management with immutable state updates
 */
export class GlobalStateStore {
  private state: AppState;
  private listeners: Set<StateChangeListener> = new Set();
  private isDispatching: boolean = false;
  private actionHistory: AppAction[] = [];
  private readonly maxHistorySize: number = 100;

  constructor(initialState?: AppState) {
    this.state = initialState || createInitialAppState();
  }

  /**
   * Get the current state (read-only)
   */
  getState(): Readonly<AppState> {
    return this.state;
  }

  /**
   * Dispatch an action to update the state
   * This is the only way to modify the state
   */
  dispatch(action: AppAction): void {
    if (this.isDispatching) {
      throw new Error('Cannot dispatch an action while already dispatching');
    }

    try {
      this.isDispatching = true;
      const previousState = this.state;
      
      // Apply the reducer to get the new state
      this.state = rootReducer(this.state, action);

      // Add to action history
      this.addToHistory(action);

      // Notify all listeners if state actually changed
      if (this.state !== previousState) {
        this.notifyListeners(this.state, previousState, action);
      }
    } finally {
      this.isDispatching = false;
    }
  }

  /**
   * Subscribe to state changes
   * Returns a subscription object that can be used to unsubscribe
   */
  subscribe(listener: StateChangeListener): Subscription {
    this.listeners.add(listener);
    
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      }
    };
  }

  /**
   * Select specific data from the state
   * This is useful for subscribing to only specific parts of the state
   */
  select<T>(selector: StateSelector<T>): T {
    return selector(this.state);
  }

  /**
   * Subscribe to changes in a specific part of the state
   * Only calls the callback when the selected data changes
   */
  selectSubscribe<T>(
    selector: StateSelector<T>,
    callback: (newValue: T, previousValue: T, state: AppState, action: AppAction) => void,
    equalityFn?: (a: T, b: T) => boolean
  ): Subscription {
    let previousValue = selector(this.state);
    
    const listener: StateChangeListener = (newState, previousState, action) => {
      const newValue = selector(newState);
      
      // Use custom equality function or default shallow equality
      const isEqual = equalityFn ? equalityFn(newValue, previousValue) : newValue === previousValue;
      
      if (!isEqual) {
        callback(newValue, previousValue, newState, action);
        previousValue = newValue;
      }
    };

    return this.subscribe(listener);
  }

  /**
   * Get action history for debugging
   */
  getActionHistory(): readonly AppAction[] {
    return [...this.actionHistory];
  }

  /**
   * Clear action history
   */
  clearHistory(): void {
    this.actionHistory = [];
  }

  /**
   * Create a state snapshot for debugging or testing
   */
  createSnapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Restore state from snapshot (useful for testing)
   */
  restoreSnapshot(snapshot: AppState): void {
    this.state = snapshot;
    // Don't notify listeners for snapshot restoration
  }

  /**
   * Get store statistics for debugging
   */
  getStats() {
    return {
      listenerCount: this.listeners.size,
      actionHistorySize: this.actionHistory.length,
      isDispatching: this.isDispatching,
      stateSize: JSON.stringify(this.state).length,
      lastUpdated: this.state.lastUpdated,
    };
  }

  /**
   * Private method to notify all listeners
   */
  private notifyListeners(newState: AppState, previousState: AppState, action: AppAction): void {
    for (const listener of this.listeners) {
      try {
        listener(newState, previousState, action);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }
  }

  /**
   * Private method to add action to history
   */
  private addToHistory(action: AppAction): void {
    this.actionHistory.push(action);
    
    // Limit history size to prevent memory leaks
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Singleton instance of the global state store
 * This ensures a single source of truth across the entire application
 */
let globalStore: GlobalStateStore | null = null;

/**
 * Get the global state store instance
 * Creates one if it doesn't exist
 */
export function getGlobalStore(): GlobalStateStore {
  if (!globalStore) {
    globalStore = new GlobalStateStore();
  }
  return globalStore;
}

/**
 * Initialize the global store with specific state
 * This should only be called once during application startup
 */
export function initializeGlobalStore(initialState?: AppState): GlobalStateStore {
  if (globalStore) {
    throw new Error('Global store has already been initialized');
  }
  globalStore = new GlobalStateStore(initialState);
  return globalStore;
}

/**
 * Reset the global store (useful for testing)
 */
export function resetGlobalStore(): void {
  globalStore = null;
}

/**
 * Convenience function to dispatch actions to the global store
 */
export function dispatchGlobal(action: AppAction): void {
  getGlobalStore().dispatch(action);
}

/**
 * Convenience function to get the current global state
 */
export function getGlobalState(): Readonly<AppState> {
  return getGlobalStore().getState();
}
