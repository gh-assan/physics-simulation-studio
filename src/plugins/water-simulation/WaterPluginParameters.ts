/**
 * Water Plugin Parameter Definitions
 * Clean, plugin-owned parameter definitions - no boilerplate classes needed!
 */

import { PluginParameterDescriptor } from "../../core/ui/PluginParameterManager";

// Water droplet component parameter definitions
export const waterDropletComponentParameters: PluginParameterDescriptor[] = [
  {
    key: 'radius',
    label: 'Radius',
    type: 'number',
    min: 0.01,
    max: 1,
    step: 0.01,
    group: 'Size',
    order: 1
  },
  {
    key: 'mass',
    label: 'Mass',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: 'Physics',
    order: 2
  },
  {
    key: 'enableSPH',
    label: 'Enable SPH',
    type: 'boolean',
    group: 'Advanced Physics',
    order: 10
  },
  {
    key: 'smoothingLength',
    label: 'Smoothing Length',
    type: 'number',
    min: 0.01,
    max: 1,
    step: 0.01,
    group: 'Advanced Physics',
    order: 11,
    condition: (component: any) => component.enableSPH === true
  },
  {
    key: 'gasConstant',
    label: 'Gas Constant',
    type: 'number',
    min: 1,
    max: 100,
    step: 1,
    group: 'Advanced Physics',
    order: 12,
    condition: (component: any) => component.enableSPH === true
  },
  {
    key: 'color',
    label: 'Color',
    type: 'color',
    group: 'Appearance',
    order: 20
  }
];

// Water body component parameter definitions
export const waterBodyComponentParameters: PluginParameterDescriptor[] = [
  {
    key: 'viscosity',
    label: 'Viscosity',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    group: 'Physics',
    order: 1
  },
  {
    key: 'surfaceTension',
    label: 'Surface Tension',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    group: 'Physics',
    order: 2
  },
  {
    key: 'density',
    label: 'Density',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: 'Physics',
    order: 3
  }
];

// Export component parameter mapping
export const waterPluginParameterSchema = {
  pluginId: 'water-simulation',
  components: new Map([
    ['WaterDropletComponent', waterDropletComponentParameters],
    ['WaterBodyComponent', waterBodyComponentParameters]
  ])
};
