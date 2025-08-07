/**
 * Preferences Manager - Sophisticated user preferences management with global state integration
 * This adds advanced preferences management to your physics simulation studio
 */

import { getGlobalStore } from './GlobalStore';
import { Actions } from './Actions';
import { UserPreferenceSelectors } from './Selectors';
import { getErrorManager } from './ErrorManager';
import { Logger } from '../../core/utils/Logger';

export interface PreferenceSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
  validation?: (value: any) => boolean;
  description?: string;
  category?: string;
  hidden?: boolean;
}

export interface PreferenceCategory {
  name: string;
  label: string;
  description?: string;
  icon?: string;
}

export class PreferencesManager {
  private static instance: PreferencesManager | null = null;
  private readonly logger = Logger.getInstance();
  private readonly errorManager = getErrorManager();

  // Preference schemas registry
  private schemas = new Map<string, PreferenceSchema>();

  // Category registry
  private categories = new Map<string, PreferenceCategory>();

  // Storage key for localStorage
  private readonly STORAGE_KEY = 'physics-simulation-studio-preferences';

  private constructor() {
    this.initializeDefaultSchemas();
    this.loadPreferencesFromStorage();
  }

  public static getInstance(): PreferencesManager {
    if (!PreferencesManager.instance) {
      PreferencesManager.instance = new PreferencesManager();
    }
    return PreferencesManager.instance;
  }

  /**
   * Register a preference schema
   */
  registerPreference(schema: PreferenceSchema): void {
    try {
      this.schemas.set(schema.key, schema);

      // Set default value if not already set
      const store = getGlobalStore();
      const currentPreferences = UserPreferenceSelectors.getAllPreferences(store.getState());

      if (!(schema.key in currentPreferences)) {
        this.setPreference(schema.key, schema.defaultValue);
      }

      this.logger.debug(`Registered preference schema: ${schema.key}`, schema);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to register preference schema: ${schema.key}`,
        'error',
        { source: 'PreferencesManager', action: 'registerPreference', additionalData: { schema, error } }
      );
    }
  }

  /**
   * Register a preference category
   */
  registerCategory(category: PreferenceCategory): void {
    try {
      this.categories.set(category.name, category);
      this.logger.debug(`Registered preference category: ${category.name}`, category);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to register preference category: ${category.name}`,
        'error',
        { source: 'PreferencesManager', action: 'registerCategory', additionalData: { category, error } }
      );
    }
  }

  /**
   * Set a preference value
   */
  setPreference(key: string, value: any): void {
    try {
      const schema = this.schemas.get(key);

      // Validate against schema if exists
      if (schema) {
        if (!this.validatePreferenceValue(value, schema)) {
          throw new Error(`Invalid value for preference ${key}: ${value}`);
        }
      }

      // Update global state
      const store = getGlobalStore();
      store.dispatch(Actions.userPreferenceChanged(key, value));

      // Persist to localStorage
      this.savePreferencesToStorage();

      this.logger.debug(`Set preference: ${key} = ${value}`);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to set preference: ${key}`,
        'error',
        { source: 'PreferencesManager', action: 'setPreference', additionalData: { key, value, error } }
      );
      throw error;
    }
  }

  /**
   * Get a preference value
   */
  getPreference<T = any>(key: string, defaultValue?: T): T {
    try {
      const store = getGlobalStore();
      const preferences = UserPreferenceSelectors.getAllPreferences(store.getState());

      if (Object.prototype.hasOwnProperty.call(preferences, key)) {
        return (preferences as any)[key] as T;
      }

      // Check schema for default value
      const schema = this.schemas.get(key);
      if (schema) {
        return schema.defaultValue as T;
      }

      return defaultValue as T;
    } catch (error) {
      this.errorManager.reportError(
        `Failed to get preference: ${key}`,
        'error',
        { source: 'PreferencesManager', action: 'getPreference', additionalData: { key, error } }
      );

      const schema = this.schemas.get(key);
      return (schema?.defaultValue ?? defaultValue) as T;
    }
  }

  /**
   * Reset a preference to its default value
   */
  resetPreference(key: string): void {
    try {
      const schema = this.schemas.get(key);
      if (!schema) {
        throw new Error(`Unknown preference: ${key}`);
      }

      this.setPreference(key, schema.defaultValue);
      this.logger.debug(`Reset preference: ${key} to default value`);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to reset preference: ${key}`,
        'error',
        { source: 'PreferencesManager', action: 'resetPreference', additionalData: { key, error } }
      );
      throw error;
    }
  }

  /**
   * Reset all preferences to default values
   */
  resetAllPreferences(): void {
    try {
      for (const [key, schema] of this.schemas) {
        this.setPreference(key, schema.defaultValue);
      }

      this.logger.debug('Reset all preferences to default values');
    } catch (error) {
      this.errorManager.reportError(
        'Failed to reset all preferences',
        'error',
        { source: 'PreferencesManager', action: 'resetAllPreferences', additionalData: { error } }
      );
      throw error;
    }
  }

  /**
   * Get all preference schemas
   */
  getAllSchemas(): PreferenceSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get schemas by category
   */
  getSchemasByCategory(category: string): PreferenceSchema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.category === category);
  }

  /**
   * Get all categories
   */
  getAllCategories(): PreferenceCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Export preferences as JSON
   */
  exportPreferences(): string {
    try {
      const store = getGlobalStore();
      const preferences = UserPreferenceSelectors.getAllPreferences(store.getState());

      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        preferences
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.errorManager.reportError(
        'Failed to export preferences',
        'error',
        { source: 'PreferencesManager', action: 'exportPreferences', additionalData: { error } }
      );
      throw error;
    }
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (!data.preferences || typeof data.preferences !== 'object') {
        throw new Error('Invalid preferences data format');
      }

      // Validate and set each preference
      for (const [key, value] of Object.entries(data.preferences)) {
        try {
          this.setPreference(key, value);
        } catch (error) {
          this.logger.warn(`Skipped invalid preference during import: ${key}`, { value, error });
        }
      }

      this.logger.debug('Successfully imported preferences', { count: Object.keys(data.preferences).length });
    } catch (error) {
      this.errorManager.reportError(
        'Failed to import preferences',
        'error',
        { source: 'PreferencesManager', action: 'importPreferences', additionalData: { error } }
      );
      throw error;
    }
  }

  /**
   * Validate a preference value against its schema
   */
  private validatePreferenceValue(value: any, schema: PreferenceSchema): boolean {
    // Type validation
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') return false;
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) return false;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return false;
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
        break;
      case 'array':
        if (!Array.isArray(value)) return false;
        break;
    }

    // Custom validation
    if (schema.validation && !schema.validation(value)) {
      return false;
    }

    return true;
  }

  /**
   * Initialize default preference schemas
   */
  private initializeDefaultSchemas(): void {
    // UI Preferences
    this.registerCategory({
      name: 'ui',
      label: 'User Interface',
      description: 'User interface preferences',
      icon: '🎨'
    });

    this.registerPreference({
      key: 'ui.theme',
      type: 'string',
      defaultValue: 'light',
      validation: (value) => ['light', 'dark', 'auto'].includes(value),
      description: 'Application theme',
      category: 'ui'
    });

    this.registerPreference({
      key: 'ui.showGrid',
      type: 'boolean',
      defaultValue: true,
      description: 'Show grid in viewport',
      category: 'ui'
    });

    this.registerPreference({
      key: 'ui.snapToGrid',
      type: 'boolean',
      defaultValue: false,
      description: 'Snap objects to grid',
      category: 'ui'
    });

    this.registerPreference({
      key: 'ui.gridSize',
      type: 'number',
      defaultValue: 10,
      validation: (value) => value > 0 && value <= 100,
      description: 'Grid size in pixels',
      category: 'ui'
    });

    // Performance Preferences
    this.registerCategory({
      name: 'performance',
      label: 'Performance',
      description: 'Performance and optimization preferences',
      icon: '⚡'
    });

    this.registerPreference({
      key: 'performance.maxFPS',
      type: 'number',
      defaultValue: 60,
      validation: (value) => value >= 30 && value <= 120,
      description: 'Maximum frames per second',
      category: 'performance'
    });

    this.registerPreference({
      key: 'performance.enableVSync',
      type: 'boolean',
      defaultValue: true,
      description: 'Enable vertical synchronization',
      category: 'performance'
    });

    // Simulation Preferences
    this.registerCategory({
      name: 'simulation',
      label: 'Simulation',
      description: 'Physics simulation preferences',
      icon: '🔬'
    });

    this.registerPreference({
      key: 'simulation.defaultGravity',
      type: 'number',
      defaultValue: -9.81,
      description: 'Default gravity value',
      category: 'simulation'
    });

    this.registerPreference({
      key: 'simulation.timeStep',
      type: 'number',
      defaultValue: 0.016,
      validation: (value) => value > 0 && value <= 0.1,
      description: 'Physics simulation time step',
      category: 'simulation'
    });

    // Developer Preferences
    this.registerCategory({
      name: 'developer',
      label: 'Developer',
      description: 'Developer and debugging preferences',
      icon: '🛠️'
    });

    this.registerPreference({
      key: 'developer.showDebugInfo',
      type: 'boolean',
      defaultValue: false,
      description: 'Show debug information overlay',
      category: 'developer'
    });

    this.registerPreference({
      key: 'developer.logLevel',
      type: 'string',
      defaultValue: 'info',
      validation: (value) => ['debug', 'info', 'warn', 'error'].includes(value),
      description: 'Logging level',
      category: 'developer'
    });
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferencesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Set preferences without validation to avoid circular dependencies during initialization
        const store = getGlobalStore();
        for (const [key, value] of Object.entries(data)) {
          store.dispatch(Actions.userPreferenceChanged(key, value));
        }

        this.logger.debug('Loaded preferences from localStorage', { count: Object.keys(data).length });
      }
    } catch (error) {
      this.logger.warn('Failed to load preferences from localStorage', { error });
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferencesToStorage(): void {
    try {
      const store = getGlobalStore();
      const preferences = UserPreferenceSelectors.getAllPreferences(store.getState());

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      this.logger.warn('Failed to save preferences to localStorage', { error });
    }
  }
}

/**
 * Convenience function to get the preferences manager
 */
export function getPreferencesManager(): PreferencesManager {
  return PreferencesManager.getInstance();
}
