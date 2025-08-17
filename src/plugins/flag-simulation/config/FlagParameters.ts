/**
 * Flag Simulation Parameter Definitions - SINGLE SOURCE OF TRUTH
 *
 * This file consolidates ALL parameter definitions for the flag simulation
 * to eliminate duplication across multiple files.
 */

import { PreferenceSchema } from '../../../studio/state/PreferencesManager';

/**
 * Core parameter definition with all necessary metadata
 */
export interface FlagParameterDefinition {
  key: string;
  fullKey: string; // With 'flag-simulation.' prefix
  label: string;
  type: 'number' | 'boolean' | 'string';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  group: string;
  order: number;
  description: string;
  validation?: (value: any) => boolean;
  category: string;
}

/**
 * ALL flag simulation parameters defined once
 */
export const FLAG_PARAMETERS: FlagParameterDefinition[] = [
  // Wind Parameters
  {
    key: 'windStrength',
    fullKey: 'flag-simulation.windStrength',
    label: 'Wind Strength',
    type: 'number',
    defaultValue: 2.0,
    min: 0,
    max: 20,
    step: 0.1,
    group: 'wind',
    order: 1,
    description: 'Overall wind force strength',
    validation: (value: number) => value >= 0 && value <= 20,
    category: 'flag-simulation'
  },
  {
    key: 'wind.x',
    fullKey: 'flag-simulation.wind.x',
    label: 'Wind X',
    type: 'number',
    defaultValue: 2.0,
    min: -10,
    max: 10,
    step: 0.1,
    group: 'wind',
    order: 2,
    description: 'Wind direction X component',
    validation: (value: number) => value >= -10 && value <= 10,
    category: 'flag-simulation'
  },
  {
    key: 'wind.z',
    fullKey: 'flag-simulation.wind.z',
    label: 'Wind Z',
    type: 'number',
    defaultValue: 1.0,
    min: -10,
    max: 10,
    step: 0.1,
    group: 'wind',
    order: 3,
    description: 'Wind direction Z component',
    validation: (value: number) => value >= -10 && value <= 10,
    category: 'flag-simulation'
  },

  // Gravity Parameters
  {
    key: 'gravity.x',
    fullKey: 'flag-simulation.gravity.x',
    label: 'Gravity X',
    type: 'number',
    defaultValue: 0.0,
    min: -10,
    max: 10,
    step: 0.1,
    group: 'physics',
    order: 4,
    description: 'Gravity force X component',
    validation: (value: number) => value >= -10 && value <= 10,
    category: 'flag-simulation'
  },
  {
    key: 'gravity.y',
    fullKey: 'flag-simulation.gravity.y',
    label: 'Gravity Y',
    type: 'number',
    defaultValue: -9.81,
    min: -50,
    max: 0,
    step: 0.1,
    group: 'physics',
    order: 5,
    description: 'Gravity force Y component',
    validation: (value: number) => value >= -50 && value <= 0,
    category: 'flag-simulation'
  },
  {
    key: 'gravity.z',
    fullKey: 'flag-simulation.gravity.z',
    label: 'Gravity Z',
    type: 'number',
    defaultValue: 0.0,
    min: -10,
    max: 10,
    step: 0.1,
    group: 'physics',
    order: 6,
    description: 'Gravity force Z component',
    validation: (value: number) => value >= -10 && value <= 10,
    category: 'flag-simulation'
  },

  // Physics Parameters
  {
    key: 'damping',
    fullKey: 'flag-simulation.damping',
    label: 'Damping',
    type: 'number',
    defaultValue: 0.99,
    min: 0.1,
    max: 1.0,
    step: 0.01,
    group: 'physics',
    order: 7,
    description: 'Energy damping factor',
    validation: (value: number) => value >= 0.1 && value <= 1.0,
    category: 'flag-simulation'
  },
  {
    key: 'stiffness',
    fullKey: 'flag-simulation.stiffness',
    label: 'Stiffness',
    type: 'number',
    defaultValue: 0.8,
    min: 0.1,
    max: 1.0,
    step: 0.01,
    group: 'physics',
    order: 8,
    description: 'Spring stiffness factor',
    validation: (value: number) => value >= 0.1 && value <= 1.0,
    category: 'flag-simulation'
  },

  // Simulation Parameters
  {
    key: 'timestep',
    fullKey: 'flag-simulation.timestep',
    label: 'Timestep',
    type: 'number',
    defaultValue: 1 / 60,
    min: 1 / 240,
    max: 1 / 30,
    step: 0.001,
    group: 'simulation',
    order: 9,
    description: 'Physics simulation timestep',
    validation: (value: number) => value >= 1 / 240 && value <= 1 / 30,
    category: 'flag-simulation'
  },

  // Dimension Parameters
  {
    key: 'height',
    fullKey: 'flag-simulation.height',
    label: 'Height',
    type: 'number',
    defaultValue: 0.6,
    min: 0.1,
    max: 2.0,
    step: 0.1,
    group: 'simulation',
    order: 10,
    description: 'Flag height dimension',
    validation: (value: number) => value >= 0.1 && value <= 2.0,
    category: 'flag-simulation'
  },
  {
    key: 'radius',
    fullKey: 'flag-simulation.radius',
    label: 'Radius',
    type: 'number',
    defaultValue: 0.02,
    min: 0.01,
    max: 0.1,
    step: 0.01,
    group: 'simulation',
    order: 11,
    description: 'Flag pole radius',
    validation: (value: number) => value >= 0.01 && value <= 0.1,
    category: 'flag-simulation'
  }
];

/**
 * Get parameter definition by key
 */
export function getParameterDefinition(key: string): FlagParameterDefinition | undefined {
  return FLAG_PARAMETERS.find(p => p.key === key || p.fullKey === key);
}

/**
 * Get parameters by group
 */
export function getParametersByGroup(group: string): FlagParameterDefinition[] {
  return FLAG_PARAMETERS.filter(p => p.group === group);
}

/**
 * Convert to PreferenceSchema format (for PreferencesManager)
 */
export function toPreferenceSchemas(): PreferenceSchema[] {
  return FLAG_PARAMETERS.map(param => ({
    key: param.fullKey,
    type: param.type,
    defaultValue: param.defaultValue,
    validation: param.validation,
    description: param.description,
    category: param.category
  }));
}

/**
 * Convert to UI parameter format (for ParameterManager)
 */
export function toUIParameterSchemas(): any[] {
  return FLAG_PARAMETERS.map(param => ({
    key: param.fullKey,
    label: param.label,
    type: param.type,
    defaultValue: param.defaultValue,
    constraints: {
      min: param.min,
      max: param.max,
      step: param.step
    },
    group: param.group,
    order: param.order
  }));
}

/**
 * Convert to plugin parameter schema format (for plugin compatibility)
 */
export function toPluginParameterSchema(): any {
  const components = new Map();

  components.set('FlagComponent', FLAG_PARAMETERS.map(param => ({
    key: param.key,
    label: param.label,
    type: param.type,
    min: param.min,
    max: param.max,
    step: param.step,
    group: param.group,
    order: param.order
  })));

  return {
    pluginId: 'flag-simulation',
    name: 'Flag Simulation',
    components
  };
}

/**
 * Get all parameter groups
 */
export function getParameterGroups(): string[] {
  return [...new Set(FLAG_PARAMETERS.map(p => p.group))];
}

/**
 * Get default values for all parameters
 */
export function getDefaultValues(): Record<string, any> {
  const defaults: Record<string, any> = {};
  FLAG_PARAMETERS.forEach(param => {
    defaults[param.fullKey] = param.defaultValue;
  });
  return defaults;
}
