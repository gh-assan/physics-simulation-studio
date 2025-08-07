/**
 * Flag Plugin Parameter Definitions
 * Clean, plugin-owned parameter definitions - no boilerplate classes needed!
 */

import { PluginParameterDescriptor } from "../../core/ui/PluginParameterManager";

// Flag component parameter definitions
export const flagComponentParameters: PluginParameterDescriptor[] = [
  {
    key: 'width',
    label: 'Flag Width',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: 'Dimensions',
    order: 1
  },
  {
    key: 'height',
    label: 'Flag Height', 
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: 'Dimensions',
    order: 2
  },
  {
    key: 'stiffness',
    label: 'Stiffness',
    type: 'number',
    min: 0.1,
    max: 1,
    step: 0.01,
    group: 'Physics',
    order: 10
  },
  {
    key: 'damping',
    label: 'Damping',
    type: 'number',
    min: 0.01,
    max: 1,
    step: 0.01,
    group: 'Physics',
    order: 11
  },
  {
    key: 'windStrength',
    label: 'Wind Strength',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    group: 'Environment',
    order: 20
  },
  {
    key: 'windDirection.x',
    label: 'Wind Direction X',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.1,
    group: 'Environment',
    order: 21
  },
  {
    key: 'windDirection.y',
    label: 'Wind Direction Y',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.1,
    group: 'Environment',
    order: 22
  },
  {
    key: 'windDirection.z',
    label: 'Wind Direction Z',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.1,
    group: 'Environment',
    order: 23
  },
  {
    key: 'textureUrl',
    label: 'Texture URL',
    type: 'text',
    group: 'Appearance',
    order: 30
  }
];

// Pole component parameter definitions
export const poleComponentParameters: PluginParameterDescriptor[] = [
  {
    key: 'height',
    label: 'Pole Height',
    type: 'number',
    min: 1,
    max: 50,
    step: 0.1,
    group: 'Dimensions',
    order: 1
  },
  {
    key: 'radius',
    label: 'Pole Radius',
    type: 'number',
    min: 0.01,
    max: 2,
    step: 0.01,
    group: 'Dimensions',
    order: 2
  }
];

// Export component parameter mapping
export const flagPluginParameterSchema = {
  pluginId: 'flag-simulation',
  components: new Map([
    ['FlagComponent', flagComponentParameters],
    ['PoleComponent', poleComponentParameters]
  ])
};
