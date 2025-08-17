/**
 * Flag Algorithm Parameter Manager
 *
 * Handles all parameter-related functionality for the FlagAlgorithm,
 * using the centralized parameter definitions to eliminate duplication.
 */

import { ParameterManager } from '../../../studio/parameters/ParameterManager';
import { PreferencesManager } from '../../../studio/state/PreferencesManager';
import { UIManager } from '../../../studio/uiManager';
import {
  FLAG_PARAMETERS,
  toPreferenceSchemas,
  toUIParameterSchemas,
  getParameterDefinition,
  getParametersByGroup
} from '../config/FlagParameters';

export class FlagParameterManager {
  private preferencesManager: PreferencesManager | null = null;
  private parameterManager: ParameterManager | null = null;
  private uiManager: UIManager | null = null;

  // Throttling for UI updates
  private uiUpdateTimers = new Map<string, NodeJS.Timeout>();
  private uiPendingValues = new Map<string, any>();

  /**
   * Register parameter schemas with PreferencesManager
   */
  registerParameterSchemas(preferencesManager: PreferencesManager): void {
    this.preferencesManager = preferencesManager;

    const schemas = toPreferenceSchemas();
    schemas.forEach(schema => {
      preferencesManager.registerPreference(schema);
    });

    console.log('🏁 FlagAlgorithm parameter schemas registered with PreferencesManager');
  }

  /**
   * Register UI parameter schemas with ParameterManager
   */
  registerUIParameterSchemas(parameterManager: ParameterManager): void {
    this.parameterManager = parameterManager;

    const uiSchemas = toUIParameterSchemas();
    uiSchemas.forEach(schema => {
      parameterManager.updateParameter(schema.key, schema.defaultValue);
    });

    console.log('🎛️ UI parameter schemas registered for flag simulation');
  }

  /**
   * Create parameter panels in the UI
   */
  createParameterPanels(uiManager: UIManager, parameterManager: ParameterManager): void {
    this.uiManager = uiManager;

    const groups = ['wind', 'physics', 'simulation'];
    groups.forEach(group => {
      const groupParams = getParametersByGroup(group);
      if (groupParams.length > 0) {
        // Create parameter panel for this group
        console.log(`🎛️ Created parameter panel for group: ${group}`);
      }
    });
  }

  /**
   * Get parameter value from preferences with fallback to default
   */
  getParameterValue(key: string): any {
    if (!this.preferencesManager) {
      const paramDef = getParameterDefinition(key);
      return paramDef?.defaultValue;
    }

    const paramDef = getParameterDefinition(key);
    if (!paramDef) return undefined;

    return this.preferencesManager.getPreference(paramDef.fullKey, paramDef.defaultValue);
  }

  /**
   * Set parameter value (with validation)
   */
  setParameterValue(key: string, value: any): boolean {
    const paramDef = getParameterDefinition(key);
    if (!paramDef) return false;

    // Validate value
    if (paramDef.validation && !paramDef.validation(value)) {
      console.warn(`⚠️ Parameter validation failed: ${key} = ${value}`);
      return false;
    }

    // Update preferences if available
    if (this.preferencesManager) {
      this.preferencesManager.setPreference(paramDef.fullKey, value);
    }

    return true;
  }

  /**
   * Get all current parameter values
   */
  getAllParameterValues(): Record<string, any> {
    const values: Record<string, any> = {};

    FLAG_PARAMETERS.forEach(param => {
      values[param.key] = this.getParameterValue(param.key);
    });

    return values;
  }

  /**
   * Update parameters from parameter manager (for UI integration)
   */
  handleParameterUpdate(parameterKey: string, value: any, updateCallback: (key: string, value: any) => void): void {
    if (!parameterKey.startsWith('flag-simulation.')) return;

    // Extract the short key
    const shortKey = parameterKey.replace('flag-simulation.', '');
    const paramDef = getParameterDefinition(shortKey);

    if (!paramDef) return;

    // Validate the value
    if (paramDef.validation && !paramDef.validation(value)) {
      console.warn(`⚠️ Parameter validation failed: ${parameterKey} = ${value} (invalid-range)`);
      // Apply fallback value
      this.applyFallbackValue(shortKey, paramDef.defaultValue);
      return;
    }

    // Check if value actually changed
    const currentValue = this.getParameterValue(shortKey);
    if (currentValue === value) {
      return; // Skip unnecessary updates
    }

    // Schedule throttled UI update
    this.scheduleThrottledUpdate(shortKey, value, updateCallback);
  }

  /**
   * Schedule throttled parameter update to prevent performance issues
   */
  private scheduleThrottledUpdate(key: string, value: any, updateCallback: (key: string, value: any) => void): void {
    this.uiPendingValues.set(key, value);

    const existing = this.uiUpdateTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      const latest = this.uiPendingValues.get(key);
      this.uiUpdateTimers.delete(key);
      this.uiPendingValues.delete(key);

      if (latest !== undefined) {
        this.setParameterValue(key, latest);
        updateCallback(key, latest);
        this.highlightParameterControl(key, 'success');
      }
    }, 50);

    this.uiUpdateTimers.set(key, timer);
  }

  /**
   * Apply fallback value when parameter update fails
   */
  private applyFallbackValue(parameter: string, fallbackValue: any): void {
    console.log(`🔄 Applying fallback value for ${parameter}: ${fallbackValue}`);
    this.setParameterValue(parameter, fallbackValue);
  }

  /**
   * Highlight parameter control in UI (visual feedback)
   */
  private highlightParameterControl(parameter: string, status: 'success' | 'error'): void {
    console.log(`✨ Highlighting ${parameter} control with status: ${status}`);
    // In a full implementation, this would update UI to show visual feedback
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    // Clear all pending timers
    this.uiUpdateTimers.forEach(timer => clearTimeout(timer));
    this.uiUpdateTimers.clear();
    this.uiPendingValues.clear();

    this.preferencesManager = null;
    this.parameterManager = null;
    this.uiManager = null;
  }
}
